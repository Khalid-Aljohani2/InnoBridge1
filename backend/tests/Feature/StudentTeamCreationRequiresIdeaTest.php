<?php

namespace Tests\Feature;

use App\Models\IndustryChallenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTeamCreationRequiresIdeaTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cannot_create_team_without_student_idea(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)
            ->post(route('student.team.create'), ['name' => 'My Team'])
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseMissing('teams', ['name' => 'My Team']);
    }

    public function test_student_can_create_team_after_student_idea_exists(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        IndustryChallenge::create([
            'title' => 'Uploaded idea',
            'description' => 'Description',
            'posted_by_user_id' => $student->id,
            'kind' => 'student_idea',
            'posted_date' => now(),
            'progress' => 0,
            'current_milestone' => 'الفكرة مرفوعة - بانتظار قرار المشرف',
            'review_status' => 'pending_action',
        ]);

        $this->actingAs($student)
            ->post(route('student.team.create'), ['name' => 'My Team'])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('teams', ['name' => 'My Team']);
    }
}
