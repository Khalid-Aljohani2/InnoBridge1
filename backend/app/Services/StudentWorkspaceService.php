<?php

namespace App\Services;

use App\Models\Milestone;
use App\Models\Submission;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;

class StudentWorkspaceService
{
    public function workspaceData(User $student): array
    {
        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        $team = $teamId
            ? Team::with([
                'leader:id,name,email',
                'supervisor:id,name,email,role',
                'members.user:id,name,email,role',
                'project:id,title,status,industry_challenge_id,current_progress,milestone_plan_id',
                'project.industryChallenge:id,title,deadline,posted_by_user_id',
                'project.industryChallenge.postedBy:id,name',
            ])->find((int) $teamId)
            : null;

        $projectId = (int) ($team?->project_id ?? 0);
        $milestones = $projectId
            ? Milestone::with(['submissions' => fn ($q) => $q->with('submittedBy:id,name,email')->latest()])
                ->where('project_id', $projectId)
                ->orderBy('sequence')
                ->get()
            : collect();

        return [
            'team' => $team,
            'milestones' => $milestones,
        ];
    }

    public function uploadSubmission(User $student, Milestone $milestone, array $validated): array
    {
        if ($student->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if (! $this->studentCanAccessMilestone($student, $milestone)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $path = $validated['file']->store('submissions', 'public');
        $version = ((int) $milestone->submissions()->max('version')) + 1;

        $milestone->submissions()->create([
            'submitted_by_user_id' => $student->id,
            'title' => trim((string) $validated['title']),
            'notes' => isset($validated['notes']) ? trim((string) $validated['notes']) : null,
            'file_path' => $path,
            'version' => $version,
            'status' => 'submitted',
        ]);

        $milestone->update(['status' => 'in_review']);

        return ['ok' => true, 'message' => 'Uploaded for review'];
    }

    public function updateSubmission(User $student, Submission $submission, array $validated): array
    {
        if ($student->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ((int) $submission->submitted_by_user_id !== (int) $student->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $payload = [];
        if (isset($validated['title'])) {
            $payload['title'] = trim((string) $validated['title']);
        }
        if (array_key_exists('notes', $validated)) {
            $payload['notes'] = $validated['notes'] !== null ? trim((string) $validated['notes']) : null;
        }

        if ($payload) {
            $submission->update($payload);
        }

        return ['ok' => true, 'message' => 'Updated'];
    }

    private function studentCanAccessMilestone(User $student, Milestone $milestone): bool
    {
        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');
        if (! $teamId) {
            return false;
        }

        $team = Team::find((int) $teamId);
        if (! $team || ! $team->project_id) {
            return false;
        }

        return (int) $milestone->project_id === (int) $team->project_id;
    }
}

