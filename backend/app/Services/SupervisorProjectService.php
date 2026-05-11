<?php

namespace App\Services;

use App\Models\Milestone;
use App\Models\Project;
use App\Models\Submission;
use App\Models\SupervisorMilestone;
use App\Models\SupervisorMilestonePlan;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SupervisorProjectService
{
    public function projectsIndexData(User $user): array
    {
        $projectColumns = [
            'id',
            'title',
            'status',
            'industry_challenge_id',
            'current_progress',
            'milestone_plan_id',
        ];
        if (Schema::hasColumn('projects', 'category')) {
            $projectColumns[] = 'category';
        }

        $query = Team::query()
            ->with([
                'leader:id,name,email',
                'supervisor:id,name,email,role',
                'project:'.implode(',', $projectColumns),
                'project.industryChallenge:id,title,deadline',
                'project.industryChallenge.feedbacks' => fn ($q) => $q->latest('id')->select(['id', 'industry_challenge_id', 'comment', 'created_at']),
                'project.milestones' => fn ($q) => $q->orderBy('sequence'),
                'project.milestones.submissions' => fn ($q) => $q->with('submittedBy:id,name,email')->latest(),
            ])
            ->whereNotNull('project_id')
            ->latest();

        if ($user->role === 'supervisor') {
            $query->where('supervisor_id', $user->id);
        }

        $teams = $query->get();

        $plansQuery = SupervisorMilestonePlan::query()
            ->where('is_active', true)
            ->latest('id');
        if ($user->role === 'supervisor') {
            $plansQuery->where('supervisor_id', $user->id);
        }

        return [
            'teams' => $teams,
            'plans' => $plansQuery->get(['id', 'name', 'supervisor_id']),
        ];
    }

    public function assignMilestonePlan(User $actor, Project $project, int $planId): array
    {
        if (! in_array($actor->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $team = Team::where('project_id', $project->id)->first();
        if (! $team) {
            return ['ok' => false, 'message' => 'Project has no team'];
        }
        if ($actor->role === 'supervisor' && (int) $team->supervisor_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $plan = SupervisorMilestonePlan::find($planId);
        if (! $plan || ! $plan->is_active) {
            return ['ok' => false, 'message' => 'Invalid plan'];
        }
        if ($actor->role === 'supervisor' && (int) $plan->supervisor_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        return DB::transaction(function () use ($project, $plan, $actor) {
            $project = Project::lockForUpdate()->findOrFail($project->id);
            $project->update([
                'milestone_plan_id' => $plan->id,
                'status' => $project->status === 'approved' ? 'in_progress' : $project->status,
                'start_date' => $project->start_date ?? now()->toDateString(),
            ]);

            $hasAny = Milestone::where('project_id', $project->id)->exists();
            if ($hasAny) {
                return ['ok' => true, 'message' => 'Plan assigned (milestones already exist)'];
            }

            $templates = SupervisorMilestone::where('plan_id', $plan->id)
                ->orderBy('sort_order')
                ->get();
            if ($templates->isEmpty()) {
                return ['ok' => false, 'message' => 'Plan has no milestones'];
            }

            foreach ($templates as $idx => $tpl) {
                Milestone::create([
                    'project_id' => $project->id,
                    'title' => $tpl->title,
                    'description' => $tpl->submission_title,
                    'weight' => (int) $tpl->increment_percent,
                    'due_date' => $tpl->deadline,
                    'status' => 'pending',
                    'sequence' => $idx + 1,
                ]);
            }

            return ['ok' => true, 'message' => 'Plan assigned and milestones created'];
        });
    }

    public function decideSubmission(User $actor, Submission $submission, string $decision, ?string $notes): array
    {
        if (! in_array($actor->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $milestone = Milestone::with('project')->find((int) $submission->milestone_id);
        if (! $milestone || ! $milestone->project) {
            return ['ok' => false, 'message' => 'Invalid submission'];
        }

        $team = Team::where('project_id', $milestone->project_id)->first();
        if (! $team) {
            return ['ok' => false, 'message' => 'Project has no team'];
        }
        if ($actor->role === 'supervisor' && (int) $team->supervisor_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $nextStatus = match ($decision) {
            'approve' => 'reviewed',
            'revise' => 'needs_revision',
            'reject' => 'needs_revision',
            default => 'submitted',
        };

        return DB::transaction(function () use ($submission, $nextStatus, $actor, $notes) {
            $submission = Submission::lockForUpdate()->findOrFail($submission->id);
            $submission->update([
                'status' => $nextStatus,
                'review_notes' => $notes ? trim((string) $notes) : null,
                'reviewed_by_user_id' => $actor->id,
                'reviewed_at' => now(),
            ]);

            $milestone = Milestone::lockForUpdate()->findOrFail((int) $submission->milestone_id);
            if ($nextStatus === 'reviewed') {
                $milestone->update(['status' => 'approved']);
            } else {
                $milestone->update(['status' => 'rejected']);
            }

            $project = Project::lockForUpdate()->findOrFail((int) $milestone->project_id);
            $total = (int) Milestone::where('project_id', $project->id)->sum('weight');
            $done = (int) Milestone::where('project_id', $project->id)->where('status', 'approved')->sum('weight');
            $percent = $total > 0 ? (int) round(($done / $total) * 100) : 0;
            $project->update(['current_progress' => min(100, max(0, $percent))]);

            return ['ok' => true, 'message' => 'Decision saved'];
        });
    }
}

