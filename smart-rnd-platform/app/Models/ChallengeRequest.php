<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChallengeRequest extends Model
{
    protected $fillable = [
        'team_id',
        'industry_challenge_id',
        'requested_by_student_id',
        'supervisor_id',
        'status',
        'supervisor_notes',
        'decided_at',
        'company_status',
        'company_notes',
        'company_decided_at',
        'presented_to_company_at',
        'company_nominated_for_hod_at',
        'hod_nomination_status',
        'hod_nomination_notes',
        'hod_nomination_decided_at',
        'hod_nomination_template_key',
        'hod_sent_to_company_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
        'company_decided_at' => 'datetime',
        'presented_to_company_at' => 'datetime',
        'company_nominated_for_hod_at' => 'datetime',
        'hod_nomination_decided_at' => 'datetime',
        'hod_sent_to_company_at' => 'datetime',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function industryChallenge()
    {
        return $this->belongsTo(IndustryChallenge::class);
    }

    public function requestedByStudent()
    {
        return $this->belongsTo(User::class, 'requested_by_student_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}

