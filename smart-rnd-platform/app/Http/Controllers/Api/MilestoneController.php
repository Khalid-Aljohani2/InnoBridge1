<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MilestoneController extends Controller
{
    public function index(Project $project)
    {
        $milestones = $project->milestones()->orderBy('sequence')->get();

        return response()->json([
            'status' => 'success',
            'data' => $milestones,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'nullable|integer|min:0|max:100',
            'due_date' => 'nullable|date',
            'status' => ['nullable', Rule::in(['pending', 'in_review', 'approved', 'rejected'])],
            'sequence' => 'nullable|integer|min:1',
        ]);

        $milestone = $project->milestones()->create([
            ...$validated,
            'weight' => $validated['weight'] ?? 0,
            'status' => $validated['status'] ?? 'pending',
            'sequence' => $validated['sequence'] ?? (($project->milestones()->max('sequence') ?? 0) + 1),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Milestone created successfully',
            'data' => $milestone,
        ], 201);
    }

    public function update(Request $request, Project $project, Milestone $milestone)
    {
        if ((int) $milestone->project_id !== (int) $project->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Milestone does not belong to this project',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'weight' => 'sometimes|integer|min:0|max:100',
            'due_date' => 'nullable|date',
            'status' => ['sometimes', Rule::in(['pending', 'in_review', 'approved', 'rejected'])],
            'sequence' => 'sometimes|integer|min:1',
        ]);

        $milestone->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Milestone updated successfully',
            'data' => $milestone->fresh(),
        ]);
    }
}
