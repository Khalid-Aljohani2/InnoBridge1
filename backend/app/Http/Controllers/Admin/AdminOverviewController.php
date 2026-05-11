<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminOverviewController extends Controller
{
    public function show(): Response
    {
        $user = auth()->user();
        abort_unless($user && $user->role === 'admin', 403);

        $roleCounts = User::query()
            ->selectRaw('role, COUNT(*) as c')
            ->groupBy('role')
            ->pluck('c', 'role')
            ->all();

        return Inertia::render('Admin/Overview', [
            'counts' => [
                'users' => User::query()->count(),
                'teams' => Schema::hasTable('teams') ? Team::query()->count() : 0,
                'projects' => Schema::hasTable('projects') ? Project::query()->count() : 0,
            ],
            'usersByRole' => $roleCounts,
        ]);
    }
}
