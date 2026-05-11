<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorMilestonePlan extends Model
{
    protected $fillable = [
        'supervisor_id',
        'supervisor_group_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function group()
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function milestones()
    {
        return $this->hasMany(SupervisorMilestone::class, 'plan_id');
    }
}
