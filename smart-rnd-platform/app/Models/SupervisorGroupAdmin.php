<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorGroupAdmin extends Model
{
    protected $fillable = [
        'supervisor_group_id',
        'user_id',
    ];

    public function group()
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
