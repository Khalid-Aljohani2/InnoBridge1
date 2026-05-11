<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeamInvitation extends Model
{
    protected $fillable = [
        'team_id',
        'invited_user_id',
        'invited_by_user_id',
        'status',
        'decided_at',
        'seen_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'seen_at' => 'datetime',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function invitedUser()
    {
        return $this->belongsTo(User::class, 'invited_user_id');
    }

    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }
}

