<?php

namespace App\Http\Controllers;

use App\Models\ChallengeRequest;
use App\Models\GroupChatNotification;
use App\Models\Submission;
use App\Models\StudentNotification;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class StudentNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless(($user?->role ?? null) === 'student', 403);

        $limit = 80;

        $teamInvites = TeamInvitation::query()
            ->with(['team:id,name,leader_id', 'team.leader:id,name', 'invitedBy:id,name'])
            ->where('invited_user_id', $user->id)
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(function (TeamInvitation $inv) {
                $teamName = $inv->team?->name ?? 'Team';
                $inviter = $inv->invitedBy?->name ?? 'Student';
                $status = $inv->status ?? 'pending';
                $title = $status === 'pending'
                    ? 'Team invitation'
                    : 'Team invitation update';
                $message = $status === 'pending'
                    ? "You were invited by {$inviter} to join {$teamName}."
                    : "Invitation to {$teamName} is {$status}.";

                return [
                    'kind' => 'team_invitation',
                    'id' => (int) $inv->id,
                    'title' => $title,
                    'message' => $message,
                    'sent_at' => optional($inv->created_at)->toIso8601String(),
                    'is_read' => false,
                    'link' => route('student.team'),
                    'meta' => [
                        'team_id' => (int) ($inv->team_id ?? 0),
                        'status' => $status,
                    ],
                ];
            });

        $groupChat = collect();
        if (Schema::hasTable('group_chat_notifications')) {
            $groupChat = GroupChatNotification::with(['sender:id,name', 'group:id,name'])
                ->where('user_id', $user->id)
                ->latest('id')
                ->limit(40)
                ->get()
                ->map(function (GroupChatNotification $n) {
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
                });
        }

        $direct = StudentNotification::with('supervisor:id,name')
            ->where('student_id', $user->id)
            ->latest('id')
            ->limit(30)
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
            });

        $teamIds = TeamMember::query()
            ->where('user_id', $user->id)
            ->pluck('team_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $challengeDecisions = collect();
        if (count($teamIds) > 0) {
            $challengeDecisions = ChallengeRequest::query()
                ->with(['industryChallenge:id,title,deadline', 'supervisor:id,name'])
                ->whereIn('team_id', $teamIds)
                ->whereIn('status', ['approved', 'rejected'])
                ->latest('decided_at')
                ->limit(20)
                ->get()
                ->map(function (ChallengeRequest $cr) {
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
                        'is_read' => false,
                        'link' => route('student.industry-challenges'),
                        'meta' => [
                            'status' => $status,
                            'challenge_id' => (int) ($cr->industry_challenge_id ?? 0),
                            'supervisor' => $cr->supervisor?->name,
                        ],
                    ];
                });
        }

        $submissionReviews = Submission::query()
            ->with(['milestone:id,project_id,title', 'reviewedBy:id,name'])
            ->where('submitted_by_user_id', $user->id)
            ->whereNotNull('reviewed_at')
            ->latest('reviewed_at')
            ->limit(25)
            ->get()
            ->map(function (Submission $s) {
                $milestoneTitle = $s->milestone?->title ?? 'Milestone';
                $status = $s->status ?? 'reviewed';
                return [
                    'kind' => 'submission_review',
                    'id' => (int) $s->id,
                    'title' => 'Submission reviewed',
                    'message' => "Your submission for {$milestoneTitle} was updated to: {$status}.",
                    'sent_at' => optional($s->reviewed_at)->toIso8601String(),
                    'is_read' => false,
                    'link' => route('student.workspace'),
                    'meta' => [
                        'status' => $status,
                        'milestone_id' => (int) ($s->milestone_id ?? 0),
                        'reviewer' => $s->reviewedBy?->name,
                    ],
                ];
            });

        $items = $teamInvites
            ->concat($groupChat)
            ->concat($challengeDecisions)
            ->concat($submissionReviews)
            ->concat($direct)
            ->sortByDesc(fn (array $row) => $row['sent_at'] ?? '')
            ->take($limit)
            ->values();

        return Inertia::render('Student/Notifications', [
            'items' => $items,
        ]);
    }
}

