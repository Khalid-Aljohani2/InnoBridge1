<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorGroupMember extends Model
{
    protected $fillable = [
        'supervisor_group_id',
        'student_id',
    ];

    public function group()
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
