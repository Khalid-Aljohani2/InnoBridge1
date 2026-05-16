<?php

namespace App\Services;
 
use App\Models\IndustryChallenge;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
 
class ChallengeReviewService
{
    public function __construct(
        private readonly ChallengeHistoryService $challengeHistoryService,
    ) {}
 
    /**
     * Apply supervisor decision and persist challenge state/history atomically in workflow terms.
     */
    public function applySupervisorDecision(
        IndustryChallenge $challenge,
        string $decision,
        array $selectedMilestone,
        ?string $comment
    ): string {
        if (($challenge->kind ?? null) === 'company_challenge') {
            throw new \InvalidArgumentException(
                'Company/industry challenges must be approved by HoD and are not modified via supervisor idea review.'
            );
        }
 
        if ($decision === 'approve') {
            $challenge->update([
                'progress' => $selectedMilestone['progress'],
                'current_milestone' => "مقبول من المشرف - {$selectedMilestone['label']} ({$selectedMilestone['progress']}%)",
                'review_status' => 'approved',
            ]);
 
            // Sync with the actual team project to ensure it shows up in Workspace
            $studentId = $challenge->posted_by_user_id;
            $teamMember = TeamMember::where('user_id', $studentId)->first();
            if ($teamMember) {
                $team = Team::find($teamMember->team_id);
                if ($team && $team->project_id) {
                    $project = Project::find($team->project_id);
                    if ($project) {
                        $project->update([
                            'title' => $challenge->title,
                            'abstract' => $challenge->description,
                            'status' => 'approved',
                            'industry_challenge_id' => $challenge->id,
                        ]);
                    }
                }
            }
 
            $this->challengeHistoryService->record(
                $challenge,
                'supervisor_approved',
                'تم القبول من المشرف',
                $comment ?: null,
                [
                    'review_status' => 'approved',
                    'milestone' => $selectedMilestone['label'],
                    'progress' => (int) $selectedMilestone['progress'],
                ]
            );
        } elseif ($decision === 'reject') {
            $challenge->update([
                'progress' => 0,
                'current_milestone' => 'مرفوض من المشرف',
                'review_status' => 'rejected',
            ]);
            $this->challengeHistoryService->record(
                $challenge,
                'supervisor_rejected',
                'تم الرفض من المشرف',
                $comment ?: null,
                [
                    'review_status' => 'rejected',
                    'progress' => 0,
                ]
            );
        } else {
            $challenge->update([
                'progress' => max((int) $challenge->progress, 10),
                'current_milestone' => 'مطلوب تعديل قبل الموافقة',
                'review_status' => 'awaiting_revision',
            ]);
            $this->challengeHistoryService->record(
                $challenge,
                'supervisor_requested_revision',
                'تم طلب تعديل',
                $comment ?: null,
                [
                    'review_status' => 'awaiting_revision',
                    'progress' => (int) $challenge->progress,
                ]
            );
        }

        if ($comment) {
            $challenge->feedbacks()->create([
                'comment' => "Supervisor Feedback:\n".$comment,
            ]);
        }

        return match ($decision) {
            'approve' => 'تم قبول الطلب بنجاح.',
            'reject' => 'تم رفض الطلب بنجاح.',
            default => 'تم طلب التعديل بنجاح.',
        };
    }
}
