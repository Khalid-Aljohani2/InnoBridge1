<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorGroupMessage extends Model
{
    protected $fillable = [
        'supervisor_group_id',
        'sender_id',
        'message',
    ];

    public function group()
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
