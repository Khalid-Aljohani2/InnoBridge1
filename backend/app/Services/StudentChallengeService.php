<?php

namespace App\Services;

use App\Contracts\DocumentTextExtractorInterface;
use App\Jobs\ProcessProjectEmbeddingJob;
use App\Models\IndustryChallenge;
use App\Models\Milestone;
use App\Models\Submission;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\UploadedFile;

class StudentChallengeService
{
    public function __construct(
        private readonly ChallengeAiFeedbackFactory $aiFeedbackFactory,
        private readonly ChallengeHistoryService $challengeHistoryService,
        private readonly AiSimilarityService $aiSimilarityService,
        private readonly DocumentTextExtractorInterface $documentTextExtractor,
    ) {}

    /**
     * Create the first project submission for a student.
     */
    public function storeInitialSubmission($user, array $validated): array
    {
        if ($user->role !== 'student') {
            return ['ok' => false, 'message' => 'فقط الطلاب يمكنهم رفع ملفات المشاريع.'];
        }

        $hasExistingProject = IndustryChallenge::where('posted_by_user_id', $user->id)->exists();
        if ($hasExistingProject) {
            return ['ok' => false, 'message' => 'مسموح لكل طالب مشروع واحد فقط. يمكنك تحديث المشروع الحالي بدلاً من إنشاء مشروع جديد.'];
        }

        $title = trim((string) $validated['title']);
        $description = trim((string) $validated['description']);
        $file = $validated['file'];
        $documentText = $this->documentTextExtractor->extract($file);
        if (! $this->hasExtractableContent($file, $documentText, $description)) {
            return ['ok' => false, 'message' => 'الملف غير مقبول: الملف فارغ أو لا يحتوي على محتوى قابل للقراءة.'];
        }
        $path = $file->store(config('similarity.projects_directory', 'projects'), 'public');
        $originality = $this->resolveOriginality($title, $description, $documentText, null);
        $embedding = $originality['_embedding'] ?? null;
        unset($originality['_embedding']);

        $aiFeedbackPayload = $this->aiFeedbackFactory->buildFromExtractedText($title, $description, $documentText, $originality);

        $challenge = IndustryChallenge::create([
            'title' => $title,
            'description' => $description,
            'file_path' => $path,
            'vector_embedding' => $embedding,
            'posted_by_user_id' => $user->id,
            'kind' => 'student_idea',
            'posted_date' => now(),
            'progress' => 0,
            'current_milestone' => 'الفكرة مرفوعة - بانتظار قرار المشرف',
            'review_status' => 'pending_action',
        ]);

        $challenge->feedbacks()->create([
            'comment' => $aiFeedbackPayload,
        ]);
        $this->challengeHistoryService->record(
            $challenge,
            'student_upload',
            'تم رفع الفكرة والملف',
            'تم إرسال المشروع للمراجعة الأولى.',
            [
                'review_status' => 'pending_action',
                'milestone' => $challenge->current_milestone,
                'progress' => (int) $challenge->progress,
                'file_path' => $challenge->file_path,
            ]
        );

        $this->dispatchEmbeddingJobIfNeeded($challenge, $embedding);

        return [
            'ok' => true,
            'message' => 'تم رفع فكرة المشروع بنجاح، وهي الآن تحت المراجعة.',
            'originality' => $originality,
        ];
    }

    /**
     * Upload a new student document and keep project in review workflow.
     */
    public function uploadSubmission($user, array $validated): array
    {
        if ($user->role !== 'student') {
            return ['ok' => false, 'message' => 'فقط الطلاب يمكنهم رفع الملفات.'];
        }

        $studentId = (int) $user->id;
        $challenge = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->where('posted_by_user_id', $studentId)
            ->latest()
            ->first();
        $title = trim((string) $validated['title']);
        $description = trim((string) $validated['description']);
        $file = $validated['file'];
        $documentText = $this->documentTextExtractor->extract($file);
        if (! $this->hasExtractableContent($file, $documentText, $description)) {
            return ['ok' => false, 'message' => 'الملف غير مقبول: الملف فارغ أو لا يحتوي على محتوى قابل للقراءة.'];
        }
        $path = $file->store(config('similarity.projects_directory', 'projects'), 'public');
        $excludeId = $challenge?->id;
        $originality = $this->resolveOriginality($title, $description, $documentText, $excludeId);
        $embedding = $originality['_embedding'] ?? null;
        unset($originality['_embedding']);

        $aiFeedbackPayload = $this->aiFeedbackFactory->buildFromExtractedText($title, $description, $documentText, $originality);

        if (! $challenge) {
            $challenge = IndustryChallenge::create([
                'title' => $title,
                'description' => $description,
                'file_path' => $path,
                'vector_embedding' => $embedding,
                'posted_by_user_id' => $studentId,
                'kind' => 'student_idea',
                'posted_date' => now(),
                'progress' => 0,
                'current_milestone' => 'الفكرة مرفوعة - بانتظار قرار المشرف',
                'review_status' => 'pending_action',
            ]);
        } else {
            $challenge->update([
                'title' => $title,
                'description' => $description,
                'file_path' => $path,
                'vector_embedding' => $embedding !== null ? $embedding : $challenge->vector_embedding,
                'review_status' => 'pending_action',
                'current_milestone' => 'تم رفع مستند جديد - بانتظار مراجعة المشرف',
            ]);
        }

        $challenge->feedbacks()->create([
            'comment' => $aiFeedbackPayload,
        ]);

        $this->challengeHistoryService->record(
            $challenge,
            'student_upload',
            'تم رفع مستند جديد',
            'أرسل الطالب نسخة محدثة للمراجعة.',
            [
                'review_status' => 'pending_action',
                'milestone' => $challenge->current_milestone,
                'progress' => (int) $challenge->progress,
                'file_path' => $challenge->file_path,
            ]
        );

        $this->syncWorkspaceMilestoneSubmission($studentId, $title, $description, $path);

        $this->dispatchEmbeddingJobIfNeeded($challenge->fresh(), $embedding);

        return [
            'ok' => true,
            'message' => 'تم رفع الملف بنجاح وإرساله للمراجعة.',
            'originality' => $originality,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function resolveOriginality(string $title, string $description, string $documentText, ?int $excludeChallengeId): array
    {
        if (config('similarity.defer_embedding', false)) {
            // Fast path for HTTP — same logic as synchronous embed=null fallback; HF work runs in ProcessProjectEmbeddingJob.
            $fallback = $this->aiSimilarityService->compareToExistingByText(
                $title,
                $description,
                $documentText,
                $excludeChallengeId
            );

            return array_merge($fallback, ['_embedding' => null]);
        }

        $composite = $this->aiSimilarityService->buildCompositeText($title, $description, $documentText);
        $embedding = $this->aiSimilarityService->embed($composite);

        if ($embedding === null) {
            $fallback = $this->aiSimilarityService->compareToExistingByText(
                $title,
                $description,
                $documentText,
                $excludeChallengeId
            );

            return array_merge($fallback, ['_embedding' => null]);
        }

        $compared = $this->aiSimilarityService->compareToExisting($embedding, $excludeChallengeId);

        return array_merge($compared, ['_embedding' => $embedding]);
    }

    /**
     * Queue a background pass to re-embed from disk (heavy PDFs, retries).
     *
     * @param  array<int, float>|null  $embedding
     */
    private function dispatchEmbeddingJobIfNeeded(IndustryChallenge $challenge, ?array $embedding): void
    {
        ProcessProjectEmbeddingJob::dispatch($challenge->id)->afterCommit()->afterResponse();
    }

    private function hasExtractableContent(UploadedFile $file, string $documentText, string $description): bool
    {
        if (mb_strlen(trim($documentText)) > 0) {
            return true;
        }

        // Keep strict rejection for genuinely empty uploads, but allow known parser misses
        // when the file is non-trivial and student provided a meaningful description.
        $size = (int) ($file->getSize() ?? 0);
        $ext = strtolower((string) $file->getClientOriginalExtension());
        if ($size === 0) {
            return false;
        }

        return in_array($ext, ['pdf', 'doc', 'docx'], true)
            && $size >= 2048
            && mb_strlen(trim($description)) >= 20;
    }

    /**
     * Bridge legacy student upload flow to milestone review queue used by supervisors.
     */
    private function syncWorkspaceMilestoneSubmission(int $studentId, string $title, string $description, string $filePath): void
    {
        $teamId = TeamMember::query()
            ->where('user_id', $studentId)
            ->value('team_id');
        if (! $teamId) {
            return;
        }

        $projectId = Team::query()
            ->where('id', (int) $teamId)
            ->value('project_id');
        if (! $projectId) {
            return;
        }

        $milestone = Milestone::query()
            ->where('project_id', (int) $projectId)
            ->where('status', '!=', 'approved')
            ->orderBy('sequence')
            ->first();
        if (! $milestone) {
            $milestone = Milestone::query()
                ->where('project_id', (int) $projectId)
                ->orderByDesc('sequence')
                ->first();
        }
        if (! $milestone) {
            return;
        }

        $nextVersion = ((int) Submission::query()
            ->where('milestone_id', (int) $milestone->id)
            ->max('version')) + 1;

        Submission::query()->create([
            'milestone_id' => (int) $milestone->id,
            'submitted_by_user_id' => $studentId,
            'title' => $title,
            'notes' => trim($description) !== '' ? mb_substr(trim($description), 0, 5000) : null,
            'file_path' => $filePath,
            'version' => $nextVersion,
            'status' => 'submitted',
        ]);

        $milestone->update(['status' => 'in_review']);
    }

    /**
     * Mark a revision request as resubmitted by student.
     */
    public function resubmitAfterRevision($user, int $challengeId, ?string $comment): array
    {
        if ($user->role !== 'student') {
            return ['ok' => false, 'message' => 'فقط الطلاب يمكنهم استخدام هذا الإجراء.'];
        }

        $challenge = IndustryChallenge::where('id', $challengeId)
            ->where('posted_by_user_id', $user->id)
            ->firstOrFail();

        if ($challenge->review_status !== 'awaiting_revision') {
            return ['ok' => false, 'message' => 'لا يمكن إعادة الإرسال إلا عندما تكون الحالة بانتظار التعديل.'];
        }

        $challenge->update([
            'review_status' => 'pending_action',
            'current_milestone' => 'تم تعديل الملف من الطالب - بانتظار إعادة المراجعة',
            'progress' => max((int) $challenge->progress, 10),
        ]);

        $studentComment = trim((string) $comment);
        if ($studentComment !== '') {
            $challenge->feedbacks()->create([
                'comment' => "Student Update:\n".$studentComment,
            ]);
        } else {
            $challenge->feedbacks()->create([
                'comment' => 'Student Update: تم تنفيذ التعديلات المطلوبة وإعادة الإرسال للمراجعة.',
            ]);
        }

        $this->challengeHistoryService->record(
            $challenge,
            'student_resubmitted',
            'الطالب أكمل التعديلات',
            $studentComment !== '' ? $studentComment : 'تم تنفيذ التعديلات المطلوبة وإعادة الإرسال للمراجعة.',
            [
                'review_status' => 'pending_action',
                'progress' => (int) $challenge->progress,
            ]
        );

        return ['ok' => true, 'message' => 'تم إرسال التعديلات للمشرف بنجاح.'];
    }
}
