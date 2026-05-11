<?php

namespace App\Jobs;

use App\Contracts\DocumentTextExtractorInterface;
use App\Models\IndustryChallenge;
use App\Models\Project;
use App\Services\AiSimilarityService;
use App\Services\ChallengeAiFeedbackFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Schema;

class ProcessProjectEmbeddingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 120;

    public function __construct(
        public int $challengeId
    ) {}

    public function handle(
        AiSimilarityService $aiSimilarityService,
        DocumentTextExtractorInterface $documentTextExtractor,
        ChallengeAiFeedbackFactory $challengeAiFeedbackFactory
    ): void
    {
        $challenge = IndustryChallenge::query()->find($this->challengeId);
        if (! $challenge) {
            return;
        }

        $path = (string) $challenge->file_path;
        if ($path === '') {
            return;
        }

        $documentText = $documentTextExtractor->extractFromStoragePath($path);
        $composite = $aiSimilarityService->buildCompositeText(
            (string) $challenge->title,
            (string) $challenge->description,
            $documentText
        );

        $embedding = $aiSimilarityService->embed($composite);
        if (is_array($embedding) && $embedding !== []) {
            $challenge->update(['vector_embedding' => $embedding]);
        }

        $originality = is_array($embedding) && $embedding !== []
            ? $aiSimilarityService->compareToExisting($embedding, (int) $challenge->id)
            : $aiSimilarityService->compareToExistingByText(
                (string) $challenge->title,
                (string) $challenge->description,
                $documentText,
                (int) $challenge->id
            );

        $challenge->feedbacks()->create([
            'comment' => $challengeAiFeedbackFactory->buildFromExtractedText(
                (string) $challenge->title,
                (string) $challenge->description,
                $documentText,
                $originality
            ),
        ]);

        $category = $aiSimilarityService->classifyProject($composite);
        if (is_string($category) && $category !== '' && Schema::hasColumn('projects', 'category')) {
            Project::query()
                ->where('industry_challenge_id', $challenge->id)
                ->update(['category' => $category]);
        }
    }
}
