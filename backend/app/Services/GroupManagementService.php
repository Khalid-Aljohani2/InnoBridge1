<?php

namespace App\Services;

use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\SupervisorGroup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use App\Support\CachedSchema;
use Illuminate\Support\Facades\Cache;

class GroupManagementService
{
    /** Survives slow remote DB: avoids re-running HoD preview aggregates on every navigation. */
    private const HOD_PREVIEW_CACHE_SECONDS = 30;

    private const HOD_PREVIEW_CACHE_SECONDS_LOCAL = 120;

    /** Invalidate HoD `/dashboard` snapshot after team/supervisor changes. */
    public static function bustHoDDashboardPreviewCache(User $hod): void
    {
        Cache::forget(self::hodPreviewCacheKey($hod));
    }

    private static function hodPreviewCacheKey(User $hod): string
    {
        return 'sr_hod_preview_v2:'.(int) $hod->id.':'.sha1((string) ($hod->department ?? ''));
    }

    /**
     * Apply {@see applyHodDepartmentTeamFilter} to a {@see Team} query (exposed for cross-service HoD scoping).
     *
     * @param  Builder<\App\Models\Team>  $query
     */
    public function applyHodDepartmentScopeToTeamsQuery(Builder $query, User $hod): void
    {
        $this->applyHodDepartmentTeamFilter($query, $hod);
    }

    /**
     * HoD scope: teams in the HoD department, teams with no department on the row, or teams whose
     * leader belongs to the HoD department (covers stale/mismatched team.department vs student profile).
     */
    private function applyHodDepartmentTeamFilter(Builder $query, User $user): void
    {
        if (($user->role ?? null) !== 'hod' || ! filled($user->department)) {
            return;
        }

        $dept = $user->department;
        $query->where(function (Builder $w) use ($dept): void {
            $w->where(function (Builder $inner) use ($dept): void {
                $inner->where('department', $dept)->orWhereNull('department');
            })->orWhereHas('leader', function (Builder $leaderQ) use ($dept): void {
                $leaderQ->where('department', $dept);
            });
        });
    }

    /** True if a HoD may act on this team (matches applyHodDepartmentTeamFilter semantics). */
    public function hodMayAccessTeamModel(User $hod, Team $team): bool
    {
        if (($hod->role ?? null) !== 'hod') {
            return true;
        }
        if (! filled($hod->department)) {
            return true;
        }

        $dept = $hod->department;
        $teamDept = $team->department ?? null;
        if (! filled($teamDept) || (string) $teamDept === (string) $dept) {
            return true;
        }

        $team->loadMissing('leader');

        $leaderDept = $team->leader?->department ?? null;

        return filled($leaderDept) && (string) $leaderDept === (string) $dept;
    }

    private function applyHodDepartmentSupervisorFilter(Builder $query, User $user): void
    {
        if (($user->role ?? null) !== 'hod' || ! CachedSchema::hasColumn('users', 'department') || ! filled($user->department)) {
            return;
        }

        $dept = $user->department;
        $query->where(function (Builder $w) use ($dept): void {
            $w->where('department', $dept)->orWhereNull('department');
        });
    }
    public function studentTeam(User $student): ?Team
    {
        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        return $teamId ? Team::with(['members.user:id,name,role', 'leader:id,name', 'supervisor:id,name,role', 'project'])
            ->find((int) $teamId) : null;
    }

    /**
     * Supervisor scope: only teams assigned to them.
     * HoD/Admin scope: all teams.
     */
    public function teamsForUser(User $user): Collection
    {
        $query = Team::query()
            ->withCount('members')
            ->with(['leader:id,name', 'supervisor:id,name,role', 'project:id,title,industry_challenge_id,status']);

        if ($user->role === 'supervisor') {
            $query->where('supervisor_id', $user->id);
        } elseif (! in_array($user->role, ['hod', 'admin'], true)) {
            return collect();
        }

        // HoD: لضبط مشترك — عند تحديد قسم يرى فرق القسم وفرقاً لم يُعبأ لها قسم بعد.
        if ($user->role === 'hod') {
            $this->applyHodDepartmentTeamFilter($query, $user);
        }

        $query->latest();

        // HoD / Admin panels load many rows over remote Postgres; avoid multi‑MB payloads.
        if (in_array($user->role, ['hod', 'admin'], true)) {
            $query->limit(500);
        }

        return $query->get();
    }

    /**
     * Read-only snapshot of teams for HoD / admin monitoring (same scope as teamsForUser).
     */
    public function teamsMonitorForUser(User $user): Collection
    {
        if (! in_array($user->role, ['hod', 'admin'], true)) {
            return collect();
        }

        $query = Team::query()
            ->withCount('members')
            ->with([
                'leader:id,name,email',
                'supervisor:id,name,email,role',
                'project' => fn ($q) => $q->with([
                    'industryChallenge:id,title,deadline',
                    'milestonePlan:id,name',
                    'milestones' => fn ($mq) => $mq->orderBy('sequence'),
                ]),
                'challengeRequests' => fn ($q) => $q->with([
                    'industryChallenge:id,title',
                    'supervisor:id,name',
                    'requestedByStudent:id,name',
                ])->latest()->limit(5),
            ]);

        if ($user->role === 'hod') {
            $this->applyHodDepartmentTeamFilter($query, $user);
        }

        return $query->latest('id')->limit(400)->get();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<\App\Models\Team>
     */
    private function hodScopedTeamsQuery(User $user): \Illuminate\Database\Eloquent\Builder
    {
        $q = Team::query();
        if (($user->role ?? null) === 'hod') {
            $this->applyHodDepartmentTeamFilter($q, $user);
        }

        return $q;
    }

    /**
     * Compact stats and samples for the HoD home dashboard (preview cards).
     */
    public function hodDashboardSummary(User $user): array
    {
        if (($user->role ?? null) !== 'hod') {
            return [];
        }

        return Cache::remember(
            self::hodPreviewCacheKey($user),
            app()->environment('local') ? self::HOD_PREVIEW_CACHE_SECONDS_LOCAL : self::HOD_PREVIEW_CACHE_SECONDS,
            fn (): array => $this->computeHoDashboardSummaryUncached($user)
        );
    }

    private function computeHoDashboardSummaryUncached(User $user): array
    {
        $aggQuery = Team::query();
        $this->applyHodDepartmentTeamFilter($aggQuery, $user);
        $agg = $aggQuery
            ->selectRaw("
                COUNT(*) as teams_total,
                SUM(CASE WHEN project_id IS NOT NULL THEN 1 ELSE 0 END) as with_project,
                SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
            ")
            ->first();

        $supervisorsQuery = User::query()->where('role', 'supervisor');
        $this->applyHodDepartmentSupervisorFilter($supervisorsQuery, $user);
        $supervisorsCount = $supervisorsQuery->count();

        $pendingCount = (int) ($agg->pending_count ?? 0);
        $approvedCount = (int) ($agg->approved_count ?? 0);
        $rejectedCount = (int) ($agg->rejected_count ?? 0);
        $totalTeams = (int) ($agg->teams_total ?? 0);
        $withProject = (int) ($agg->with_project ?? 0);

        $pendingLimitedQuery = Team::query()
            ->where('review_status', 'pending');
        $this->applyHodDepartmentTeamFilter($pendingLimitedQuery, $user);
        $pendingLimited = $pendingLimitedQuery
            ->with(['leader:id,name'])
            ->latest('id')
            ->limit(5)
            ->get();

        $pendingSamples = $pendingLimited->take(3);

        $monitorSamplesQuery = Team::query()
            ->whereNotNull('project_id');
        $this->applyHodDepartmentTeamFilter($monitorSamplesQuery, $user);
        $monitorSamples = $monitorSamplesQuery
            ->with(['project:id,title,current_progress'])
            ->latest('id')
            ->limit(3)
            ->get();

        $notificationPreview = $pendingLimited
            ->map(function (Team $team) {
                $leader = $team->leader?->name ?? 'Student';

                return [
                    'title' => 'Team approval needed',
                    'message' => "Team \"{$team->name}\" · {$leader}",
                    'sent_at' => optional($team->created_at ?? $team->updated_at)->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'panel' => [
                'pending_team_count' => $pendingCount,
                'approved_team_count' => $approvedCount,
                'rejected_team_count' => $rejectedCount,
                'supervisor_count' => $supervisorsCount,
                'pending_samples' => $pendingSamples->map(fn (Team $t) => [
                    'id' => (int) $t->id,
                    'name' => $t->name,
                ])->values()->all(),
            ],
            'monitor' => [
                'teams_total' => $totalTeams,
                'teams_with_project' => $withProject,
                'samples' => $monitorSamples->map(fn (Team $t) => [
                    'team_name' => $t->name,
                    'project_title' => $t->project?->title,
                    'progress' => min(100, max(0, (int) ($t->project?->current_progress ?? 0))),
                ])->values()->all(),
            ],
            'notifications' => [
                'preview' => $notificationPreview,
            ],
        ];
    }

    public function supervisorsForHoD(User $user): Collection
    {
        if (! in_array($user->role, ['hod', 'admin'], true)) {
            return collect();
        }

        $query = User::query()
            ->where('role', 'supervisor')
            ->orderBy('name');

        $this->applyHodDepartmentSupervisorFilter($query, $user);

        $hasIsActiveColumn = CachedSchema::hasColumn('users', 'is_active');
        if ($hasIsActiveColumn) {
            $query->orderByDesc('is_active');
        }

        $rows = $query->get($hasIsActiveColumn ? ['id', 'name', 'email', 'role', 'is_active'] : ['id', 'name', 'email', 'role']);

        if (! $hasIsActiveColumn) {
            return $rows->map(function (User $u) {
                $u->is_active = true;

                return $u;
            });
        }

        return $rows;
    }

    /**
     * HoD assigns a team to a supervisor (strict).
     */
    public function assignTeamToSupervisor(User $actor, Team $team, int $supervisorId): array
    {
        if (! in_array($actor->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($actor->role === 'hod' && ! $this->hodMayAccessTeamModel($actor, $team)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $supervisorQuery = User::query()
            ->where('id', $supervisorId)
            ->where('role', 'supervisor');

        if (CachedSchema::hasColumn('users', 'is_active')) {
            $supervisorQuery->where('is_active', 'true');
        }

        $supervisor = $supervisorQuery->first();

        if (! $supervisor) {
            return ['ok' => false, 'message' => 'Invalid supervisor'];
        }

        if ($actor->role === 'hod' && filled($actor->department) && CachedSchema::hasColumn('users', 'department')) {
            $supDept = $supervisor->department ?? null;
            if (filled($supDept) && $supDept !== $actor->department) {
                return ['ok' => false, 'message' => 'Forbidden'];
            }
        }

        $team->update(['supervisor_id' => $supervisor->id]);

        // Once HoD/admin assigns a supervisor, provision chat groups so the supervisor dashboard
        // (Groups page) and milestone planning dropdown stay in sync—even if team approval is still pending.
        $this->syncSupervisorChatGroupsForTeam($team->fresh());

        if ($actor->role === 'hod') {
            self::bustHoDDashboardPreviewCache($actor);
        }

        return ['ok' => true, 'message' => 'Team assigned successfully'];
    }

    /**
     * Create or complete supervisor_group / students_group rows for this team when a supervisor is set.
     */
    public function syncSupervisorChatGroupsForTeam(Team $team): void
    {
        $team->refresh();
        $supervisorId = (int) ($team->supervisor_id ?? 0);
        if ($supervisorId < 1) {
            return;
        }
        $this->ensureTeamChats($team, $supervisorId);
    }

    /**
     * Backfill missing chat groups for teams already assigned to this supervisor (e.g. before this fix).
     */
    public function repairMissingChatGroupsForSupervisorTeams(User $supervisor): void
    {
        if (($supervisor->role ?? null) !== 'supervisor') {
            return;
        }

        Team::query()
            ->where('supervisor_id', $supervisor->id)
            ->where(function ($q) {
                $q->whereNull('supervisor_group_id')->orWhereNull('students_group_id');
            })
            ->orderBy('id')
            ->limit(100)
            ->get()
            ->each(fn (Team $t) => $this->syncSupervisorChatGroupsForTeam($t));
    }

    private function ensureTeamChats(Team $team, int $supervisorId): void
    {
        if (! $team->id) return;
        if (! $supervisorId) return;

        $memberIds = TeamMember::query()
            ->where('team_id', $team->id)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if (count($memberIds) === 0) return;

        $team->refresh();

        if (! $team->supervisor_group_id) {
            $group = SupervisorGroup::create([
                'supervisor_id' => $supervisorId,
                'name' => $team->name.' - Supervisor Chat',
                'description' => 'Team + supervisor group chat',
                'kind' => 'with_supervisor',
            ]);
            foreach ($memberIds as $sid) {
                $group->members()->firstOrCreate(['student_id' => $sid]);
            }
            $team->update(['supervisor_group_id' => $group->id]);
        }

        if (! $team->students_group_id) {
            $group = SupervisorGroup::create([
                'supervisor_id' => $supervisorId,
                'name' => $team->name.' - Students Only',
                'description' => 'Students-only group chat (supervisor cannot access)',
                'kind' => 'students_only',
            ]);
            foreach ($memberIds as $sid) {
                $group->members()->firstOrCreate(['student_id' => $sid]);
            }
            $team->update(['students_group_id' => $group->id]);
        }
    }

    /**
     * Enforce 2-4 members rule when syncing members.
     */
    public function validateTeamSizeOrFail(int $membersCount): array
    {
        if ($membersCount < 2 || $membersCount > 4) {
            return ['ok' => false, 'message' => 'Group size must be between 2 and 4 students'];
        }

        return ['ok' => true, 'message' => 'ok'];
    }
}

