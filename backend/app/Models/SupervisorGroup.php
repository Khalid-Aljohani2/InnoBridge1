<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorGroup extends Model
{
    protected $fillable = [
        'supervisor_id',
        'name',
        'description',
        'kind',
    ];

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function members()
    {
        return $this->hasMany(SupervisorGroupMember::class);
    }

    public function messages()
    {
        return $this->hasMany(SupervisorGroupMessage::class);
    }

    public function latestMessage()
    {
        return $this->hasOne(SupervisorGroupMessage::class)->latestOfMany();
    }

    public function admins()
    {
        return $this->hasMany(SupervisorGroupAdmin::class);
    }

    public function adminUsers()
    {
        return $this->belongsToMany(User::class, 'supervisor_group_admins', 'supervisor_group_id', 'user_id');
    }

    public function milestoneTemplates()
    {
        return $this->hasMany(SupervisorMilestone::class, 'supervisor_group_id');
    }

    public function milestonePlans()
    {
        return $this->hasMany(SupervisorMilestonePlan::class, 'supervisor_group_id');
    }
}
