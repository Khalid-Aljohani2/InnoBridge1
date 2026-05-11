<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = [
        'submission_id',
        'evaluator_user_id',
        'score',
        'feedback',
        'decision',
        'evaluated_at',
    ];

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_user_id');
    }
}
