<?php

namespace App\Services;

use App\Models\ChallengeRequest;
use App\Models\FacultyNotification;
use App\Models\GroupChatNotification;
use App\Models\IndustryChallenge;
use App\Models\Milestone;
use App\Models\Submission;
use App\Models\StudentNotification;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\UserNotificationRead;
use App\Support\CachedSchema;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class NotificationFeedService
{
    private const MILESTONE_DEADLINE_DAYS = 7;

    /** Limits WHERE IN scope for unread badge helpers (HoD/admin "all teams" avoids huge binds + full scans). */
    private const MAX_PROJECT_IDS_FEED_SCOPE = 500;

    /**
     * @param  list<int>  $projectIds
     * @return list<int>
     */
    private function capFeedProjectIds(array $projectIds): array
    {
        $normalized = array_values(array_unique(array_map(static fn ($v) => (int) $v, $projectIds)));
        if (count($normalized) <= self::MAX_PROJECT_IDS_FEED_SCOPE) {
            return $normalized;
        }

        return array_slice($normalized, 0, self::MAX_PROJECT_IDS_FEED_SCOPE);
    }

    /**
     * @return array<string, string>
     */
    private function strings(User $user): array
    {
        $ar = ($user->preferred_language ?? 'en') === 'ar';

        if ($ar) {
            return [
                'submission_approved_title' => 'تم اعتماد التسليم',
                'submission_revision_title' => 'التسليم يحتاج تعديلاً',
                'submission_rejected_title' => 'التسليم مرفوض',
                'submission_approved_msg' => 'المشرف :reviewer اعتمد تسليمك للمرحلة «:milestone».',
                'submission_revision_msg' => 'المشرف :reviewer طلب تعديلاً على تسليمك للمرحلة «:milestone».',
                'submission_rejected_msg' => 'المشرف :reviewer لم يعتمد تسليمك للمرحلة «:milestone».',
                'submission_pending_title' => 'تسليم جديد للمراجعة',
                'submission_pending_msg' => ':student رفع ملفات للمرحلة «:milestone» (الفريق: :team).',
                'milestone_deadline_title' => 'اقتراب موعد مرحلة',
                'milestone_deadline_msg' => 'المرحلة «:milestone» للفريق «:team» مستحقّة في :due.',
                'team_default' => 'فريق',
                'reviewer_unknown' => 'المشرف',
            ];
        }

        return [
            'submission_approved_title' => 'Submission approved',
            'submission_revision_title' => 'Submission needs changes',
            'submission_rejected_title' => 'Submission not approved',
            'submission_approved_msg' => 'Supervisor :reviewer approved your submission for milestone ":milestone".',
            'submission_revision_msg' => 'Supervisor :reviewer asked for changes on your submission for milestone ":milestone".',
            'submission_rejected_msg' => 'Supervisor :reviewer did not approve your submission for milestone ":milestone".',
            'submission_pending_title' => 'New submission to review',
            'submission_pending_msg' => ':student uploaded files for milestone ":milestone" (team: :team).',
            'milestone_deadline_title' => 'Milestone deadline approaching',
            'milestone_deadline_msg' => 'Milestone ":milestone" for team ":team" is due on :due.',
            'team_default' => 'Team',
            'reviewer_unknown' => 'Supervisor',
        ];
    }

    private function hasDismissed(User $user, string $kind, int $referenceId): bool
    {
        if (! CachedSchema::hasTable('user_notification_reads')) {
            return false;
        }

        return UserNotificationRead::query()
            ->where('user_id', $user->id)
            ->where('kind', $kind)
            ->where('reference_id', $referenceId)
            ->exists();
    }

    public function markDismissed(User $user, string $kind, int $referenceId): void
    {
        if (! CachedSchema::hasTable('user_notification_reads')) {
            return;
        }

        UserNotificationRead::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'kind' => $kind,
                'reference_id' => $referenceId,
            ],
            []
        );
    }

    /**
     * Mark every dismissible in-app item as read for this user (synthetics + DB-backed).
     */
    public function markAllDismissed(User $user): void
    {
        if (CachedSchema::hasTable('group_chat_notifications') && in_array(($user->role ?? null), ['student', 'supervisor', 'admin', 'hod'], true)) {
            GroupChatNotification::query()
                ->where('user_id', $user->id)
                ->where('is_read', 'false')
                ->update(['is_read' => true]);
        }

        if (($user->role ?? null) === 'student') {
            StudentNotification::query()
                ->where('student_id', $user->id)
                ->where('is_read', 'false')
                ->update(['is_read' => true]);

            if (CachedSchema::hasColumn('team_invitations', 'seen_at')) {
                TeamInvitation::query()
                    ->where('invited_user_id', $user->id)
                    ->where('status', 'pending')
                    ->whereNull('seen_at')
                    ->update(['seen_at' => now()]);
            }
        }

        $items = $this->collectDismissiblePairs($user);
        if ($items === [] || ! CachedSchema::hasTable('user_notification_reads')) {
            return;
        }

        $now = now();
        $rows = [];
        foreach ($items as $pair) {
            $rows[] = [
                'user_id' => $user->id,
                'kind' => $pair['kind'],
                'reference_id' => $pair['id'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            UserNotificationRead::query()->upsert(
                $chunk,
                ['user_id', 'kind', 'reference_id'],
                ['updated_at']
            );
        }
    }

    /**
     * @return list<array{kind: string, id: int}>
     */
    private function collectDismissiblePairs(User $user): array
    {
        $pairs = [];
        $role = $user->role ?? null;

        if ($role === 'student') {
            foreach ($this->studentSubmissionReviewPairs($user) as $id) {
                $pairs[] = ['kind' => 'submission_review', 'id' => $id];
            }
            foreach ($this->studentChallengeRequestPairs($user) as $id) {
                $pairs[] = ['kind' => 'challenge_request', 'id' => $id];
            }
            foreach ($this->studentMilestoneDeadlinePairs($user) as $id) {
                $pairs[] = ['kind' => 'milestone_deadline', 'id' => $id];
            }
        }

        if (in_array($role, ['supervisor', 'admin'], true)) {
            foreach ($this->supervisorPendingSubmissionPairs($user) as $id) {
                $pairs[] = ['kind' => 'submission_pending', 'id' => $id];
            }
            foreach ($this->supervisorChallengeRequestPairs($user) as $id) {
                $pairs[] = ['kind' => 'challenge_request', 'id' => $id];
            }
            foreach ($this->supervisorMilestoneDeadlinePairs($user) as $id) {
                $pairs[] = ['kind' => 'milestone_deadline', 'id' => $id];
            }
        }

        if (in_array($role, ['hod', 'admin'], true)) {
            foreach ($this->hodTeamReviewPairs($user) as $id) {
                $pairs[] = ['kind' => 'team_review', 'id' => $id];
            }
            if ($role === 'hod') {
                foreach ($this->hodMilestoneDeadlinePairs($user) as $id) {
                    $pairs[] = ['kind' => 'milestone_deadline', 'id' => $id];
                }
            }
        }

        if ($role === 'industry') {
            foreach ($this->industryChallengeAssignedPairs($user) as $id) {
                $pairs[] = ['kind' => 'challenge_assigned', 'id' => $id];
            }
        }

        $keys = [];
        $out = [];
        foreach ($pairs as $pair) {
            $k = ($pair['kind'] ?? '').':'.($pair['id'] ?? 0);
            if (isset($keys[$k])) {
                continue;
            }
            $keys[$k] = true;
            $out[] = $pair;
        }

        return $out;
    }

    /**
     * @return list<int>
     */
    private function studentSubmissionReviewPairs(User $user): array
    {
        return Submission::query()
            ->where('submitted_by_user_id', $user->id)
            ->whereNotNull('reviewed_at')
            ->limit(40)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @return list<int>
     */
    private function studentChallengeRequestPairs(User $user): array
    {
        $teamIds = TeamMember::query()
            ->where('user_id', $user->id)
            ->pluck('team_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
        if ($teamIds === []) {
            return [];
        }

        return ChallengeRequest::query()
            ->whereIn('team_id', $teamIds)
            ->whereIn('status', ['approved', 'rejected'])
            ->latest('decided_at')
            ->limit(30)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @return list<int>
     */
    private function studentMilestoneDeadlinePairs(User $user): array
    {
        $teamIds = TeamMember::query()->where('user_id', $user->id)->pluck('team_id')->all();
        if ($teamIds === []) {
            return [];
        }
        $projectIds = Team::query()->whereIn('id', $teamIds)->whereNotNull('project_id')->pluck('project_id')->map(fn ($id) => (int) $id)->all();

        return $this->milestoneDueIdsForProjects($projectIds);
    }

    /**
     * @return list<int>
     */
    private function supervisorPendingSubmissionPairs(User $user): array
    {
        $teamsQuery = Team::query()->whereNotNull('project_id');
        if (($user->role ?? null) === 'supervisor') {
            $teamsQuery->where('supervisor_id', $user->id);
        }
        $projectIds = $this->capFeedProjectIds(
            $teamsQuery->pluck('project_id')->map(fn ($id) => (int) $id)->values()->all()
        );
        if ($projectIds === []) {
            return [];
        }

        return $this->latestPendingSubmissionIdsForProjects($projectIds);
    }

    /**
     * @return list<int>
     */
    private function supervisorChallengeRequestPairs(User $user): array
    {
        $q = ChallengeRequest::query()->latest('id')->limit(40);
        if (($user->role ?? null) === 'supervisor') {
            $q->where('supervisor_id', $user->id);
        }

        return $q->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    /**
     * @return list<int>
     */
    private function supervisorMilestoneDeadlinePairs(User $user): array
    {
        $teamsQuery = Team::query()->whereNotNull('project_id');
        if (($user->role ?? null) === 'supervisor') {
            $teamsQuery->where('supervisor_id', $user->id);
        }
        $projectIds = $this->capFeedProjectIds(
            $teamsQuery->pluck('project_id')->map(fn ($id) => (int) $id)->values()->all()
        );

        return $this->milestoneDueIdsForProjects($projectIds);
    }

    /**
     * @return list<int>
     */
    private function hodTeamReviewPairs(User $user): array
    {
        $q = Team::query()->where('review_status', 'pending')->limit(40);
        if (($user->role ?? null) === 'hod' && filled($user->department)) {
            $hodDept = $user->department;
            $q->where(function ($w) use ($hodDept) {
                $w->where(function ($w2) use ($hodDept) {
                    $w2->where('department', $hodDept)->orWhereNull('department');
                })->orWhereHas('leader', fn ($lq) => $lq->where('department', $hodDept));
            });
        }

        return $q->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    /**
     * @return list<int>
     */
    private function hodMilestoneDeadlinePairs(User $user): array
    {
        $tq = Team::query()->whereNotNull('project_id');
        if (($user->role ?? null) === 'hod' && filled($user->department)) {
            $hodDept = $user->department;
            $tq->where(function ($w) use ($hodDept) {
                $w->where(function ($w2) use ($hodDept) {
                    $w2->where('department', $hodDept)->orWhereNull('department');
                })->orWhereHas('leader', fn ($lq) => $lq->where('department', $hodDept));
            });
        }
        $projectIds = $this->capFeedProjectIds(
            $tq->pluck('project_id')->map(fn ($id) => (int) $id)->values()->all()
        );

        return $this->milestoneDueIdsForProjects($projectIds);
    }

    /**
     * @return list<int>
     */
    private function industryChallengeAssignedPairs(User $user): array
    {
        return ChallengeRequest::query()
            ->whereHas('industryChallenge', fn ($q) => $q->where('posted_by_user_id', $user->id))
            ->where('status', 'approved')
            ->limit(50)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @param  list<int>  $projectIds
     * @return list<int>
     */
    private function milestoneDueIdsForProjects(array $projectIds): array
    {
        if ($projectIds === []) {
            return [];
        }
        $start = now()->startOfDay()->toDateString();
        $end = now()->addDays(self::MILESTONE_DEADLINE_DAYS)->endOfDay()->toDateString();

        return Milestone::query()
            ->whereIn('project_id', $projectIds)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', $start)
            ->whereDate('due_date', '<=', $end)
            ->whereIn('status', ['pending', 'in_review', 'rejected'])
            ->limit(40)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @param  list<int>  $projectIds
     * @return list<int>
     */
    private function latestPendingSubmissionIdsForProjects(array $projectIds): array
    {
        if ($projectIds === []) {
            return [];
        }

        $ids = DB::table('submissions')
            ->join('milestones', 'milestones.id', '=', 'submissions.milestone_id')
            ->whereIn('milestones.project_id', $projectIds)
            ->where('submissions.status', 'submitted')
            ->selectRaw('max(submissions.id) as id')
            ->groupBy('submissions.milestone_id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        return $ids;
    }

    /**
     * @param  array<string, list<int>>  $referencesByKind
     * @return array<string, bool> keys "kind:id" => true
     */
    private function dismissedReferenceKeySet(User $user, array $referencesByKind): array
    {
        if (! CachedSchema::hasTable('user_notification_reads')) {
            return [];
        }

        $parts = [];
        foreach ($referencesByKind as $kind => $ids) {
            $normalized = array_values(array_unique(array_filter(array_map(static fn ($v) => (int) $v, (array) $ids))));
            if ($normalized === [] || ($kind ?? '') === '') {
                continue;
            }
            $parts[] = [(string) $kind, $normalized];
        }
        if ($parts === []) {
            return [];
        }

        $rows = UserNotificationRead::query()
            ->where('user_id', $user->id)
            ->where(function ($q) use ($parts): void {
                foreach ($parts as [$kind, $ids]) {
                    $q->orWhere(function ($q2) use ($kind, $ids): void {
                        $q2->where('kind', $kind)->whereIn('reference_id', $ids);
                    });
                }
            })
            ->get(['kind', 'reference_id']);

        $set = [];
        foreach ($rows as $row) {
            $set[(string) $row->kind.':'.(int) $row->reference_id] = true;
        }

        return $set;
    }

    /**
     * Lightweight unread count for the nav badge (in addition to group chat rows).
     * Uses batched reads instead of N+1 hasDismissed() queries per item.
     */
    public function feedUnreadEstimate(User $user): int
    {
        $role = $user->role ?? null;
        $n = 0;

        if ($role === 'student') {
            $n += StudentNotification::query()->where('student_id', $user->id)->where('is_read', 'false')->count();
            if (CachedSchema::hasColumn('team_invitations', 'seen_at')) {
                $n += TeamInvitation::query()
                    ->where('invited_user_id', $user->id)
                    ->where('status', 'pending')
                    ->whereNull('seen_at')
                    ->count();
            }
            $idsReview = $this->studentSubmissionReviewPairs($user);
            $idsCr = $this->studentChallengeRequestPairs($user);
            $idsMs = $this->studentMilestoneDeadlinePairs($user);
            $dismissed = $this->dismissedReferenceKeySet($user, [
                'submission_review' => $idsReview,
                'challenge_request' => $idsCr,
                'milestone_deadline' => $idsMs,
            ]);
            foreach ($idsReview as $id) {
                if (! isset($dismissed['submission_review:'.$id])) {
                    $n++;
                }
            }
            foreach ($idsCr as $id) {
                if (! isset($dismissed['challenge_request:'.$id])) {
                    $n++;
                }
            }
            foreach ($idsMs as $id) {
                if (! isset($dismissed['milestone_deadline:'.$id])) {
                    $n++;
                }
            }
        }

        if (in_array($role, ['supervisor', 'admin'], true)) {
            $idsSub = $this->supervisorPendingSubmissionPairs($user);
            $idsCr = $this->supervisorChallengeRequestPairs($user);
            $idsMs = $this->supervisorMilestoneDeadlinePairs($user);
            $dismissed = $this->dismissedReferenceKeySet($user, [
                'submission_pending' => $idsSub,
                'challenge_request' => $idsCr,
                'milestone_deadline' => $idsMs,
            ]);
            foreach ($idsSub as $id) {
                if (! isset($dismissed['submission_pending:'.$id])) {
                    $n++;
                }
            }
            foreach ($idsCr as $id) {
                if (! isset($dismissed['challenge_request:'.$id])) {
                    $n++;
                }
            }
            foreach ($idsMs as $id) {
                if (! isset($dismissed['milestone_deadline:'.$id])) {
                    $n++;
                }
            }
        }

        if (in_array($role, ['hod', 'admin'], true)) {
            $idsTeam = $this->hodTeamReviewPairs($user);
            $byKind = ['team_review' => $idsTeam];
            $idsMs = [];
            if ($role === 'hod') {
                $idsMs = $this->hodMilestoneDeadlinePairs($user);
                $byKind['milestone_deadline'] = $idsMs;
            }
            $dismissed = $this->dismissedReferenceKeySet($user, $byKind);
            foreach ($idsTeam as $id) {
                if (! isset($dismissed['team_review:'.$id])) {
                    $n++;
                }
            }
            foreach ($idsMs as $id) {
                if (! isset($dismissed['milestone_deadline:'.$id])) {
                    $n++;
                }
            }

            if (CachedSchema::hasTable('faculty_notifications')) {
                $n += FacultyNotification::query()
                    ->where('recipient_user_id', $user->id)
                    ->where('is_read', 'false')
                    ->count();
            }
        }

        if ($role === 'industry') {
            $ids = $this->industryChallengeAssignedPairs($user);
            $dismissed = $this->dismissedReferenceKeySet($user, ['challenge_assigned' => $ids]);
            foreach ($ids as $id) {
                if (! isset($dismissed['challenge_assigned:'.$id])) {
                    $n++;
                }
            }
        }

        return min(999, $n);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function feed(User $user, int $limit = 120): array
    {
        $items = collect();
        $t = $this->strings($user);

        if (CachedSchema::hasTable('group_chat_notifications') && in_array(($user->role ?? null), ['student', 'supervisor', 'admin', 'hod'], true)) {
            // Always include unread rows (matches nav badge count). Previously only the latest 60 rows
            // were loaded, so an older unread message could be missing from the list while still counted.
            $unreadGc = GroupChatNotification::with(['sender:id,name', 'group:id,name'])
                ->where('user_id', $user->id)
                ->where('is_read', 'false')
                ->latest('id')
                ->limit(100)
                ->get();

            $unreadIds = $unreadGc->pluck('id')->all();
            $readLimit = max(0, 80 - $unreadGc->count());

            $readGcQuery = GroupChatNotification::with(['sender:id,name', 'group:id,name'])
                ->where('user_id', $user->id)
                ->where('is_read', 'true')
                ->latest('id');

            if ($unreadIds !== []) {
                $readGcQuery->whereNotIn('id', $unreadIds);
            }

            $readGc = $readLimit > 0 ? $readGcQuery->limit($readLimit)->get() : collect();

            $mapGroupChat = function (GroupChatNotification $n) {
                return [
                    'kind' => 'group_chat',
                    'id' => (int) $n->id,
                    'title' => $n->title,
                    'message' => $n->body,
                    'sent_at' => optional($n->created_at)->toIso8601String(),
                    'is_read' => (bool) $n->is_read,
                    'link' => route('supervisor.groups.chat', $n->supervisor_group_id),
                    'meta' => [
                        'sender' => $n->sender?->name,
                        'group' => $n->group?->name,
                        'group_id' => (int) $n->supervisor_group_id,
                    ],
                ];
            };

            $items = $items->concat($unreadGc->map($mapGroupChat))->concat($readGc->map($mapGroupChat));
        }

        if (CachedSchema::hasTable('faculty_notifications') && in_array(($user->role ?? null), ['hod', 'admin'], true)) {
            $items = $items->concat(
                FacultyNotification::query()
                    ->where('recipient_user_id', $user->id)
                    ->latest('id')
                    ->limit(60)
                    ->get()
                    ->map(static function (FacultyNotification $n): array {
                        return [
                            'kind' => 'faculty_notice',
                            'id' => (int) $n->id,
                            'title' => $n->title,
                            'message' => $n->message,
                            'sent_at' => optional($n->created_at)->toIso8601String(),
                            'is_read' => (bool) $n->is_read,
                            'link' => route('hod.industry-nominations.index'),
                            'meta' => [],
                        ];
                    })
            );
        }

        if (($user->role ?? null) === 'student') {
            $items = $items->concat(
                TeamInvitation::query()
                    ->with(['team:id,name,leader_id', 'team.leader:id,name', 'invitedBy:id,name'])
                    ->where('invited_user_id', $user->id)
                    ->latest('id')
                    ->limit(30)
                    ->get()
                    ->map(function (TeamInvitation $inv) {
                        $teamName = $inv->team?->name ?? 'Team';
                        $inviter = $inv->invitedBy?->name ?? 'Student';
                        $status = $inv->status ?? 'pending';

                        return [
                            'kind' => 'team_invitation',
                            'id' => (int) $inv->id,
                            'title' => $status === 'pending' ? 'Team invitation' : 'Team invitation update',
                            'message' => $status === 'pending'
                                ? "You were invited by {$inviter} to join {$teamName}."
                                : "Invitation to {$teamName} is {$status}.",
                            'sent_at' => optional($inv->created_at)->toIso8601String(),
                            'is_read' => $status !== 'pending' ? true : (bool) ($inv->seen_at !== null),
                            'link' => route('student.team'),
                            'meta' => [
                                'team_id' => (int) ($inv->team_id ?? 0),
                                'status' => $status,
                            ],
                        ];
                    })
            );

            $items = $items->concat(
                StudentNotification::with('supervisor:id,name')
                    ->where('student_id', $user->id)
                    ->latest('id')
                    ->limit(40)
                    ->get()
                    ->map(function (StudentNotification $n) {
                        return [
                            'kind' => 'supervisor',
                            'id' => (int) $n->id,
                            'title' => $n->title,
                            'message' => $n->message,
                            'sent_at' => optional($n->sent_at ?? $n->created_at)->toIso8601String(),
                            'is_read' => (bool) ($n->is_read ?? true),
                            'link' => route('dashboard'),
                            'meta' => [
                                'supervisor' => $n->supervisor?->name,
                            ],
                        ];
                    })
            );

            $teamIds = TeamMember::query()
                ->where('user_id', $user->id)
                ->pluck('team_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            if (count($teamIds) > 0) {
                $items = $items->concat(
                    ChallengeRequest::query()
                        ->with(['industryChallenge:id,title,deadline', 'supervisor:id,name'])
                        ->whereIn('team_id', $teamIds)
                        ->whereIn('status', ['approved', 'rejected'])
                        ->latest('decided_at')
                        ->limit(25)
                        ->get()
                        ->map(function (ChallengeRequest $cr) use ($user) {
                            $challengeTitle = $cr->industryChallenge?->title ?? 'Challenge';
                            $status = $cr->status;

                            return [
                                'kind' => 'challenge_request',
                                'id' => (int) $cr->id,
                                'title' => $status === 'approved' ? 'Challenge approved' : 'Challenge rejected',
                                'message' => $status === 'approved'
                                    ? "Your supervisor approved your challenge: {$challengeTitle}."
                                    : "Your supervisor rejected your challenge: {$challengeTitle}.",
                                'sent_at' => optional($cr->decided_at ?? $cr->updated_at)->toIso8601String(),
                                'is_read' => $this->hasDismissed($user, 'challenge_request', (int) $cr->id),
                                'link' => route('student.industry-challenges'),
                                'meta' => [
                                    'status' => $status,
                                    'challenge_id' => (int) ($cr->industry_challenge_id ?? 0),
                                    'supervisor' => $cr->supervisor?->name,
                                ],
                            ];
                        })
                );
            }

            $items = $items->concat(
                Submission::query()
                    ->with(['milestone:id,project_id,title', 'reviewedBy:id,name'])
                    ->where('submitted_by_user_id', $user->id)
                    ->whereNotNull('reviewed_at')
                    ->latest('reviewed_at')
                    ->limit(30)
                    ->get()
                    ->map(function (Submission $s) use ($user, $t) {
                        $milestoneTitle = $s->milestone?->title ?? 'Milestone';
                        $status = (string) ($s->status ?? 'reviewed');
                        $reviewer = $s->reviewedBy?->name ?? $t['reviewer_unknown'];
                        $notes = $s->review_notes ? ' '.trim((string) $s->review_notes) : '';

                        if ($status === 'reviewed') {
                            $title = $t['submission_approved_title'];
                            $message = str_replace([':reviewer', ':milestone'], [$reviewer, $milestoneTitle], $t['submission_approved_msg']).$notes;
                        } elseif ($status === 'needs_revision') {
                            $title = $t['submission_revision_title'];
                            $message = str_replace([':reviewer', ':milestone'], [$reviewer, $milestoneTitle], $t['submission_revision_msg']).$notes;
                        } else {
                            $title = $t['submission_rejected_title'];
                            $message = str_replace([':reviewer', ':milestone'], [$reviewer, $milestoneTitle], $t['submission_rejected_msg']).$notes;
                        }

                        return [
                            'kind' => 'submission_review',
                            'id' => (int) $s->id,
                            'title' => $title,
                            'message' => trim($message),
                            'sent_at' => optional($s->reviewed_at)->toIso8601String(),
                            'is_read' => $this->hasDismissed($user, 'submission_review', (int) $s->id),
                            'link' => route('student.workspace'),
                            'meta' => [
                                'status' => $status,
                                'milestone_id' => (int) ($s->milestone_id ?? 0),
                                'reviewer' => $reviewer,
                            ],
                        ];
                    })
            );

            $this->appendMilestoneDeadlineItems($user, $items, $t);
        }

        if (in_array(($user->role ?? null), ['hod', 'admin'], true)) {
            $teamsPendingQuery = Team::query()
                ->with(['leader:id,name,email'])
                ->where('review_status', 'pending')
                ->latest('id')
                ->limit(40);

            if (($user->role ?? null) === 'hod' && $user->department) {
                $teamsPendingQuery->where('department', $user->department);
            }

            $items = $items->concat(
                $teamsPendingQuery->get()->map(function (Team $team) use ($user) {
                    $leader = $team->leader?->name ?? 'Student';
                    $dept = $team->department ? " · Dept: {$team->department}" : '';

                    return [
                        'kind' => 'team_review',
                        'id' => (int) $team->id,
                        'title' => 'Team approval needed',
                        'message' => "New team \"{$team->name}\" created by {$leader}. Status: pending{$dept}",
                        'sent_at' => optional($team->created_at ?? $team->updated_at)->toIso8601String(),
                        'is_read' => $this->hasDismissed($user, 'team_review', (int) $team->id),
                        'link' => route('hod.panel'),
                        'meta' => [
                            'team_id' => (int) $team->id,
                            'department' => $team->department,
                        ],
                    ];
                })
            );

            if (($user->role ?? null) === 'hod') {
                $this->appendMilestoneDeadlineItems($user, $items, $t);
            }
        }

        if (in_array(($user->role ?? null), ['supervisor', 'admin'], true)) {
            $crQuery = ChallengeRequest::query()
                ->with(['industryChallenge:id,title,deadline', 'team:id,name', 'requestedByStudent:id,name'])
                ->latest('id')
                ->limit(40);
            if (($user->role ?? null) === 'supervisor') {
                $crQuery->where('supervisor_id', $user->id);
            }
            $items = $items->concat(
                $crQuery->get()->map(function (ChallengeRequest $cr) use ($user) {
                    $challengeTitle = $cr->industryChallenge?->title ?? 'Challenge';
                    $teamName = $cr->team?->name ?? 'Team';
                    $status = $cr->status ?? 'pending';
                    $who = $cr->requestedByStudent?->name ?? 'Student';

                    return [
                        'kind' => 'challenge_request',
                        'id' => (int) $cr->id,
                        'title' => $status === 'pending' ? 'Challenge request pending' : 'Challenge request updated',
                        'message' => "{$who} requested: {$challengeTitle} (Team: {$teamName}) · Status: {$status}",
                        'sent_at' => optional($cr->decided_at ?? $cr->updated_at)->toIso8601String(),
                        'is_read' => $this->hasDismissed($user, 'challenge_request', (int) $cr->id),
                        'link' => route('supervisor.challenge-requests.pending'),
                        'meta' => [
                            'status' => $status,
                            'team' => $teamName,
                        ],
                    ];
                })
            );

            $teamsQuery = Team::query()->whereNotNull('project_id');
            if (($user->role ?? null) === 'supervisor') {
                $teamsQuery->where('supervisor_id', $user->id);
            }
            $projectIds = $teamsQuery->pluck('project_id')->filter()->map(fn ($id) => (int) $id)->values()->all();
            if (count($projectIds) > 0) {
                $pendingIds = $this->latestPendingSubmissionIdsForProjects($projectIds);
                $items = $items->concat(
                    Submission::query()
                        ->with(['milestone:id,project_id,title', 'submittedBy:id,name', 'milestone.project.team:id,name'])
                        ->whereIn('id', $pendingIds)
                        ->get()
                        ->map(function (Submission $s) use ($user, $t) {
                            $milestoneTitle = $s->milestone?->title ?? 'Milestone';
                            $who = $s->submittedBy?->name ?? 'Student';
                            $teamName = $s->milestone?->project?->team?->name ?? $t['team_default'];
                            $message = str_replace([':student', ':milestone', ':team'], [$who, $milestoneTitle, $teamName], $t['submission_pending_msg']);

                            return [
                                'kind' => 'submission_pending',
                                'id' => (int) $s->id,
                                'title' => $t['submission_pending_title'],
                                'message' => $message,
                                'sent_at' => optional($s->submitted_at ?? $s->created_at)->toIso8601String(),
                                'is_read' => $this->hasDismissed($user, 'submission_pending', (int) $s->id),
                                'link' => route('supervisor.requests'),
                                'meta' => [
                                    'milestone_id' => (int) ($s->milestone_id ?? 0),
                                    'student' => $who,
                                    'team' => $teamName,
                                ],
                            ];
                        })
                );
            }

            if (($user->role ?? null) === 'supervisor' || ($user->role ?? null) === 'admin') {
                $this->appendMilestoneDeadlineItems($user, $items, $t);
            }
        }

        if (($user->role ?? null) === 'industry') {
            $items = $items->concat(
                ChallengeRequest::query()
                    ->with(['industryChallenge:id,title,deadline', 'team:id,name', 'supervisor:id,name'])
                    ->whereHas('industryChallenge', fn ($q) => $q->where('posted_by_user_id', $user->id))
                    ->where('status', 'approved')
                    ->latest('decided_at')
                    ->limit(50)
                    ->get()
                    ->map(function (ChallengeRequest $cr) use ($user) {
                        $challengeTitle = $cr->industryChallenge?->title ?? 'Challenge';
                        $teamName = $cr->team?->name ?? 'Team';

                        return [
                            'kind' => 'challenge_assigned',
                            'id' => (int) $cr->id,
                            'title' => 'Challenge assigned',
                            'message' => $cr->company_notes ?: "Your challenge \"{$challengeTitle}\" was assigned to team {$teamName}.",
                            'sent_at' => optional($cr->company_decided_at ?? $cr->decided_at ?? $cr->updated_at)->toIso8601String(),
                            'is_read' => $this->hasDismissed($user, 'challenge_assigned', (int) $cr->id),
                            'link' => route('industry.portal'),
                            'meta' => [
                                'challenge' => $challengeTitle,
                                'team' => $teamName,
                            ],
                        ];
                    })
            );
        }

        return $items
            ->filter(fn ($row) => is_array($row) && ($row['sent_at'] ?? null))
            ->map(function (array $row) {
                $sort = match ($row['kind'] ?? '') {
                    'milestone_deadline' => 1_000_000_000_000 - (Carbon::parse($row['meta']['due_date'] ?? $row['sent_at'])->timestamp),
                    default => (int) (strtotime((string) ($row['sent_at'] ?? '')) ?: 0),
                };
                $row['_sort'] = $sort;

                return $row;
            })
            ->sortByDesc('_sort')
            ->take($limit)
            ->map(function (array $row) {
                unset($row['_sort']);

                return $row;
            })
            ->values()
            ->all();
    }

    private function appendMilestoneDeadlineItems(User $user, Collection $items, array $t): void
    {
        $role = $user->role ?? null;
        if (! in_array($role, ['student', 'supervisor', 'hod', 'admin'], true)) {
            return;
        }

        $start = now()->startOfDay()->toDateString();
        $end = now()->addDays(self::MILESTONE_DEADLINE_DAYS)->endOfDay()->toDateString();

        $query = Milestone::query()
            ->with(['project.team:id,name,department,supervisor_id'])
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', $start)
            ->whereDate('due_date', '<=', $end)
            ->whereIn('status', ['pending', 'in_review', 'rejected']);

        if ($role === 'student') {
            $teamIds = TeamMember::query()->where('user_id', $user->id)->pluck('team_id')->all();
            if ($teamIds === []) {
                return;
            }
            $projectIds = Team::query()->whereIn('id', $teamIds)->whereNotNull('project_id')->pluck('project_id')->map(fn ($id) => (int) $id)->all();
            if ($projectIds === []) {
                return;
            }
            $query->whereIn('project_id', $projectIds);
        } elseif ($role === 'supervisor') {
            $projectIds = Team::query()->where('supervisor_id', $user->id)->whereNotNull('project_id')->pluck('project_id')->map(fn ($id) => (int) $id)->all();
            if ($projectIds === []) {
                return;
            }
            $query->whereIn('project_id', $projectIds);
        } elseif ($role === 'hod') {
            $tq = Team::query()->whereNotNull('project_id');
            if ($user->department) {
                $tq->where('department', $user->department);
            }
            $projectIds = $tq->pluck('project_id')->map(fn ($id) => (int) $id)->all();
            if ($projectIds === []) {
                return;
            }
            $query->whereIn('project_id', $projectIds);
        } elseif ($role === 'admin') {
            $projectIds = Team::query()->whereNotNull('project_id')->pluck('project_id')->map(fn ($id) => (int) $id)->unique()->all();
            if ($projectIds === []) {
                return;
            }
            $query->whereIn('project_id', $projectIds);
        }

        foreach ($query->orderBy('due_date')->limit(40)->get() as $m) {
            $teamName = $m->project?->team?->name ?? $t['team_default'];
            $due = (string) $m->due_date;
            $message = str_replace([':milestone', ':team', ':due'], [$m->title, $teamName, $due], $t['milestone_deadline_msg']);

            $link = match ($role) {
                'student' => route('student.workspace'),
                'hod' => route('hod.teams.monitor'),
                default => route('supervisor.projects'),
            };

            $items->push([
                'kind' => 'milestone_deadline',
                'id' => (int) $m->id,
                'title' => $t['milestone_deadline_title'],
                'message' => $message,
                'sent_at' => Carbon::parse($due)->startOfDay()->toIso8601String(),
                'is_read' => $this->hasDismissed($user, 'milestone_deadline', (int) $m->id),
                'link' => $link,
                'meta' => [
                    'due_date' => $due,
                    'milestone_id' => (int) $m->id,
                    'team' => $teamName,
                ],
            ]);
        }
    }
}
