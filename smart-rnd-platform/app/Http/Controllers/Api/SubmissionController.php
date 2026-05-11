<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Submission;
use App\Models\User;
use App\Support\SubmissionUploadMessages;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubmissionController extends Controller
{
    private function userMayAccessMilestone(User $user, Milestone $milestone): bool
    {
        $milestone->loadMissing('project.team.members', 'project.industryChallenge');

        $project = $milestone->project;
        if (! $project) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'hod') {
            if (empty($user->department)) {
                return false;
            }
            $team = $project->team;

            return $team && (string) $team->department === (string) $user->department;
        }

        if ($user->role === 'supervisor') {
            $team = $project->team;

            return $team && (int) $team->supervisor_id === (int) $user->id;
        }

        if ($user->role === 'student') {
            if ((int) $project->owner_user_id === (int) $user->id) {
                return true;
            }
            $team = $project->team;
            if (! $team) {
                return false;
            }
            if ((int) $team->leader_id === (int) $user->id) {
                return true;
            }

            return $team->members->contains('user_id', $user->id);
        }

        if ($user->role === 'industry') {
            return $project->industryChallenge
                && (int) $project->industryChallenge->posted_by_user_id === (int) $user->id;
        }

        return false;
    }

    /** Students (team members or owner) may create submissions; admins may assist. */
    private function userMayCreateSubmission(User $user, Milestone $milestone): bool
    {
        if (! $this->userMayAccessMilestone($user, $milestone)) {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role !== 'student') {
            return false;
        }

        $milestone->loadMissing('project.team.members');
        $project = $milestone->project;

        if ((int) $project->owner_user_id === (int) $user->id) {
            return true;
        }

        $team = $project->team;
        if (! $team) {
            return false;
        }
        if ((int) $team->leader_id === (int) $user->id) {
            return true;
        }

        return $team->members->contains('user_id', $user->id);
    }

    public function index(Request $request, Milestone $milestone)
    {
        if (! $this->userMayAccessMilestone($request->user(), $milestone)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $milestone->submissions()->with('submittedBy:id,name,email')->latest()->get(),
        ]);
    }

    public function store(Request $request, Milestone $milestone)
    {
        if (! $this->userMayCreateSubmission($request->user(), $milestone)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden',
            ], 403);
        }

        $validated = $request->validate(
            [
                'title' => 'required|string|max:255',
                'notes' => 'nullable|string|max:5000',
                'file' => 'required|file|mimes:pdf,doc,docx,zip|max:20480',
                'status' => ['nullable', Rule::in(['submitted', 'reviewed', 'needs_revision'])],
            ],
            SubmissionUploadMessages::forUser($request->user())
        );

        // Students cannot mark work as reviewed or manipulate workflow via status.
        $status = $validated['status'] ?? 'submitted';
        if ($request->user()->role === 'student') {
            $status = 'submitted';
        }

        $path = $request->file('file')->store('submissions', 'public');
        $version = ((int) $milestone->submissions()->max('version')) + 1;

        $submission = $milestone->submissions()->create([
            'submitted_by_user_id' => $request->user()->id,
            'title' => $validated['title'],
            'notes' => $validated['notes'] ?? null,
            'file_path' => $path,
            'version' => $version,
            'status' => $status,
        ]);

        $milestone->update(['status' => 'in_review']);

        return response()->json([
            'status' => 'success',
            'message' => 'Submission uploaded successfully',
            'data' => $submission->load('submittedBy:id,name,email'),
        ], 201);
    }

    public function update(Request $request, Submission $submission)
    {
        $user = $request->user();
        $submission->loadMissing('milestone.project.team.members');

        if (! $this->userMayAccessMilestone($user, $submission->milestone)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden',
            ], 403);
        }

        $team = $submission->milestone?->project?->team;

        $isOwner = (int) $submission->submitted_by_user_id === (int) $user->id;
        $isAdmin = $user->role === 'admin';
        $isSupervisor = $user->role === 'supervisor' && $team && (int) $team->supervisor_id === (int) $user->id;

        if (! $isOwner && ! $isAdmin && ! $isSupervisor) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not allowed to update this submission',
            ], 403);
        }

        $rules = [
            'title' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'status' => ['sometimes', Rule::in(['submitted', 'reviewed', 'needs_revision'])],
        ];

        if ($isOwner && $user->role === 'student') {
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'notes' => 'nullable|string',
            ]);
        } else {
            $validated = $request->validate($rules);
        }

        $submission->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Submission updated successfully',
            'data' => $submission->fresh(),
        ]);
    }
}
