<?php

namespace App\Repositories;

use App\Models\Team;
use App\Models\User;
use App\Repositories\Contracts\SupervisorTimelineRepositoryInterface;
use Carbon\Carbon;

class SupervisorTimelineRepository implements SupervisorTimelineRepositoryInterface
{
    public function ganttPayloadFor(User $actor): array
    {
        if (! in_array($actor->role, ['supervisor', 'admin'], true)) {
            return ['projects' => [], 'tasks' => []];
        }

        $query = Team::query()
            ->with(['project' => fn ($q) => $q->with(['milestones' => fn ($m) => $m->orderBy('sequence')])]);

        if ($actor->role === 'supervisor') {
            $query->where('supervisor_id', $actor->id);
        }

        $teams = $query->whereNotNull('project_id')->get();

        $projects = [];
        $tasks = [];

        foreach ($teams as $team) {
            $project = $team->project;
            if (! $project) {
                continue;
            }

            $projects[] = [
                'id' => (int) $project->id,
                'title' => (string) $project->title,
                'team_name' => (string) $team->name,
            ];

            $projectStart = $project->start_date
                ? Carbon::parse($project->start_date)->startOfDay()
                : ($project->created_at ? Carbon::parse($project->created_at)->startOfDay() : now()->startOfDay());

            foreach ($project->milestones as $milestone) {
                $due = $milestone->due_date
                    ? Carbon::parse($milestone->due_date)->endOfDay()
                    : $projectStart->copy()->addWeeks(3);

                $start = $due->copy()->subWeeks(2);
                if ($start->lt($projectStart)) {
                    $start = $projectStart->copy();
                }

                $tasks[] = [
                    'id' => 'milestone-'.((int) $milestone->id),
                    'project_id' => (int) $project->id,
                    'project_title' => (string) $project->title,
                    'team_name' => (string) $team->name,
                    'title' => (string) $milestone->title,
                    'start' => $start->toIso8601String(),
                    'end' => $due->toIso8601String(),
                    'progress' => $this->milestoneProgress($milestone->status ?? ''),
                    'status' => (string) ($milestone->status ?? ''),
                ];
            }
        }

        return ['projects' => $projects, 'tasks' => $tasks];
    }

    private function milestoneProgress(string $status): int
    {
        return match ($status) {
            'approved' => 100,
            'in_review' => 60,
            'rejected' => 25,
            default => 20,
        };
    }
}
