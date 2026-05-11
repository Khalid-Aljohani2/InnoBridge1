<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminUsersController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->role === 'admin', 403);

        $users = User::query()
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString()
            ->through(static function (User $u): array {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'department' => $u->department,
                    'canImpersonate' => $u->role !== 'admin',
                ];
            });

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }
}
