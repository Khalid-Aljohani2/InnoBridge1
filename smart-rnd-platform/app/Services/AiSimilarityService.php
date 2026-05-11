<?php

namespace App\Services;

use App\Contracts\DocumentTextExtractorInterface;
use App\Models\IndustryChallenge;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiSimilarityService
{
    public function __construct(
        private readonly DocumentTextExtractorInterface $documentTextExtractor,
    ) {}

    /**
     * Build text for embedding: title, description, and document excerpt (intro / abstract proxy).
     */
    public function buildCompositeText(string $title, string $description, string $documentText): string
    {
        $max = (int) config('similarity.max_text_chars', 8000);
        $doc = trim($documentText);
        $introLen = (int) min(4000, max(0, $max - mb_strlen($title) - mb_strlen($description) - 80));
        $intro = mb_substr($doc, 0, $introLen);
        $remaining = $max - mb_strlen($title) - mb_strlen($description) - mb_strlen($intro) - 80;
        $tail = $remaining > 0 ? mb_substr($doc, $introLen, $remaining) : '';

        $parts = [
            'العنوان: '.$title,
            'وصف المشروع: '.$description,
            'مقتطف من المستند (المقدمة/الملخص): '.$intro,
        ];
        if ($tail !== '') {
            $parts[] = 'تتمة من المستند: '.$tail;
        }

        $out = implode("\n\n", $parts);

        return mb_substr(trim($out), 0, $max);
    }

    /**
     * @return array<float>|null
     */
    public function embed(string $text): ?array
    {
        $key = $this->resolveHuggingFaceToken();
        if (! is_string($key) || $key === '') {
            Log::warning('AiSimilarityService: HUGGINGFACE_API_KEY not set.');

            return null;
        }

        $model = config('similarity.model', 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2');
        $response = $this->callHuggingFaceModel($model, [
            'inputs' => mb_substr($text, 0, (int) config('similarity.max_text_chars', 8000)),
            'options' => ['wait_for_model' => true],
        ], 'feature-extraction');
        if (! $response) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $data = $response->json();
        $vector = $this->normalizeEmbeddingResponse($data);

        return $vector;
    }

    /**
     * @param  mixed  $data
     * @return array<float>|null
     */
    private function normalizeEmbeddingResponse(mixed $data): ?array
    {
        if (! is_array($data)) {
            return null;
        }

        // Feature extraction often returns list of lists for single sentence
        if (isset($data[0]) && is_array($data[0]) && is_numeric($data[0][0] ?? null)) {
            $row = $data[0];

            return array_map(fn ($v) => (float) $v, $row);
        }

        if (is_numeric($data[0] ?? null)) {
            return array_map(fn ($v) => (float) $v, $data);
        }

        return null;
    }

    /**
     * Classify a project into a single technical domain label.
     */
    public function classifyProject(string $text): ?string
    {
        $token = $this->resolveHuggingFaceToken();
        if (! is_string($token) || $token === '') {
            Log::warning('AiSimilarityService: services.huggingface.key is not set.');

            return null;
        }

        $response = $this->callHuggingFaceModel('facebook/bart-large-mnli', [
            'inputs' => mb_substr(trim($text), 0, 4000),
            'parameters' => [
                'candidate_labels' => [
                    'AI',
                    'Cyber Security',
                    'IoT',
                    'Data Science',
                    'Web Development',
                    'Software Engineering',
                ],
                'multi_label' => false,
            ],
            'options' => ['wait_for_model' => true],
        ], 'zero-shot-classification');

        if (! $response || ! $response->successful()) {
            return null;
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            return null;
        }

        $labels = $payload['labels'] ?? null;
        if (! is_array($labels) || ! is_string($labels[0] ?? null)) {
            return null;
        }

        return trim((string) $labels[0]) ?: null;
    }

    private function resolveHuggingFaceToken(): string
    {
        return (string) (config('services.huggingface.key') ?: env('HUGGINGFACE_API_KEY') ?: '');
    }

    private function callHuggingFaceModel(string $model, array $payload, ?string $task = null): ?Response
    {
        $token = $this->resolveHuggingFaceToken();
        if ($token === '') {
            return null;
        }

        $endpoints = $this->candidateEndpoints($model, $task);

        $lastResponse = null;
        foreach ($endpoints as $endpoint) {
            $response = Http::timeout(60)
                ->withToken($token)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($endpoint, $payload);
            if ($response->successful()) {
                return $response;
            }

            $lastResponse = $response;
            if (in_array($response->status(), [401, 403], true)) {
                break;
            }
        }

        if ($lastResponse) {
            Log::warning('AiSimilarityService: HuggingFace request failed', [
                'model' => $model,
                'status' => $lastResponse->status(),
                'body' => mb_substr((string) $lastResponse->body(), 0, 600),
            ]);
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    private function candidateEndpoints(string $model, ?string $task = null): array
    {
        $base = [
            'https://router.huggingface.co/hf-inference/models/'.$model,
            'https://api-inference.huggingface.co/models/'.$model,
        ];

        if ($task === 'feature-extraction') {
            $base[] = 'https://api-inference.huggingface.co/pipeline/feature-extraction/'.$model;
        } elseif ($task === 'zero-shot-classification') {
            $base[] = 'https://api-inference.huggingface.co/pipeline/zero-shot-classification/'.$model;
        }

        return $base;
    }

    /**
     * @param  array<float>  $queryEmbedding
     * @return array{max_similarity: float, similarity_score: int, similarity_percent: int, tier: string, message_ar: string, matched_challenge_id: int|null, matched_title: string|null, corpus_count: int}
     */
    public function compareToExisting(array $queryEmbedding, ?int $excludeChallengeId): array
    {
        $query = IndustryChallenge::query()
            ->where('kind', 'student_idea')
            ->whereNotNull('vector_embedding');

        if ($excludeChallengeId !== null) {
            $query->where('id', '!=', $excludeChallengeId);
        }

        $rows = $query->get(['id', 'title', 'vector_embedding']);
        $corpusCount = $rows->count();

        $maxSim = 0.0;
        $matchedId = null;
        $matchedTitle = null;

        foreach ($rows as $row) {
            $vec = $row->vector_embedding;
            if (! is_array($vec) || $vec === []) {
                continue;
            }
            $sim = $this->cosineSimilarity($queryEmbedding, $vec);
            if ($sim > $maxSim) {
                $maxSim = $sim;
                $matchedId = (int) $row->id;
                $matchedTitle = (string) $row->title;
            }
        }

        return $this->classify($maxSim, $matchedId, $matchedTitle, $corpusCount);
    }

    /**
     * Lexical fallback when embedding provider is unavailable.
     *
     * @return array{max_similarity: float, similarity_score: int, similarity_percent: int, tier: string, message_ar: string, matched_challenge_id: int|null, matched_title: string|null, corpus_count: int}
     */
    public function compareToExistingByText(string $title, string $description, string $documentText, ?int $excludeChallengeId): array
    {
        $query = IndustryChallenge::query()
            ->where('kind', 'student_idea')
            ->whereNotNull('title');

        if ($excludeChallengeId !== null) {
            $query->where('id', '!=', $excludeChallengeId);
        }

        $rows = $query->get(['id', 'title', 'description', 'file_path']);
        $corpusCount = $rows->count();

        $candidate = $this->tokenize($title.' '.$description.' '.mb_substr($documentText, 0, 1500));
        if ($candidate === []) {
            return $this->classify(0.0, null, null, $corpusCount);
        }

        $maxSim = 0.0;
        $matchedId = null;
        $matchedTitle = null;

        foreach ($rows as $row) {
            $subjectSource = ((string) $row->title).' '.((string) $row->description);
            $path = trim((string) ($row->file_path ?? ''));
            if ($path !== '') {
                try {
                    $storedText = $this->documentTextExtractor->extractFromStoragePath($path);
                    if (trim($storedText) !== '') {
                        $subjectSource .= ' '.mb_substr($storedText, 0, 1500);
                    }
                } catch (\Throwable $e) {
                    Log::debug('AiSimilarityService: fallback text extraction failed', [
                        'challenge_id' => (int) $row->id,
                        'file_path' => $path,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $subject = $this->tokenize($subjectSource);
            // Use both Jaccard (balanced overlap) and containment (subset detection)
            // so copied introductions from a longer file do not look artificially low.
            $sim = max(
                $this->jaccard($candidate, $subject),
                $this->overlapCoefficient($candidate, $subject)
            );
            if ($sim > $maxSim) {
                $maxSim = $sim;
                $matchedId = (int) $row->id;
                $matchedTitle = (string) $row->title;
            }
        }

        $result = $this->classify($maxSim, $matchedId, $matchedTitle, $corpusCount);
        $result['message_ar'] .= ' (تم الحساب محلياً بدون مزود embeddings)';

        return $result;
    }

    /**
     * @return array{max_similarity: float, similarity_score: int, similarity_percent: int, tier: string, message_ar: string, matched_challenge_id: int|null, matched_title: string|null, corpus_count: int}
     */
    public function classify(float $maxSimilarity, ?int $matchedId, ?string $matchedTitle, int $corpusCount): array
    {
        $percent = (int) round($maxSimilarity * 100);
        $warn = (int) config('similarity.warn_min_percent', 40);
        $block = (int) config('similarity.block_min_percent', 70);

        if ($corpusCount === 0) {
            return [
                'max_similarity' => 0.0,
                'similarity_score' => 0,
                'similarity_percent' => 0,
                'tier' => 'unique',
                'message_ar' => 'فكرة فريدة — لا توجد مشاريع مسجّلة سابقاً للمقارنة ضمن المنصة.',
                'matched_challenge_id' => null,
                'matched_title' => null,
                'corpus_count' => 0,
            ];
        }

        if ($percent < $warn) {
            return [
                'max_similarity' => $maxSimilarity,
                'similarity_score' => $percent,
                'similarity_percent' => $percent,
                'tier' => 'unique',
                'message_ar' => 'فكرة فريدة! لا يُلاحظ تشابه ملحوظ مع المشاريع المسجّلة سابقاً.',
                'matched_challenge_id' => $matchedId,
                'matched_title' => $matchedTitle,
                'corpus_count' => $corpusCount,
            ];
        }

        if ($percent <= $block) {
            return [
                'max_similarity' => $maxSimilarity,
                'similarity_score' => $percent,
                'similarity_percent' => $percent,
                'tier' => 'similar',
                'message_ar' => 'توجد أفكار مشابهة، يرجى توضيح الفرق عن المشاريع السابقة.',
                'matched_challenge_id' => $matchedId,
                'matched_title' => $matchedTitle,
                'corpus_count' => $corpusCount,
            ];
        }

        return [
            'max_similarity' => $maxSimilarity,
            'similarity_score' => $percent,
            'similarity_percent' => $percent,
            'tier' => 'high_match',
            'message_ar' => 'تطابق عالٍ مع مشروع سابق، يرجى مراجعة الأصالة والتمييز عن العمل المسجّل.',
            'matched_challenge_id' => $matchedId,
            'matched_title' => $matchedTitle,
            'corpus_count' => $corpusCount,
        ];
    }

    /**
     * @param  array<float>  $a
     * @param  array<float>  $b
     */
    public function cosineSimilarity(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        if ($n === 0) {
            return 0.0;
        }

        $dot = 0.0;
        $na = 0.0;
        $nb = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }

        if ($na <= 0.0 || $nb <= 0.0) {
            return 0.0;
        }

        return $dot / (sqrt($na) * sqrt($nb));
    }

    /**
     * @return array<string>
     */
    private function tokenize(string $value): array
    {
        $value = mb_strtolower($value);
        $parts = preg_split('/[^\p{L}\p{N}]+/u', $value) ?: [];
        $parts = array_values(array_filter($parts, fn ($t) => mb_strlen((string) $t) >= 3));

        return array_values(array_unique($parts));
    }

    /**
     * @param  array<string>  $a
     * @param  array<string>  $b
     */
    private function jaccard(array $a, array $b): float
    {
        if ($a === [] || $b === []) {
            return 0.0;
        }

        $setA = array_fill_keys($a, true);
        $setB = array_fill_keys($b, true);

        $intersection = count(array_intersect_key($setA, $setB));
        $union = count($setA + $setB);
        if ($union === 0) {
            return 0.0;
        }

        return $intersection / $union;
    }

    /**
     * Similarity for subset matching: |A∩B| / min(|A|, |B|).
     * Useful when student text is an introduction copied from a larger document.
     *
     * @param  array<string>  $a
     * @param  array<string>  $b
     */
    private function overlapCoefficient(array $a, array $b): float
    {
        if ($a === [] || $b === []) {
            return 0.0;
        }

        $setA = array_fill_keys($a, true);
        $setB = array_fill_keys($b, true);
        $intersection = count(array_intersect_key($setA, $setB));
        $denominator = min(count($setA), count($setB));
        if ($denominator === 0) {
            return 0.0;
        }

        return $intersection / $denominator;
    }

    /**
     * Extract text from stored file, embed, and persist on the challenge (backfill / queue).
     */
    public function embedChallengeFromDisk(IndustryChallenge $challenge): bool
    {
        $path = (string) $challenge->file_path;
        if ($path === '') {
            return false;
        }

        $documentText = $this->documentTextExtractor->extractFromStoragePath($path);
        $composite = $this->buildCompositeText(
            (string) $challenge->title,
            (string) $challenge->description,
            $documentText
        );

        $embedding = $this->embed($composite);
        if ($embedding === null) {
            return false;
        }

        $challenge->update(['vector_embedding' => $embedding]);

        return true;
    }
}
