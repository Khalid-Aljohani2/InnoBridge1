<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Project::query()
            ->with(['owner:id,name,email', 'industryChallenge:id,title', 'team:id,project_id,name'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')));

        $this->scopeProjectsVisibleToUser($query, $user);

        $projects = $query->latest()->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $projects,
        ]);
    }

    /** @param \Illuminate\Database\Eloquent\Builder<\App\Models\Project> $query */
    private function scopeProjectsVisibleToUser($query, User $user): void
    {
        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'hod') {
            if (empty($user->department)) {
                $query->whereRaw('1 = 0');
                return;
            }
            $query->whereHas('team', fn ($q) => $q->where('department', $user->department));
            return;
        }

        if ($user->role === 'supervisor') {
            $query->whereHas('team', fn ($q) => $q->where('supervisor_id', $user->id));
            return;
        }

        if ($user->role === 'student') {
            $query->where(function ($q) use ($user) {
                $q->where('owner_user_id', $user->id)
                    ->orWhereHas('team', function ($tq) use ($user) {
                        $tq->where('leader_id', $user->id)
                            ->orWhereHas('members', fn ($mq) => $mq->where('user_id', $user->id));
                    });
            });
            return;
        }

        if ($user->role === 'industry') {
            $query->whereHas('industryChallenge', fn ($q) => $q->where('posted_by_user_id', $user->id));
            return;
        }

        $query->whereRaw('1 = 0');
    }

    private function userMayAccessProject(User $user, Project $project): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        $project->loadMissing(['team.members']);

        if ($user->role === 'hod') {
            if (empty($user->department)) {
                return false;
            }
            if (! $project->team) {
                return false;
            }
            return (string) $project->team->department === (string) $user->department;
        }

        if ($user->role === 'supervisor') {
            if (! $project->team) {
                return false;
            }
            return (int) $project->team->supervisor_id === (int) $user->id;
        }

        if ($user->role === 'student') {
            if ((int) $project->owner_user_id === (int) $user->id) {
                return true;
            }
            if ($project->team) {
                if ((int) $project->team->leader_id === (int) $user->id) {
                    return true;
                }
                return $project->team->members->contains('user_id', $user->id);
            }
            return false;
        }

        if ($user->role === 'industry') {
            $project->loadMissing('industryChallenge');

            return $project->industryChallenge
                && (int) $project->industryChallenge->posted_by_user_id === (int) $user->id;
        }

        return false;
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (! in_array($user->role, ['admin', 'student'], true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only students can create projects via this endpoint',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'abstract' => 'nullable|string',
            'type' => ['required', Rule::in(['student_initiated', 'industry_sponsored'])],
            'industry_challenge_id' => 'nullable|exists:industry_challenges,id',
            'status' => ['nullable', Rule::in(['draft', 'submitted'])],
            'start_date' => 'nullable|date',
            'target_end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Students cannot jump workflow to advanced statuses through mass assignment.
        $status = $validated['status'] ?? 'draft';
        if ($user->role === 'student' && ! in_array($status, ['draft', 'submitted'], true)) {
            $status = 'draft';
        }

        $project = Project::create([
            ...$validated,
            'owner_user_id' => $request->user()->id,
            'status' => $status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Project created successfully',
            'data' => $project->load(['owner:id,name,email']),
        ], 201);
    }

    public function show(Request $request, Project $project)
    {
        if (! $this->userMayAccessProject($request->user(), $project)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $project->load([
                'owner:id,name,email',
                'industryChallenge:id,title,description',
                'team.members.user:id,name,email',
                'milestones:id,project_id,title,status,sequence,due_date,weight',
            ]),
        ]);
    }

    public function update(Request $request, Project $project)
    {
        $user = $request->user();
        $project->loadMissing('team');
        if (! $this->userMayAccessProject($user, $project)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden',
            ], 403);
        }

        $isOwner = (int) $project->owner_user_id === (int) $user->id;
        $isAdmin = $user->role === 'admin';
        $isSupervisor = $user->role === 'supervisor' && $project->team && (int) $project->team->supervisor_id === (int) $user->id;

        if (! $isAdmin && ! $isOwner && ! $isSupervisor) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not allowed to update this project',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'abstract' => 'nullable|string',
            'status' => ['sometimes', Rule::in(['draft', 'submitted', 'approved', 'in_progress', 'completed', 'archived'])],
            'current_progress' => 'sometimes|integer|min:0|max:100',
            'start_date' => 'nullable|date',
            'target_end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($user->role === 'student' && isset($validated['status'])) {
            if (! in_array($validated['status'], ['draft', 'submitted'], true)) {
                unset($validated['status']);
            }
        }

        $project->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Project updated successfully',
            'data' => $project->fresh(),
        ]);
    }
}
