<?php

namespace Tests\Feature;

use App\Models\IndustryChallenge;
use App\Models\User;
use App\Services\ChallengeWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyChallengeStudentVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_challenges_require_publication_timestamp_for_student_listing(): void
    {
        $industry = User::factory()->create(['role' => 'industry']);

        $approvedNotPublished = IndustryChallenge::create([
            'title' => 'Accepted but hidden',
            'description' => 'Awaiting HoD publish',
            'posted_by_user_id' => $industry->id,
            'kind' => 'company_challenge',
            'posted_date' => now(),
            'review_status' => 'approved',
            'current_milestone' => ChallengeWorkflowService::COMPANY_CHALLENGE_APPROVED_AWAITING_PUBLISH_MILESTONE,
            'progress' => 0,
            'published_to_students_at' => null,
        ]);

        $hodApproved = IndustryChallenge::create([
            'title' => 'Visible to students',
            'description' => 'Published',
            'posted_by_user_id' => $industry->id,
            'kind' => 'company_challenge',
            'posted_date' => now(),
            'review_status' => 'approved',
            'current_milestone' => ChallengeWorkflowService::COMPANY_CHALLENGE_VISIBLE_TO_STUDENTS_MILESTONE,
            'progress' => 0,
            'published_to_students_at' => now()->subMinute(),
        ]);

        /** @var ChallengeWorkflowService $svc */
        $svc = app(ChallengeWorkflowService::class);
        $visibleIds = $svc->queryCompanyChallengesApproved()->pluck('id')->all();

        $this->assertNotContains($approvedNotPublished->id, $visibleIds);
        $this->assertContains($hodApproved->id, $visibleIds);
    }

    public function test_legacy_wrong_milestone_without_publication_timestamp_is_hidden(): void
    {
        $industry = User::factory()->create(['role' => 'industry']);

        $bypass = IndustryChallenge::create([
            'title' => 'Bypass attempt',
            'description' => 'Wrong path',
            'posted_by_user_id' => $industry->id,
            'kind' => 'company_challenge',
            'posted_date' => now(),
            'review_status' => 'approved',
            'current_milestone' => 'مقبول من المشرف - فكرة (10%)',
            'progress' => 10,
            'published_to_students_at' => null,
        ]);

        /** @var ChallengeWorkflowService $svc */
        $svc = app(ChallengeWorkflowService::class);
        $visibleIds = $svc->queryCompanyChallengesApproved()->pluck('id')->all();

        $this->assertNotContains($bypass->id, $visibleIds);
    }
}
