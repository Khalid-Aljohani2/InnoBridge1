<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupervisorMilestone extends Model
{
    protected $fillable = [
        'supervisor_id',
        'plan_id',
        'supervisor_group_id',
        'title',
        'submission_title',
        'deadline',
        'increment_percent',
        'sort_order',
    ];

    protected $casts = [
        'deadline' => 'date',
    ];

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function group()
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function plan()
    {
        return $this->belongsTo(SupervisorMilestonePlan::class, 'plan_id');
    }
}
