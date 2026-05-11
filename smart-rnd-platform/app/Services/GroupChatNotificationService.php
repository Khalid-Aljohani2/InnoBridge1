<?php

namespace App\Services;

use App\Models\GroupChatNotification;
use App\Models\SupervisorGroup;
use App\Models\SupervisorGroupMessage;
use Illuminate\Support\Str;

class GroupChatNotificationService
{
    /**
     * Notify all group participants except the sender when a chat message is posted.
     */
    public function notifyParticipants(SupervisorGroup $group, SupervisorGroupMessage $message): void
    {
        $senderId = (int) $message->sender_id;

        $group->loadMissing(['members', 'admins']);

        $recipientIds = collect();

        if ((int) $group->supervisor_id !== $senderId) {
            $recipientIds->push((int) $group->supervisor_id);
        }

        foreach ($group->members as $member) {
            $sid = (int) $member->student_id;
            if ($sid !== $senderId) {
                $recipientIds->push($sid);
            }
        }

        foreach ($group->admins as $admin) {
            $aid = (int) $admin->user_id;
            if ($aid !== $senderId) {
                $recipientIds->push($aid);
            }
        }

        $recipientIds = $recipientIds->unique()->values();
        if ($recipientIds->isEmpty()) {
            return;
        }

        $groupName = $group->name ?? 'Group';
        $preview = Str::limit(trim(strip_tags($message->message)), 200);

        $rows = [];
        $now = now();
        foreach ($recipientIds as $uid) {
            $rows[] = [
                'user_id' => $uid,
                'sender_id' => $senderId,
                'supervisor_group_id' => $group->id,
                'supervisor_group_message_id' => $message->id,
                'title' => 'New message in '.$groupName,
                'body' => $preview !== '' ? $preview : '[Message]',
                'is_read' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 50) as $chunk) {
            GroupChatNotification::insert($chunk);
        }
    }
}
