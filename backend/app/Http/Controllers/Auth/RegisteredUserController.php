<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        $preset = match ($request->query('role')) {
            'faculty' => 'faculty',
            'industry' => 'industry',
            default => 'student',
        };

        return Inertia::render('Auth/Register', [
            'registrationPreset' => $preset,
        ]);
    }

    /**
     * شركة / جهة صناعية — نفس الواجهة preset=industry بمسار URL واضح.
     */
    public function createIndustry(): Response
    {
        return Inertia::render('Auth/Register', [
            'registrationPreset' => 'industry',
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'registration_kind' => ['nullable', 'in:student,faculty,industry'],
            'faculty_role' => ['nullable', 'required_if:registration_kind,faculty', 'in:hod,supervisor'],
        ]);

        $kind = $request->input('registration_kind', 'student');
        $role = match ($kind) {
            'faculty' => (string) $request->input('faculty_role'),
            'industry' => 'industry',
            default => 'student',
        };

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => $role,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        if ($role === 'industry') {
            return redirect()->route('industry.portal');
        }

        return redirect(route('dashboard', absolute: false));
    }
}
