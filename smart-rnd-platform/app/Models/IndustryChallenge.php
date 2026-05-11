<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class IndustryChallenge extends Model
{
    protected $fillable = [
        'title',
        'description',
        'posted_date',
        'deadline',
        'posted_by_user_id',
        'kind',
        'file_path',
        'vector_embedding',
        'progress',
        'current_milestone',
        'review_status',
        'milestone_plan_id',
        'published_to_students_at',
    ];

    protected function casts(): array
    {
        return [
            'vector_embedding' => 'array',
            'published_to_students_at' => 'datetime',
        ];
    }

    /**
     * Omit {@see $vector_embedding} from SQL — vectors are huge and Listing/API pages never need them.
     * Always use similarity jobs / AiSimilarityService queries when embeddings are required.
     *
     * @param  Builder<IndustryChallenge>  $query
     * @return Builder<IndustryChallenge>
     */
    public function scopeWithoutVectorEmbedding(Builder $query): Builder
    {
        return $query->select([
            'id',
            'title',
            'description',
            'posted_date',
            'deadline',
            'posted_by_user_id',
            'kind',
            'file_path',
            'progress',
            'current_milestone',
            'review_status',
            'milestone_plan_id',
            'published_to_students_at',
            'created_at',
            'updated_at',
        ]);
    }

    // العلاقة: التحدي تم نشره بواسطة مستخدم (شركة)
    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by_user_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class, 'industry_challenge_id');
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'industry_challenge_id');
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'industry_challenge_id');
    }

    public function milestonePlan()
    {
        return $this->belongsTo(SupervisorMilestonePlan::class, 'milestone_plan_id');
    }

    public function histories()
    {
        return $this->hasMany(ChallengeHistory::class, 'industry_challenge_id')->latest();
    }
}