<?php

namespace App\Services;

use App\Models\GroupChatNotification;
use App\Models\IndustryChallenge;
use App\Models\Project;
use App\Models\Milestone;
use App\Models\Submission;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\ChallengeRequest;
use App\Models\StudentNotification;
use App\Models\User;
use App\Models\SupervisorGroup;
use App\Models\SupervisorMilestone;
use App\Models\SupervisorMilestonePlan;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ChallengeQueryService
{
    public function __construct(
        private readonly MilestonePlanService $milestonePlanService,
        private readonly ChallengeWorkflowService $challengeWorkflowService,
    ) {}

    private function scopeStudentIdsForSupervisor($user): ?array
    {
        if (($user->role ?? null) !== 'supervisor') {
            return null;
        }

        return $this->challengeWorkflowService->scopedStudentIdsForSupervisor($user);
    }

    /**
     * Latest submission row per milestone (same rule as supervisorRequestsData) via SQL —
     * aggregated only over milestones belonging to this user's scoped projects (never whole-table GROUP BY).
     *
     * @return array{
     *   reviewItems: list<array<string, mixed>>,
     *   reviewStats: array{pending_action: int, awaiting_revision: int, approved: int, rejected: int},
     * }
     */
    private function supervisorDashboardReviewSnapshot($user): array
    {
        $emptyStats = [
            'pending_action' => 0,
            'awaiting_revision' => 0,
            'approved' => 0,
            'rejected' => 0,
        ];

        $teamsQuery = Team::query()
            ->whereNotNull('project_id')
            ->select(['id', 'name', 'project_id', 'supervisor_id']);

        if (($user->role ?? null) === 'supervisor') {
            $teamsQuery->where('supervisor_id', (int) $user->id);
        }

        $teamRows = $teamsQuery->orderBy('id')->get();

        if ($teamRows->isEmpty()) {
            return ['reviewItems' => [], 'reviewStats' => $emptyStats];
        }

        /** @var \Illuminate\Support\Collection<int, Team> $teamByProjectId */
        $teamByProjectId = $teamRows->unique('project_id')->keyBy(fn (Team $t) => (int) $t->project_id);

        $projectIds = $teamByProjectId->keys()->map(fn ($id) => (int) $id)->values()->all();

        $latestPerMilestone = DB::table('submissions')
            ->join('milestones', 'milestones.id', '=', 'submissions.milestone_id')
            ->whereIn('milestones.project_id', $projectIds)
            ->select('submissions.milestone_id', DB::raw('MAX(submissions.id) as id'))
            ->groupBy('submissions.milestone_id');

        $rows = DB::table('submissions')
            ->joinSub($latestPerMilestone, 'latest_sub', function ($join): void {
                $join->on('submissions.milestone_id', '=', 'latest_sub.milestone_id')
                    ->on('submissions.id', '=', 'latest_sub.id');
            })
            ->join('milestones', 'milestones.id', '=', 'submissions.milestone_id')
            ->join('projects', 'projects.id', '=', 'milestones.project_id')
            ->whereIn('milestones.project_id', $projectIds)
            ->leftJoin('users as submitters', 'submitters.id', '=', 'submissions.submitted_by_user_id')
            ->select([
                'submissions.id as submission_id',
                'submissions.title as submission_title',
                'submissions.status as submission_status',
                'submissions.version as submission_version',
                'submissions.submitted_at',
                'submissions.created_at as submission_created_at',
                'submissions.file_path',
                'submissions.review_notes',
                'submissions.submitted_by_user_id as student_id',
                'submitters.name as student_name',
                'milestones.project_id as milestone_project_id',
                'projects.id as project_id',
                'projects.title as project_title',
                'projects.current_progress as project_progress',
                'milestones.id as milestone_id',
                'milestones.title as milestone_title',
                'milestones.status as milestone_status',
                'milestones.due_date as milestone_due_date',
            ])
            ->get();

        $items = [];
        foreach ($rows as $row) {
            $pid = (int) $row->milestone_project_id;
            $team = $teamByProjectId->get($pid);
            if (! $team) {
                continue;
            }

            $submittedAt = $row->submitted_at ?? $row->submission_created_at;
            $items[] = [
                'submission_id' => (int) $row->submission_id,
                'submission_title' => $row->submission_title,
                'submission_status' => $row->submission_status,
                'submission_version' => (int) $row->submission_version,
                'submitted_at' => $submittedAt
                    ? Carbon::parse((string) $submittedAt)->toDateTimeString()
                    : null,
                'file_path' => $row->file_path,
                'review_notes' => $row->review_notes,
                'student_id' => (int) $row->student_id,
                'student_name' => $row->student_name ?? '-',
                'team_id' => (int) $team->id,
                'team_name' => $team->name,
                'project_id' => (int) $row->project_id,
                'project_title' => $row->project_title,
                'project_progress' => (int) ($row->project_progress ?? 0),
                'milestone_id' => (int) $row->milestone_id,
                'milestone_title' => $row->milestone_title,
                'milestone_status' => $row->milestone_status,
                'milestone_due_date' => $row->milestone_due_date,
            ];
        }

        $col = collect($items);
        $reviewStats = [
            'pending_action' => $col->where('submission_status', 'submitted')->count(),
            'awaiting_revision' => $col->where('submission_status', 'needs_revision')->count(),
            'approved' => $col->where('submission_status', 'reviewed')->count(),
            'rejected' => 0,
        ];

        return [
            'reviewItems' => $items,
            'reviewStats' => $reviewStats,
        ];
    }

    /**
     * Build aggregated data for supervisor home dashboard.
     */
    public function supervisorHomeData($user): array
    {
        $reviewData = $this->supervisorDashboardReviewSnapshot($user);
        $reviewItems = collect($reviewData['reviewItems']);
        $reviewStats = $reviewData['reviewStats'];

        $stats = [
            'total' => $reviewItems->count(),
            'approved' => (int) ($reviewStats['approved'] ?? 0),
            'rejected' => (int) ($reviewStats['rejected'] ?? 0),
            'pending' => (int) ($reviewStats['pending_action'] ?? 0),
            'awaiting_revision' => (int) ($reviewStats['awaiting_revision'] ?? 0),
        ];

        // Compact team-centric rows for the Teams Dashboard selector.
        $teamsPreview = $reviewItems
            ->groupBy('team_id')
            ->map(function ($rows) {
                $first = $rows->first();
                $pending = $rows->where('submission_status', 'submitted')->count();
                $awaiting = $rows->where('submission_status', 'needs_revision')->count();
                $approved = $rows->where('submission_status', 'reviewed')->count();

                return [
                    'team_id' => (int) ($first['team_id'] ?? 0),
                    'team_name' => $first['team_name'] ?? 'Team',
                    'pending_count' => $pending,
                    'awaiting_count' => $awaiting,
                    'approved_count' => $approved,
                ];
            })
            ->values()
            ->sortByDesc('pending_count')
            ->take(30)
            ->values();

        // Lightweight list of latest submissions feeding the Student Requests / Review Queue preview.
        $reviewPreview = $reviewItems
            ->sortByDesc('submitted_at')
            ->take(10)
            ->values()
            ->all();

        $groups = SupervisorGroup::withCount('members')
            ->where('supervisor_id', $user->id)
            ->latest()
            ->get();

        $groupChatInbox = collect();
        if (Schema::hasTable('group_chat_notifications')) {
            $groupChatInbox = GroupChatNotification::with(['sender:id,name', 'group:id,name'])
                ->where('user_id', $user->id)
                ->latest()
                ->limit(8)
                ->get();
        }

        return [
            'stats' => $stats,
            'teamsPreview' => $teamsPreview,
            'reviewPreview' => $reviewPreview,
            'groups' => $groups,
            'recentNotifications' => StudentNotification::with('student:id,name')
                ->where('supervisor_id', $user->id)
                ->latest()
                ->limit(8)
                ->get(),
            'groupChatInbox' => $groupChatInbox,
        ];
    }

    /**
     * Build student dashboard data (projects + notifications).
     */
    public function studentDashboardData($user): array
    {
        $challenges = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with([
                'postedBy:id,name',
                'feedbacks' => fn ($q) => $q->latest()->limit(5),
            ])
            ->where('posted_by_user_id', $user->id)
            ->where('kind', 'student_idea')
            ->latest()
            ->get();

        $supervisorNotifications = StudentNotification::with('supervisor:id,name')
            ->where('student_id', $user->id)
            ->latest()
            ->limit(20)
            ->get();

        $groupChatNotifications = collect();
        if (Schema::hasTable('group_chat_notifications')) {
            $groupChatNotifications = GroupChatNotification::with(['sender:id,name', 'group:id,name'])
                ->where('user_id', $user->id)
                ->latest()
                ->limit(20)
                ->get();
        }

        $notifications = $supervisorNotifications
            ->map(function (StudentNotification $n) {
                return [
                    'kind' => 'supervisor',
                    'id' => $n->id,
                    'title' => $n->title,
                    'message' => $n->message,
                    'sent_at' => optional($n->sent_at ?? $n->created_at)->toIso8601String(),
                    'supervisor' => $n->supervisor,
                    'is_read' => true,
                ];
            })
            ->concat($groupChatNotifications->map(function (GroupChatNotification $n) {
                return [
                    'kind' => 'group_chat',
                    'id' => $n->id,
                    'title' => $n->title,
                    'message' => $n->body,
                    'sent_at' => $n->created_at->toIso8601String(),
                    'sender' => $n->sender,
                    'group' => $n->group,
                    'group_id' => $n->supervisor_group_id,
                    'is_read' => $n->is_read,
                ];
            }))
            ->sortByDesc(fn (array $row) => $row['sent_at'] ?? '')
            ->take(12)
            ->values()
            ->all();

        return [
            'challenges' => $challenges,
            'notifications' => $notifications,
        ];
    }

    /**
     * Industry company dashboard: posted challenges + teams/projects assigned to them with milestone progress.
     *
     * @return array<string, mixed>
     */
    public function industryDashboardData(User $user): array
    {
        $companyChallenges = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->where('posted_by_user_id', $user->id)
            ->where('kind', 'company_challenge')
            ->latest()
            ->get();

        $challengeIds = $companyChallenges->pluck('id')->all();

        $notifications = collect();
        if (Schema::hasTable('group_chat_notifications')) {
            $notifications = GroupChatNotification::with(['sender:id,name', 'group:id,name'])
                ->where('user_id', $user->id)
                ->latest()
                ->limit(20)
                ->get()
                ->map(function (GroupChatNotification $n) {
                    return [
                        'kind' => 'group_chat',
                        'id' => $n->id,
                        'title' => $n->title,
                        'message' => $n->body,
                        'sent_at' => $n->created_at->toIso8601String(),
                        'sender' => $n->sender,
                        'group' => $n->group,
                        'group_id' => $n->supervisor_group_id,
                        'is_read' => $n->is_read,
                    ];
                });
        }

        $milestoneTracker = collect();
        if ($challengeIds !== []) {
            $milestoneTracker = Project::query()
                ->whereIn('industry_challenge_id', $challengeIds)
                ->with([
                    'industryChallenge:id,title',
                    'milestonePlan:id,name',
                    'team:id,name,project_id,leader_id,supervisor_id',
                    'team.leader:id,name',
                    'team.supervisor:id,name',
                    'milestones' => fn ($q) => $q->orderBy('sequence'),
                ])
                ->get()
                ->map(function (Project $p) {
                    $milestones = $p->milestones ?? collect();
                    $firstOpen = $milestones->first(fn ($m) => ($m->status ?? '') !== 'approved');
                    $current = $firstOpen ?? $milestones->last();
                    $allDone = $milestones->isNotEmpty() && $milestones->every(fn ($m) => ($m->status ?? '') === 'approved');

                    return [
                        'project_id' => $p->id,
                        'project_title' => $p->title,
                        'current_progress' => (int) ($p->current_progress ?? 0),
                        'challenge' => [
                            'id' => $p->industryChallenge?->id,
                            'title' => $p->industryChallenge?->title ?? '—',
                        ],
                        'team' => $p->team ? [
                            'id' => $p->team->id,
                            'name' => $p->team->name,
                            'leader_name' => $p->team->leader?->name,
                            'supervisor_name' => $p->team->supervisor?->name,
                        ] : null,
                        'milestone_plan_name' => $p->milestonePlan?->name,
                        'milestones' => $milestones->map(fn ($m) => [
                            'id' => $m->id,
                            'title' => $m->title,
                            'sequence' => $m->sequence,
                            'status' => $m->status,
                            'due_date' => $m->due_date,
                        ])->values()->all(),
                        'current_milestone_id' => $allDone ? null : $current?->id,
                        'current_milestone_title' => $allDone ? null : $current?->title,
                        'approved_count' => $milestones->where('status', 'approved')->count(),
                        'milestone_count' => $milestones->count(),
                    ];
                })
                ->values()
                ->all();
        }

        return [
            'challenges' => $companyChallenges,
            'notifications' => $notifications->values()->all(),
            'milestoneTracker' => $milestoneTracker,
        ];
    }

    /**
     * Student "Milestones Log" page: progress follows project.current_progress, which
     * SupervisorProjectService updates from milestone weights when submissions are approved.
     *
     * @return array<string, mixed>
     */
    public function studentMilestonesLogPage(User $student): array
    {
        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        if (! $teamId) {
            return [
                'source' => 'no_team',
                'progress' => 0,
                'current' => ['kind' => 'no_team', 'legacy_label' => null, 'milestone_title' => null],
                'project_title' => null,
                'approved_milestone_count' => 0,
                'milestone_count' => 0,
                'milestones' => [],
            ];
        }

        $team = Team::with([
            'project.milestones' => fn ($q) => $q->orderBy('sequence'),
        ])->find((int) $teamId);

        $project = $team?->project;
        if (! $project) {
            return [
                'source' => 'no_project',
                'progress' => 0,
                'current' => ['kind' => 'no_project', 'legacy_label' => null, 'milestone_title' => null],
                'project_title' => null,
                'approved_milestone_count' => 0,
                'milestone_count' => 0,
                'milestones' => [],
            ];
        }

        $milestones = $project->milestones ?? collect();
        $progress = (int) min(100, max(0, (int) ($project->current_progress ?? 0)));

        $approvedCount = $milestones->where('status', 'approved')->count();
        $totalCount = $milestones->count();

        $next = $milestones->first(fn ($m) => $m->status !== 'approved');
        if ($milestones->isEmpty()) {
            $current = ['kind' => 'no_milestones', 'legacy_label' => null, 'milestone_title' => null];
        } elseif ($next === null) {
            $current = ['kind' => 'all_complete', 'legacy_label' => null, 'milestone_title' => null];
        } else {
            $current = ['kind' => 'active', 'legacy_label' => null, 'milestone_title' => (string) $next->title];
        }

        return [
            'source' => 'team_project',
            'progress' => $progress,
            'current' => $current,
            'project_title' => (string) $project->title,
            'approved_milestone_count' => $approvedCount,
            'milestone_count' => $totalCount,
            'milestones' => $milestones->map(fn (Milestone $m) => [
                'id' => (int) $m->id,
                'title' => (string) $m->title,
                'sequence' => (int) $m->sequence,
                'status' => (string) $m->status,
                'weight' => (int) $m->weight,
                'due_date' => $m->due_date,
                'supervisor_accepted' => $m->status === 'approved',
            ])->values()->all(),
        ];
    }

    /**
     * Build supervisor review queue data with student filters and quick chat links.
     */
    public function supervisorRequestsData($user, ?int $selectedStudentId): array
    {
        $selectedStudentId = (int) $selectedStudentId;
        // New Review Queue (milestone submissions driven).
        $teamsQuery = Team::query()
            ->with([
                'leader:id,name',
                'members.user:id,name',
                'project:id,title,current_progress',
                'project.milestones' => fn ($q) => $q->orderBy('sequence'),
                'project.milestones.submissions' => fn ($q) => $q->with('submittedBy:id,name')->latest(),
            ])
            ->whereNotNull('project_id')
            ->latest('id');

        if ($user->role === 'supervisor') {
            $teamsQuery->where('supervisor_id', $user->id);
        }

        $teams = $teamsQuery->get();

        $items = [];
        foreach ($teams as $team) {
            if (! $team->project) continue;
            foreach (($team->project->milestones ?? []) as $milestone) {
                $latest = ($milestone->submissions ?? collect())->first();
                if (! $latest) continue;
                if ($selectedStudentId > 0 && (int) $latest->submitted_by_user_id !== $selectedStudentId) {
                    continue;
                }
                $items[] = [
                    'submission_id' => (int) $latest->id,
                    'submission_title' => $latest->title,
                    'submission_status' => $latest->status,
                    'submission_version' => (int) $latest->version,
                    'submitted_at' => optional($latest->submitted_at ?? $latest->created_at)->toDateTimeString(),
                    'file_path' => $latest->file_path,
                    'review_notes' => $latest->review_notes,
                    'student_id' => (int) $latest->submitted_by_user_id,
                    'student_name' => $latest->submittedBy?->name ?? '-',
                    'team_id' => (int) $team->id,
                    'team_name' => $team->name,
                    'project_id' => (int) $team->project_id,
                    'project_title' => $team->project->title,
                    'project_progress' => (int) ($team->project->current_progress ?? 0),
                    'milestone_id' => (int) $milestone->id,
                    'milestone_title' => $milestone->title,
                    'milestone_status' => $milestone->status,
                    'milestone_due_date' => $milestone->due_date,
                ];
            }
        }

        $stats = [
            'pending_action' => collect($items)->where('submission_status', 'submitted')->count(),
            'awaiting_revision' => collect($items)->where('submission_status', 'needs_revision')->count(),
            'approved' => collect($items)->where('submission_status', 'reviewed')->count(),
            'rejected' => 0,
        ];

        return [
            'challenges' => [],
            'reviewItems' => $items,
            'reviewStats' => $stats,
            'selectedStudentId' => $selectedStudentId > 0 ? $selectedStudentId : null,
            'quickChatByStudentId' => [],
            'milestoneOptionsByStudentId' => [],
        ];
    }

    /**
     * Build compact monitoring cards data for supervisor students page.
     */
    public function supervisorStudentsData($user): array
    {
        // Team-centric monitoring: plan, deliverables/submissions, and challenge requests.
        $teamsQuery = Team::query()
            ->with([
                'leader:id,name,email',
                'supervisor:id,name,email,role',
                'members.user:id,name,email',
                'project:id,title,status,industry_challenge_id,current_progress,milestone_plan_id',
                'project.milestonePlan:id,name,supervisor_id,is_active',
                'project.industryChallenge:id,title,deadline,file_path',
                'project.industryChallenge.feedbacks' => fn ($q) => $q->latest(),
                'project.milestones' => fn ($q) => $q->orderBy('sequence'),
                'project.milestones.submissions' => fn ($q) => $q->with('submittedBy:id,name,email')->latest(),
                'industryProject:id,title,industry_challenge_id,current_progress',
                'challengeRequests' => fn ($q) => $q->with([
                    'industryChallenge:id,title,deadline',
                    'requestedByStudent:id,name,email',
                    'supervisor:id,name,email',
                ])->latest(),
            ])
            ->whereNotNull('project_id')
            ->latest('id');

        if ($user->role === 'supervisor') {
            $teamsQuery->where('supervisor_id', $user->id);
        }

        $teams = $teamsQuery->get();

        $plansQuery = SupervisorMilestonePlan::query()
            ->select('id', 'name', 'supervisor_group_id')
            ->with('group:id,name')
            ->where('is_active', 'true')
            ->latest('id');
        if ($user->role === 'supervisor') {
            $plansQuery->where('supervisor_id', $user->id);
        }
        $availablePlans = $plansQuery->get()->map(function ($plan) {
            return [
                'id' => $plan->id,
                'name' => $plan->name,
                'scope' => $plan->supervisor_group_id ? (optional($plan->group)->name ?? 'Group Plan') : 'All Students',
            ];
        })->values();

        return [
            'teams' => $teams,
            'availablePlans' => $availablePlans,
        ];
    }

    /**
     * Build milestone planning page data (rows, plans, groups, templates).
     */
    public function supervisorMilestonesData($user): array
    {
        $studentScopeIds = $this->scopeStudentIdsForSupervisor($user);
        $allChallenges = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name')
            ->where('kind', 'student_idea')
            ->when(is_array($studentScopeIds), fn ($q) => $q->whereIn('posted_by_user_id', $studentScopeIds))
            ->latest()
            ->get();

        $milestoneRows = $allChallenges
            ->groupBy('posted_by_user_id')
            ->map(function ($items) {
                $latest = $items->first();
                return [
                    'student_id' => $latest->posted_by_user_id,
                    'student_name' => $latest->postedBy?->name ?? 'Unknown',
                    'project_title' => $latest->title,
                    'progress' => (int) ($latest->progress ?? 0),
                    'current_milestone' => $latest->current_milestone ?? '-',
                    'review_status' => $latest->review_status ?? 'pending_action',
                    'updated_at' => optional($latest->updated_at)->toDateTimeString(),
                ];
            })
            ->values();

        $groupsQuery = SupervisorGroup::select('id', 'name')->withCount('members');
        if ($user->role === 'supervisor') {
            $groupsQuery->where(function ($q) use ($user) {
                $q->where('supervisor_id', $user->id)
                    ->orWhereHas('admins', fn ($adminQ) => $adminQ->where('user_id', $user->id));
            });
        }
        $groups = $groupsQuery->orderBy('name')->get();

        $plans = collect();
        if (Schema::hasTable('supervisor_milestone_plans')) {
            $plans = SupervisorMilestonePlan::where('supervisor_id', $user->id)
                ->with('group:id,name')
                ->orderByRaw('supervisor_group_id is null desc')
                ->orderBy('id')
                ->get()
                ->map(fn ($p) => [
                    'id' => (int) $p->id,
                    'name' => $p->name,
                    'is_active' => (bool) $p->is_active,
                    'supervisor_group_id' => $p->supervisor_group_id ? (int) $p->supervisor_group_id : null,
                    'group_name' => $p->group?->name,
                ])
                ->values();
        }

        $templatesQuery = SupervisorMilestone::where('supervisor_id', $user->id)
            ->with(['group:id,name', 'plan:id,name']);
        if (Schema::hasColumn('supervisor_milestones', 'plan_id')) {
            $templatesQuery->orderBy('plan_id');
        }
        $templates = $templatesQuery
            ->orderBy('sort_order')
            ->get();

        $runningByPlan = [];
        $templateRows = $templates->map(function ($template) use (&$runningByPlan) {
            $planKey = $template->plan_id ? 'plan:'.$template->plan_id : 'plan:0';
            $runningByPlan[$planKey] = ($runningByPlan[$planKey] ?? 0) + (int) $template->increment_percent;
            return [
                'id' => (string) $template->id,
                'label' => $template->title,
                'increment_percent' => (int) $template->increment_percent,
                'sort_order' => (int) $template->sort_order,
                'progress' => min(100, $runningByPlan[$planKey]),
                'submission_title' => $template->submission_title,
                'deadline' => optional($template->deadline)->toDateString(),
                'supervisor_group_id' => $template->supervisor_group_id ? (int) $template->supervisor_group_id : null,
                'group_name' => $template->group?->name,
                'plan_id' => $template->plan_id ? (int) $template->plan_id : null,
                'plan_name' => $template->plan?->name,
            ];
        })->values();

        $teamsByPlanId = [];
        $teamQuery = Team::query()
            ->with(['project:id,title,milestone_plan_id,current_progress', 'leader:id,name'])
            ->whereNotNull('project_id')
            ->whereHas('project', fn ($q) => $q->whereNotNull('milestone_plan_id'));
        if (($user->role ?? null) === 'supervisor') {
            $teamQuery->where('supervisor_id', $user->id);
        }
        foreach ($teamQuery->orderBy('name')->get() as $team) {
            $planId = (int) ($team->project?->milestone_plan_id ?? 0);
            if ($planId < 1) {
                continue;
            }
            $teamsByPlanId[$planId][] = [
                'team_id' => (int) $team->id,
                'team_name' => (string) $team->name,
                'leader_name' => $team->leader?->name,
                'project_title' => (string) ($team->project?->title ?? ''),
                'current_progress' => (int) ($team->project?->current_progress ?? 0),
            ];
        }

        return [
            'milestones' => $milestoneRows,
            'milestoneTemplates' => $templateRows,
            'groups' => $groups,
            'plans' => $plans,
            'teamsByPlanId' => $teamsByPlanId,
        ];
    }
}
