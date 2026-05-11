<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupChatNotification extends Model
{
    protected $fillable = [
        'user_id',
        'sender_id',
        'supervisor_group_id',
        'supervisor_group_message_id',
        'title',
        'body',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(SupervisorGroupMessage::class, 'supervisor_group_message_id');
    }
}
