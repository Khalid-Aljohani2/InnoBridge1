<?php

namespace App\Services;

use App\Contracts\AiReviewServiceInterface;
use App\Contracts\DocumentTextExtractorInterface;
use Illuminate\Http\UploadedFile;

class ChallengeAiFeedbackFactory
{
    public function __construct(
        private readonly DocumentTextExtractorInterface $documentTextExtractor,
        private readonly AiReviewServiceInterface $aiReviewService,
    ) {}

    public function buildFromUploadedFile(string $title, string $description, UploadedFile $file, ?array $originality = null): string
    {
        return $this->buildFromExtractedText(
            $title,
            $description,
            $this->documentTextExtractor->extract($file),
            $originality
        );
    }

    /**
     * @param  array<string, mixed>|null  $originality
     */
    public function buildFromExtractedText(string $title, string $description, string $documentText, ?array $originality = null): string
    {
        $aiResult = $this->aiReviewService->analyze($title, $description, $documentText);
        $brief = $this->buildBrief($title, $description, $aiResult);

        $payload = [
            'title' => $title,
            'description' => $description,
            'provider' => $aiResult['provider'] ?? 'fallback',
            'summary' => array_values($aiResult['summary'] ?? []),
            'suggestions' => array_values($aiResult['suggestions'] ?? []),
            'brief' => $brief,
        ];

        if ($originality !== null) {
            $payload['originality'] = $originality;
        }

        return 'AI_REVIEW_JSON:'.json_encode($payload, JSON_UNESCAPED_UNICODE);
    }

    /**
     * @param  array<string, mixed>  $aiResult
     * @return array{idea: string, target: string}
     */
    private function buildBrief(string $title, string $description, array $aiResult): array
    {
        $idea = trim($title) !== '' ? trim($title) : 'فكرة مشروع طالب';
        $target = $this->extractTarget($description, $aiResult);

        return [
            'idea' => mb_substr($idea, 0, 140),
            'target' => mb_substr($target, 0, 220),
        ];
    }

    /**
     * @param  array<string, mixed>  $aiResult
     */
    private function extractTarget(string $description, array $aiResult): string
    {
        $description = trim($description);
        $patterns = [
            '/(?:يهدف(?:\s+المشروع)?\s+إلى|الهدف(?:\s+من\s+المشروع)?\s+هو|هدف\s+المشروع)\s*(.+?)(?:[.!\n]|$)/u',
            '/(?:aims?\s+to|the\s+goal\s+is\s+to)\s*(.+?)(?:[.!\n]|$)/iu',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $description, $m) === 1) {
                $candidate = trim((string) ($m[1] ?? ''));
                if ($candidate !== '') {
                    return $candidate;
                }
            }
        }

        $summary = $aiResult['summary'][0] ?? null;
        if (is_string($summary) && trim($summary) !== '') {
            return trim($summary);
        }

        if ($description !== '') {
            return mb_substr($description, 0, 220);
        }

        return 'لم يتم توفير هدف واضح بعد.';
    }
}
