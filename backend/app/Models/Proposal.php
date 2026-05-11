<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    protected $fillable = [
        'industry_challenge_id',
        'student_user_id',
        'title',
        'summary',
        'tech_stack',
        'proposed_timeline',
        'status',
        'review_note',
        'reviewed_by_user_id',
        'reviewed_at',
        'generated_project_id',
    ];

    public function challenge()
    {
        return $this->belongsTo(IndustryChallenge::class, 'industry_challenge_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_user_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function generatedProject()
    {
        return $this->belongsTo(Project::class, 'generated_project_id');
    }
}
