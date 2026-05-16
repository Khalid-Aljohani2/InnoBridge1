<?php

namespace App\Http\Controllers;

use App\Models\ChallengeRequest;
use App\Models\IndustryChallenge;
use App\Models\SupervisorGroup;
use App\Models\Team;
use App\Models\User;
use App\Support\CachedSchema;
use App\Services\ChallengeWorkflowService;
use App\Services\GroupManagementService;
use App\Services\TeamJoinPolicyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PortalController extends Controller
{
    public function __construct(
        private readonly ChallengeWorkflowService $challengeWorkflowService,
        private readonly GroupManagementService $groupManagementService,
        private readonly TeamJoinPolicyService $teamJoinPolicyService,
    ) {}

    private function hodMayAccessTeam(User $user, Team $team): bool
    {
        return $this->groupManagementService->hodMayAccessTeamModel($user, $team);
    }

    public function studentIndustryChallenges(Request $request)
    {
        $user = $request->user();
        $teamMember = \App\Models\TeamMember::where('user_id', $user->id)->with('team')->first();
        $hasApprovedSupervisor = $teamMember && $teamMember->team && !empty($teamMember->team->supervisor_id) && $teamMember->team->review_status === 'approved';

        return Inertia::render('Student/IndustryChallenges', [
            'challenges' => $hasApprovedSupervisor ? $this->challengeWorkflowService->queryCompanyChallengesApproved()->get() : [],
            'has_supervisor' => $hasApprovedSupervisor,
        ]);
    }

    public function studentRequestChallenge(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'student') {
            abort(403);
        }

        $teamMember = \App\Models\TeamMember::where('user_id', $user->id)->with('team')->first();
        if (!$teamMember || !$teamMember->team || empty($teamMember->team->supervisor_id) || $teamMember->team->review_status !== 'approved') {
            abort(403, 'You must be in an approved team with an assigned supervisor to request an industry challenge.');
        }

        $request->validate([
            'industry_challenge_id' => 'required|integer|exists:industry_challenges,id',
        ]);

        $result = $this->challengeWorkflowService->createChallengeRequest($request->user(), (int) $request->industry_challenge_id);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function supervisorPendingChallengeRequests(Request $request)
    {
        return Inertia::render('Supervisor/ChallengeRequests', [
            'requests' => $this->challengeWorkflowService->supervisorPendingRequests($request->user()),
        ]);
    }

    public function supervisorDecideChallengeRequest(Request $request, ChallengeRequest $challengeRequest)
    {
        $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->supervisorDecideRequest(
            $request->user(),
            $challengeRequest,
            (string) $request->decision,
            $request->notes
        );

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodPanel(Request $request)
    {
        // Remote DB (e.g. Supabase) can push total wall time past PHP’s default 60s; allow headroom while loading aggregates.
        if (function_exists('set_time_limit')) {
            set_time_limit(120);
        }

        return Inertia::render('Supervisor/HodPanel', [
            'supervisors' => $this->groupManagementService->supervisorsForHoD($request->user()),
            'groups' => $this->groupManagementService->teamsForUser($request->user()),
            'teamJoinEnabled' => $this->teamJoinPolicyService->isEnabled(),
        ]);
    }

    public function hodIndustryChallenges(Request $request)
    {
        if (function_exists('set_time_limit')) {
            set_time_limit(120);
        }

        $user = $request->user();

        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $pendingChallenges = $this->challengeWorkflowService->queryCompanyChallengesPendingHoD()->get();

        return Inertia::render('Supervisor/HodIndustryChallenges', [
            'pendingCompanyChallenges' => $pendingChallenges,
            'awaitingPublicationChallenges' => $this->challengeWorkflowService->queryCompanyChallengesAwaitingStudentPublication()->get(),
            'userRole' => $user->role,
        ]);
    }

    public function hodPublishIndustryChallengeForStudents(Request $request, IndustryChallenge $industryChallenge)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $result = $this->challengeWorkflowService->hodPublishCompanyChallengeToStudents($user, $industryChallenge);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodReviewIndustryChallenge(Request $request, IndustryChallenge $industryChallenge)
    {
        $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            abort(403, 'Unauthorized action. Only Head of Department can accept or reject industry challenges.');
        }

        $result = $this->challengeWorkflowService->hodReviewCompanyChallenge(
            $user,
            $industryChallenge,
            (string) $request->decision,
            $request->notes ? trim((string) $request->notes) : null
        );

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodToggleTeamJoin(Request $request)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $this->teamJoinPolicyService->setEnabled((bool) $validated['enabled']);

        return back()->with('success', (bool) $validated['enabled']
            ? 'تم فتح الانضمام للفرق للطلاب.'
            : 'تم إغلاق الانضمام للفرق للطلاب.');
    }

    public function hodTeamsMonitor(Request $request)
    {
        if (function_exists('set_time_limit')) {
            set_time_limit(120);
        }

        return Inertia::render('Supervisor/HodTeamsMonitor', [
            'teams' => $this->groupManagementService->teamsMonitorForUser($request->user()),
        ]);
    }

    public function hodAssignSupervisor(Request $request, Team $team)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }
        if (! $this->hodMayAccessTeam($user, $team)) {
            return back()->with('error', 'Forbidden');
        }

        $request->validate([
            'supervisor_id' => 'required|integer|exists:users,id',
        ]);
        $result = $this->groupManagementService->assignTeamToSupervisor($request->user(), $team, (int) $request->supervisor_id);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodReviewTeam(Request $request, Team $team)
    {
        $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }
        if (! $this->hodMayAccessTeam($user, $team)) {
            return back()->with('error', 'Forbidden');
        }

        $decision = $request->decision === 'approve' ? 'approved' : 'rejected';
        $team->update([
            'review_status' => $decision,
            'review_notes' => $request->notes ? trim((string) $request->notes) : null,
            'reviewed_by_user_id' => $user->id,
            'reviewed_at' => now(),
            'is_active' => $decision === 'approved',
        ]);

        if ($decision === 'approved') {
            $this->groupManagementService->syncSupervisorChatGroupsForTeam($team->fresh());
        }

        if ($user->role === 'hod') {
            GroupManagementService::bustHoDDashboardPreviewCache($user);
        }

        return back()->with('success', $decision === 'approved' ? 'Team approved' : 'Team rejected');
    }

    public function hodDismantleTeam(Request $request, Team $team)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }
        if (! $this->hodMayAccessTeam($user, $team)) {
            return back()->with('error', 'Forbidden');
        }

        DB::transaction(function () use ($team) {
            $team = Team::lockForUpdate()->findOrFail($team->id);

            $supervisorGroupId = (int) ($team->supervisor_group_id ?? 0);
            $studentsGroupId = (int) ($team->students_group_id ?? 0);

            if ($supervisorGroupId) {
                SupervisorGroup::whereKey($supervisorGroupId)->delete();
            }
            if ($studentsGroupId) {
                SupervisorGroup::whereKey($studentsGroupId)->delete();
            }

            // Deleting the team will cascade delete team_members, team_invitations, and the linked project (teams.project_id).
            $team->delete();
        });

        if ($user->role === 'hod') {
            GroupManagementService::bustHoDDashboardPreviewCache($user);
        }

        return back()->with('success', 'Team dismantled');
    }

    public function hodDeleteSupervisor(Request $request, User $supervisor)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        if ($supervisor->role !== 'supervisor') {
            return back()->with('error', 'Selected account is not a supervisor.');
        }

        if ((int) $supervisor->id === (int) $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        if ($user->role === 'hod') {
            if (filled($user->department)) {
                $supDept = $supervisor->department ?? null;
                if (filled($supDept) && (string) $supDept !== (string) $user->department) {
                    return back()->with('error', 'Forbidden');
                }
            }
        }

        if (! CachedSchema::hasColumn('users', 'is_active')) {
            return back()->with('error', 'System is not ready yet. Please run migrations first.');
        }

        if ((bool) $supervisor->is_active === false) {
            return back()->with('success', 'Supervisor account is already deactivated.');
        }

        $supervisor->update([
            'is_active' => false,
        ]);

        if ($user->role === 'hod') {
            GroupManagementService::bustHoDDashboardPreviewCache($user);
        }

        return back()->with('success', 'Supervisor account has been deactivated.');
    }

    public function hodActivateSupervisor(Request $request, User $supervisor)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        if ($supervisor->role !== 'supervisor') {
            return back()->with('error', 'Selected account is not a supervisor.');
        }

        if ($user->role === 'hod') {
            if (filled($user->department)) {
                $supDept = $supervisor->department ?? null;
                if (filled($supDept) && (string) $supDept !== (string) $user->department) {
                    return back()->with('error', 'Forbidden');
                }
            }
        }

        if (! CachedSchema::hasColumn('users', 'is_active')) {
            return back()->with('error', 'System is not ready yet. Please run migrations first.');
        }

        if ((bool) $supervisor->is_active === true) {
            return back()->with('success', 'Supervisor account is already active.');
        }

        $supervisor->update([
            'is_active' => true,
        ]);

        if ($user->role === 'hod') {
            GroupManagementService::bustHoDDashboardPreviewCache($user);
        }

        return back()->with('success', 'Supervisor account has been reactivated.');
    }

    public function industryPortal(Request $request)
    {
        $user = $request->user();

        $myChallenges = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->where('kind', 'company_challenge')
            ->where('posted_by_user_id', $user->id)
            ->latest()
            ->get();

        $requests = $this->challengeWorkflowService->industryRequestsForCompany($user);

        return Inertia::render('Industry/Portal', [
            'challenges' => $myChallenges,
            'requests' => $requests,
        ]);
    }

    public function industryCreateChallenge(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'nullable|date',
        ]);

        $result = $this->challengeWorkflowService->createCompanyChallenge($request->user(), $validated);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodIndustryNominations(Request $request)
    {
        return Inertia::render('Supervisor/HodIndustryNominations', [
            'poolRequests' => $this->challengeWorkflowService->hodIndustryRequestsAwaitingNomination($request->user())->values()->all(),
            'declineTemplates' => $this->challengeWorkflowService->hodStudentDeclineTemplates(),
        ]);
    }

    public function hodNominateIndustryTeams(Request $request)
    {
        $validated = $request->validate([
            'challenge_request_ids' => 'required|array|min:1',
            'challenge_request_ids.*' => 'integer|exists:challenge_requests,id',
        ]);

        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $ids = array_map(static fn ($v) => (int) $v, $validated['challenge_request_ids']);

        $result = $this->challengeWorkflowService->hodNominateTeamsToCompany($user, $ids);

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function hodDeclineIndustryNomination(Request $request, ChallengeRequest $challengeRequest)
    {
        $validated = $request->validate([
            'template_key' => 'required|string|max:80',
            'notes' => 'nullable|string|max:2000',
        ]);

        $user = $request->user();
        if (! in_array($user?->role, ['hod', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $result = $this->challengeWorkflowService->hodDeclineTeamWithoutCompanyNomination(
            $user,
            $challengeRequest,
            (string) $validated['template_key'],
            isset($validated['notes']) ? trim((string) $validated['notes']) : null,
        );

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function supervisorTeamWorkspace(Request $request, Team $team)
    {
        $validated = $request->validate([
            'workspace' => 'required|in:student,industry',
        ]);

        $result = $this->challengeWorkflowService->supervisorDesignatedWorkspace(
            $request->user(),
            $team,
            (string) $validated['workspace']
        );

        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function industryDecide(Request $request, ChallengeRequest $challengeRequest)
    {
        $request->validate([
            'decision' => 'required|in:reject,accept,approve',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->industryDecide($request->user(), $challengeRequest, (string) $request->decision, $request->notes);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }
}

