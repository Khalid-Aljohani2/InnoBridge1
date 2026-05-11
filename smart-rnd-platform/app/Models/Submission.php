<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'milestone_id',
        'submitted_by_user_id',
        'reviewed_by_user_id',
        'title',
        'notes',
        'review_notes',
        'file_path',
        'version',
        'status',
        'submitted_at',
        'reviewed_at',
    ];

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }
}
