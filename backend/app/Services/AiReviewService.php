<?php

namespace App\Services;

use App\Contracts\AiReviewServiceInterface;
use Illuminate\Support\Facades\Http;

class AiReviewService implements AiReviewServiceInterface
{
    public function analyze(string $title, string $description, string $documentText): array
    {
        $summaryFallback = $this->fallbackSummary($title, $description, $documentText);
        $suggestionsFallback = $this->fallbackSuggestions($description, $documentText);

        $provider = env('AI_PROVIDER', 'none');
        if ($provider === 'openai' && env('OPENAI_API_KEY')) {
            $ai = $this->callOpenAi($title, $description, $documentText);
            if ($ai !== null) {
                return $ai;
            }
        }
        if ($provider === 'gemini' && env('GEMINI_API_KEY')) {
            $ai = $this->callGemini($title, $description, $documentText);
            if ($ai !== null) {
                return $ai;
            }
        }

        return [
            'provider' => 'fallback',
            'summary' => $summaryFallback,
            'suggestions' => $suggestionsFallback,
        ];
    }

    private function callOpenAi(string $title, string $description, string $documentText): ?array
    {
        $prompt = $this->buildPrompt($title, $description, $documentText);
        $response = Http::timeout(30)
            ->withToken(env('OPENAI_API_KEY'))
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
                'temperature' => 0.2,
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an academic reviewer. Return strict JSON only.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

        if (! $response->successful()) {
            return null;
        }

        $content = data_get($response->json(), 'choices.0.message.content');
        $decoded = json_decode((string) $content, true);
        if (! is_array($decoded) || ! isset($decoded['summary'], $decoded['suggestions'])) {
            return null;
        }

        return [
            'provider' => 'openai',
            'summary' => array_values((array) $decoded['summary']),
            'suggestions' => array_values((array) $decoded['suggestions']),
        ];
    }

    private function callGemini(string $title, string $description, string $documentText): ?array
    {
        $prompt = $this->buildPrompt($title, $description, $documentText);
        $model = env('GEMINI_MODEL', 'gemini-1.5-flash');
        $response = Http::timeout(30)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=".env('GEMINI_API_KEY'),
            [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'responseMimeType' => 'application/json',
                ],
            ],
        );

        if (! $response->successful()) {
            return null;
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        $decoded = json_decode((string) $text, true);
        if (! is_array($decoded) || ! isset($decoded['summary'], $decoded['suggestions'])) {
            return null;
        }

        return [
            'provider' => 'gemini',
            'summary' => array_values((array) $decoded['summary']),
            'suggestions' => array_values((array) $decoded['suggestions']),
        ];
    }

    private function buildPrompt(string $title, string $description, string $documentText): string
    {
        $excerpt = mb_substr(trim($documentText), 0, 8000);
        return "Analyze this graduation project submission and return JSON with keys summary (array of short bullet points) and suggestions (array of actionable improvements).\n"
            ."Title: {$title}\n"
            ."Student description: {$description}\n"
            ."Document text excerpt: {$excerpt}\n";
    }

    private function fallbackSummary(string $title, string $description, string $documentText): array
    {
        $snippet = trim(mb_substr($documentText, 0, 260));
        return array_values(array_filter([
            "Title focus: {$title}",
            $description !== '' ? 'Student provided project context and scope description.' : null,
            $snippet !== '' ? "Document excerpt: {$snippet}" : 'No extractable text found in the uploaded file.',
        ]));
    }

    private function fallbackSuggestions(string $description, string $documentText): array
    {
        $result = [];
        if (mb_strlen(trim($description)) < 120) {
            $result[] = 'Expand the problem statement, objectives, and expected outcomes in more detail.';
        }
        if (! str_contains(mb_strtolower($description), 'method') && ! str_contains($description, 'منهج')) {
            $result[] = 'Add a clear methodology section: steps, tools, and success criteria.';
        }
        if (mb_strlen(trim($documentText)) < 300) {
            $result[] = 'The file has limited extractable content; include clearer section headings and fuller draft text.';
        }
        if ($result === []) {
            $result[] = 'Submission quality is acceptable; next step is refining evaluation metrics and timeline checkpoints.';
        }
        return $result;
    }
}
