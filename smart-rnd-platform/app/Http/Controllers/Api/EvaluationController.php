<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EvaluationController extends Controller
{
    public function index(Submission $submission)
    {
        return response()->json([
            'status' => 'success',
            'data' => $submission->evaluations()->with('evaluator:id,name,email')->latest()->get(),
        ]);
    }

    public function store(Request $request, Submission $submission)
    {
        if (!in_array($request->user()->role, ['admin', 'supervisor'], true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only supervisors/admins can evaluate submissions',
            ], 403);
        }

        $validated = $request->validate([
            'score' => 'nullable|integer|min:0|max:100',
            'feedback' => 'nullable|string',
            'decision' => ['required', Rule::in(['approved', 'rejected', 'needs_revision'])],
        ]);

        $evaluation = $submission->evaluations()->create([
            'evaluator_user_id' => $request->user()->id,
            'score' => $validated['score'] ?? null,
            'feedback' => $validated['feedback'] ?? null,
            'decision' => $validated['decision'],
            'evaluated_at' => now(),
        ]);

        $submission->update([
            'status' => $validated['decision'] === 'needs_revision' ? 'needs_revision' : 'reviewed',
        ]);

        $submission->milestone()->update([
            'status' => $validated['decision'] === 'approved' ? 'approved' : 'rejected',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Evaluation recorded successfully',
            'data' => $evaluation->load('evaluator:id,name,email'),
        ], 201);
    }

    public function update(Request $request, Evaluation $evaluation)
    {
        if ((int) $evaluation->evaluator_user_id !== (int) $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not allowed to update this evaluation',
            ], 403);
        }

        $validated = $request->validate([
            'score' => 'nullable|integer|min:0|max:100',
            'feedback' => 'nullable|string',
            'decision' => ['sometimes', Rule::in(['approved', 'rejected', 'needs_revision'])],
        ]);

        $evaluation->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Evaluation updated successfully',
            'data' => $evaluation->fresh(),
        ]);
    }
}
