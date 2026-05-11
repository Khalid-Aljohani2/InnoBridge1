<?php

namespace App\Services;

use App\Models\IndustryChallenge;
use App\Models\Project;
use App\Models\SupervisorGroupMember;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TeamService
{
    public function __construct(
        private readonly TeamInvitationService $teamInvitationService,
        private readonly TeamJoinPolicyService $teamJoinPolicyService,
    ) {}

    public function studentTeamPageData(User $student): array
    {
        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        $team = $teamId
            ? Team::with([
                'leader:id,name,email',
                'supervisor:id,name,email,role',
                'members.user:id,name,email,role',
                'project:id,title,status,industry_challenge_id,current_progress,milestone_plan_id',
                'project.milestonePlan:id,name',
                'project.milestones' => fn ($q) => $q->orderBy('sequence'),
            ])->find((int) $teamId)
            : null;

        $availableTeams = collect();
        if (! $team && $this->teamJoinPolicyService->isEnabled()) {
            // Unbounded roster fetch explodes latency on remote DB (students without a team list "joinable" teams).
            $availableTeams = Team::query()
                ->withCount('members')
                ->with(['leader:id,name', 'supervisor:id,name'])
                ->where('is_active', true)
                ->where('review_status', 'approved')
                ->orderByDesc('id')
                ->limit(200)
                ->get()
                ->values();
        }

        return [
            'team' => $team,
            'pendingInvitations' => $this->teamInvitationService->pendingInvitesForStudent($student),
            'availableTeams' => $availableTeams,
            'teamJoinEnabled' => $this->teamJoinPolicyService->isEnabled(),
            'hasStudentIdeaUploaded' => $this->studentHasUploadedIdea($student),
        ];
    }

    public function createTeamForStudent(User $student, array $validated): array
    {
        if ($student->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if (! $this->studentHasUploadedIdea($student)) {
            return [
                'ok' => false,
                'message' => 'يجب رفع فكرة المشروع من صفحة «رفع الملفات» قبل إنشاء فريق.',
            ];
        }

        $alreadyInTeam = TeamMember::where('user_id', $student->id)->exists();
        if ($alreadyInTeam) {
            return ['ok' => false, 'message' => 'You are already in a team'];
        }

        return DB::transaction(function () use ($student, $validated) {
            $project = Project::create([
                'title' => 'Team: '.trim((string) $validated['name']),
                'abstract' => null,
                'type' => 'student_initiated',
                'industry_challenge_id' => null,
                'owner_user_id' => $student->id,
                'status' => 'draft',
                'current_progress' => 0,
                'start_date' => null,
            ]);

            $team = Team::create([
                'project_id' => $project->id,
                'name' => trim((string) $validated['name']),
                'department' => $student->department ?? null,
                'leader_id' => $student->id,
                'supervisor_id' => null,
                'max_members' => 4,
                // Teams require HoD approval before becoming active.
                'is_active' => false,
                'review_status' => 'pending',
            ]);

            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $student->id,
                'role_in_team' => 'leader',
            ]);

            return ['ok' => true, 'message' => 'Team created', 'data' => $team];
        });
    }

    public function addMemberByEmail(User $actor, string $email): array
    {
        if ($actor->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $teamId = TeamMember::query()
            ->where('user_id', $actor->id)
            ->value('team_id');
        if (! $teamId) {
            return ['ok' => false, 'message' => 'Create a team first'];
        }

        $team = Team::withCount('members')->find((int) $teamId);
        if (! $team) {
            return ['ok' => false, 'message' => 'Team not found'];
        }

        if ((int) $team->leader_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Only team leader can add members'];
        }

        $member = User::query()->where('email', $email)->first();
        if (! $member || $member->role !== 'student') {
            return ['ok' => false, 'message' => 'Student not found'];
        }

        if ((int) $member->id === (int) $actor->id) {
            return ['ok' => false, 'message' => 'You are already the leader'];
        }

        $memberHasTeam = TeamMember::where('user_id', $member->id)->exists();
        if ($memberHasTeam) {
            return ['ok' => false, 'message' => 'This student is already in a team'];
        }

        $max = (int) ($team->max_members ?? 4);
        if ((int) $team->members_count >= $max) {
            return ['ok' => false, 'message' => 'Team is full'];
        }

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $member->id,
            'role_in_team' => 'member',
        ]);

        return ['ok' => true, 'message' => 'Member added'];
    }

    public function addMemberByIdentifier(User $actor, string $identifier): array
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            return ['ok' => false, 'message' => 'Invalid identifier'];
        }

        // Email?
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return $this->addMemberByEmail($actor, $identifier);
        }

        // Otherwise try university_id match.
        if ($actor->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $teamId = TeamMember::query()
            ->where('user_id', $actor->id)
            ->value('team_id');
        if (! $teamId) {
            return ['ok' => false, 'message' => 'Create a team first'];
        }

        $team = Team::withCount('members')->find((int) $teamId);
        if (! $team) {
            return ['ok' => false, 'message' => 'Team not found'];
        }

        if ((int) $team->leader_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Only team leader can add members'];
        }

        $member = User::query()->where('university_id', $identifier)->first();
        if (! $member || $member->role !== 'student') {
            return ['ok' => false, 'message' => 'Student not found'];
        }

        if ((int) $member->id === (int) $actor->id) {
            return ['ok' => false, 'message' => 'You are already the leader'];
        }

        $memberHasTeam = TeamMember::where('user_id', $member->id)->exists();
        if ($memberHasTeam) {
            return ['ok' => false, 'message' => 'This student is already in a team'];
        }

        $max = (int) ($team->max_members ?? 4);
        if ((int) $team->members_count >= $max) {
            return ['ok' => false, 'message' => 'Team is full'];
        }

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $member->id,
            'role_in_team' => 'member',
        ]);

        return ['ok' => true, 'message' => 'Member added'];
    }

    public function removeMember(User $actor, int $memberUserId): array
    {
        if ($actor->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $teamId = TeamMember::query()
            ->where('user_id', $actor->id)
            ->value('team_id');
        if (! $teamId) {
            return ['ok' => false, 'message' => 'Not in a team'];
        }

        $team = Team::find((int) $teamId);
        if (! $team) {
            return ['ok' => false, 'message' => 'Team not found'];
        }

        if (($team->review_status ?? 'pending') === 'approved') {
            return ['ok' => false, 'message' => 'Team is approved and membership is locked'];
        }

        if ((int) $team->leader_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Only team leader can remove members'];
        }

        if ((int) $memberUserId === (int) $actor->id) {
            return ['ok' => false, 'message' => 'Leader cannot be removed'];
        }

        TeamMember::where('team_id', $team->id)
            ->where('user_id', $memberUserId)
            ->delete();

        if ($team->supervisor_group_id) {
            SupervisorGroupMember::where('supervisor_group_id', (int) $team->supervisor_group_id)
                ->where('student_id', $memberUserId)
                ->delete();
        }
        if ($team->students_group_id) {
            SupervisorGroupMember::where('supervisor_group_id', (int) $team->students_group_id)
                ->where('student_id', $memberUserId)
                ->delete();
        }

        return ['ok' => true, 'message' => 'Member removed'];
    }

    public function leaveTeam(User $actor): array
    {
        if ($actor->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $membership = TeamMember::where('user_id', $actor->id)->first();
        if (! $membership) {
            return ['ok' => false, 'message' => 'Not in a team'];
        }

        $team = Team::withCount('members')->find((int) $membership->team_id);
        if (! $team) {
            $membership->delete();

            return ['ok' => true, 'message' => 'Left team'];
        }

        if (($team->review_status ?? 'pending') === 'approved') {
            return ['ok' => false, 'message' => 'Team is approved and members cannot leave'];
        }

        if ((int) $team->leader_id === (int) $actor->id) {
            return ['ok' => false, 'message' => 'Leader cannot leave. Remove team or transfer leadership (not implemented).'];
        }

        $membership->delete();

        if ($team->supervisor_group_id) {
            SupervisorGroupMember::where('supervisor_group_id', (int) $team->supervisor_group_id)
                ->where('student_id', (int) $actor->id)
                ->delete();
        }
        if ($team->students_group_id) {
            SupervisorGroupMember::where('supervisor_group_id', (int) $team->students_group_id)
                ->where('student_id', (int) $actor->id)
                ->delete();
        }

        return ['ok' => true, 'message' => 'Left team'];
    }

    public function joinPublicTeam(User $student, int $teamId): array
    {
        if ($student->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if (! $this->teamJoinPolicyService->isEnabled()) {
            return ['ok' => false, 'message' => 'الانضمام للفرق مغلق حالياً من قبل رئيس القسم.'];
        }

        $alreadyInTeam = TeamMember::where('user_id', $student->id)->exists();
        if ($alreadyInTeam) {
            return ['ok' => false, 'message' => 'أنت منضم لفريق بالفعل.'];
        }

        $team = Team::withCount('members')->find($teamId);
        if (! $team) {
            return ['ok' => false, 'message' => 'الفريق غير موجود.'];
        }

        if (! (bool) $team->is_active || (string) ($team->review_status ?? '') !== 'approved') {
            return ['ok' => false, 'message' => 'هذا الفريق غير متاح للانضمام حالياً.'];
        }

        if ($student->department && $team->department && $student->department !== $team->department) {
            return ['ok' => false, 'message' => 'لا يمكنك الانضمام لفريق خارج قسمك.'];
        }

        $max = (int) ($team->max_members ?? 4);
        if ((int) $team->members_count >= $max) {
            return ['ok' => false, 'message' => 'الفريق مكتمل.'];
        }

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $student->id,
            'role_in_team' => 'member',
        ]);

        return ['ok' => true, 'message' => 'تم الانضمام للفريق بنجاح.'];
    }

    /**
     * A student-initiated workflow row created from the uploads ("رفع الملفات") flow.
     */
    private function studentHasUploadedIdea(User $student): bool
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->where('posted_by_user_id', $student->id)
            ->where('kind', 'student_idea')
            ->exists();
    }
}
