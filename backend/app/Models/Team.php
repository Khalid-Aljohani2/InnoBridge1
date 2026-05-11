<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = [
        'project_id',
        'industry_project_id',
        'supervisor_designated_workspace',
        'name',
        'department',
        'leader_id',
        'supervisor_id',
        'supervisor_group_id',
        'students_group_id',
        'reviewed_by_user_id',
        'max_members',
        'is_active',
        'review_status',
        'review_notes',
        'reviewed_at',
    ];

    // العلاقة: قائد الفريق (طالب)
    public function leader()
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    // العلاقة: مشرف الفريق (أكاديمي)
    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function supervisorGroup()
    {
        return $this->belongsTo(SupervisorGroup::class, 'supervisor_group_id');
    }

    public function studentsGroup()
    {
        return $this->belongsTo(SupervisorGroup::class, 'students_group_id');
    }

    public function industryProject()
    {
        return $this->belongsTo(Project::class, 'industry_project_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function members()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function challengeRequests()
    {
        return $this->hasMany(ChallengeRequest::class);
    }
}