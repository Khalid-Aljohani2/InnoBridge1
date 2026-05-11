<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table = 'feedback';

    protected $fillable = [
        'industry_challenge_id',
        'comment',
    ];

    public function challenge()
    {
        return $this->belongsTo(IndustryChallenge::class, 'industry_challenge_id');
    }
}
