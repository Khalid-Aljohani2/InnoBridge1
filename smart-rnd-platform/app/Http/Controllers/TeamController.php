<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Services\TeamInvitationService;
use App\Services\TeamService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService,
        private readonly TeamInvitationService $teamInvitationService,
    ) {}

    public function show(Request $request)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return redirect()->route('dashboard')->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        return Inertia::render('Student/Team', $this->teamService->studentTeamPageData($user));
    }

    public function create(Request $request)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ], [
            'name.required' => 'اكتب اسم الفريق.',
            'name.max' => 'اسم الفريق طويل جداً.',
        ]);

        $result = $this->teamService->createTeamForStudent($user, $validated);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function addMember(Request $request)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            // Allow adding by email OR university_id (single input).
            'identifier' => 'required|string|max:255',
        ]);

        // New flow: send invitation instead of direct join.
        $result = $this->teamInvitationService->inviteByIdentifier($user, (string) $validated['identifier']);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function join(Request $request, Team $team)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $result = $this->teamService->joinPublicTeam($user, (int) $team->id);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function decideInvite(Request $request, TeamInvitation $invitation)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            'decision' => 'required|in:accept,reject',
        ]);

        $result = $this->teamInvitationService->decideInvite($user, $invitation, (string) $validated['decision']);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function removeMember(Request $request, int $memberUserId)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $result = $this->teamService->removeMember($user, $memberUserId);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function leave(Request $request)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $result = $this->teamService->leaveTeam($user);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }
}
