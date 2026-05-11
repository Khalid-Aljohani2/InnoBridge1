<?php

namespace App\Services;

use App\Models\IndustryChallenge;

class ChallengeHistoryService
{
    public function record(
        IndustryChallenge $challenge,
        string $action,
        string $title,
        ?string $description = null,
        array $meta = []
    ): void {
        $challenge->histories()->create([
            'actor_user_id' => auth()->id(),
            'action' => $action,
            'title' => $title,
            'description' => $description,
            'meta' => $meta,
        ]);
    }
}
