<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChallengeHistory extends Model
{
    protected $fillable = [
        'industry_challenge_id',
        'actor_user_id',
        'action',
        'title',
        'description',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function challenge()
    {
        return $this->belongsTo(IndustryChallenge::class, 'industry_challenge_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
