<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    private function normalizeRole(?string $role): ?string
    {
        if (! $role) {
            return null;
        }

        $role = strtolower($role);

        return match ($role) {
            'student', 'supervisor', 'hod', 'industry', 'admin' => $role,
            default => null,
        };
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Align validation / auth error language with the active UI on the login screen.
     */
    protected function prepareForValidation(): void
    {
        $locale = $this->input('login_locale');
        if (in_array($locale, ['ar', 'en'], true)) {
            App::setLocale($locale);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => [
                Rule::requiredIf(fn () => ! config('auth.passwordless_login')),
                'nullable',
                'string',
            ],
            'selected_role' => ['nullable', 'in:student,supervisor,hod,industry,admin'],
            'login_locale' => ['nullable', 'in:ar,en'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $passwordless = (bool) config('auth.passwordless_login');

        if ($passwordless) {
            /** @var \App\Models\User|null $user */
            $user = User::query()->where('email', $this->string('email')->toString())->first();

            if (! $user) {
                RateLimiter::hit($this->throttleKey());

                throw ValidationException::withMessages([
                    'email' => trans('auth.failed'),
                ]);
            }

            Auth::login($user, $this->boolean('remember'));
        } elseif (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        $selectedRole = $this->normalizeRole($this->string('selected_role')->toString());
        $actualRole = $this->normalizeRole(Auth::user()?->role);
        $roleOk = $selectedRole
            ? ($actualRole === $selectedRole)
            : true;
        if (! $roleOk) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.role_mismatch'),
            ]);
        }

        $hasIsActiveColumn = Schema::hasColumn('users', 'is_active');
        if ($hasIsActiveColumn && Auth::user() && (bool) Auth::user()->is_active === false) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.account_deactivated'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
