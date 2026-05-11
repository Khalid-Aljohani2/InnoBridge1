<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'title',
        'abstract',
        'category',
        'type',
        'industry_challenge_id',
        'milestone_plan_id',
        'owner_user_id',
        'status',
        'current_progress',
        'start_date',
        'target_end_date',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function industryChallenge()
    {
        return $this->belongsTo(IndustryChallenge::class, 'industry_challenge_id');
    }

    public function milestonePlan()
    {
        return $this->belongsTo(SupervisorMilestonePlan::class, 'milestone_plan_id');
    }

    public function team()
    {
        return $this->hasOne(Team::class);
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }

    public function proposal()
    {
        return $this->hasOne(Proposal::class, 'generated_project_id');
    }
}
