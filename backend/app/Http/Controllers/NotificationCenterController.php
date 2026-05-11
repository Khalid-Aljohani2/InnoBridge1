<?php

namespace App\Http\Controllers;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\FacultyNotification;
use App\Models\GroupChatNotification;
use App\Models\StudentNotification;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Services\NotificationFeedService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class NotificationCenterController extends Controller
{
    public function __construct(
        private readonly NotificationFeedService $notificationFeedService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        return Inertia::render('Notifications/Index', [
            'items' => $this->notificationFeedService->feed($user, 200),
        ]);
    }

    public function markRead(Request $request)
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        $validated = $request->validate([
            'items' => 'nullable|array|max:200',
            'items.*.kind' => 'required|string|max:50',
            'items.*.id' => 'required|integer|min:1',
            'all' => 'nullable|boolean',
        ]);

        $markAll = (bool) ($validated['all'] ?? false);
        $items = $validated['items'] ?? [];

        if ($markAll) {
            $this->notificationFeedService->markAllDismissed($user);
            HandleInertiaRequests::forgetNavBellRemoteCache($user);

            return back()->with('success', 'Marked as read');
        }

        foreach ($items as $row) {
            $kind = (string) ($row['kind'] ?? '');
            $id = (int) ($row['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }

            if ($kind === 'group_chat' && Schema::hasTable('group_chat_notifications')) {
                GroupChatNotification::query()
                    ->whereKey($id)
                    ->where('user_id', $user->id)
                    ->update(['is_read' => true]);
            }

            if ($kind === 'supervisor' && ($user->role ?? null) === 'student') {
                StudentNotification::query()
                    ->whereKey($id)
                    ->where('student_id', $user->id)
                    ->update(['is_read' => true]);
            }

            if ($kind === 'team_invitation' && ($user->role ?? null) === 'student' && Schema::hasColumn('team_invitations', 'seen_at')) {
                TeamInvitation::query()
                    ->whereKey($id)
                    ->where('invited_user_id', $user->id)
                    ->where('status', 'pending')
                    ->update(['seen_at' => now()]);
            }

            if ($kind === 'faculty_notice' && Schema::hasTable('faculty_notifications')) {
                FacultyNotification::query()
                    ->whereKey($id)
                    ->where('recipient_user_id', $user->id)
                    ->update(['is_read' => true]);
            }

            $dismissKinds = [
                'submission_review',
                'submission_pending',
                'milestone_deadline',
                'challenge_request',
                'team_review',
                'challenge_assigned',
            ];
            if (in_array($kind, $dismissKinds, true)) {
                $this->notificationFeedService->markDismissed($user, $kind, $id);
            }
        }

        HandleInertiaRequests::forgetNavBellRemoteCache($user);

        return back()->with('success', 'Marked as read');
    }
}
