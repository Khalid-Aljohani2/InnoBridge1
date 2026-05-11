<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    public function start(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();
        abort_unless($admin && $admin->role === 'admin', 403);

        if ($request->session()->has('impersonator_id')) {
            return redirect()
                ->route('dashboard')
                ->with('error', __('Already viewing as another user. Exit impersonation first.'));
        }

        if ($user->role === 'admin') {
            return back()->with('error', __('Cannot impersonate another administrator.'));
        }

        if (($user->is_active ?? true) === false) {
            return back()->with('error', __('This account is deactivated.'));
        }

        abort_if((int) $user->id === (int) $admin->id, 403);

        $request->session()->put('impersonator_id', $admin->id);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()
            ->route('dashboard')
            ->with('success', __('Reviewing as :name.', ['name' => $user->name]));
    }

    public function leave(Request $request): RedirectResponse
    {
        $adminId = $request->session()->pull('impersonator_id');

        abort_unless($adminId, 403);

        $admin = User::query()->findOrFail($adminId);
        abort_unless($admin->role === 'admin', 403);

        Auth::login($admin);
        $request->session()->regenerate();

        return redirect()
            ->route('admin.users.index')
            ->with('success', __('Returned to administrator account.'));
    }
}
