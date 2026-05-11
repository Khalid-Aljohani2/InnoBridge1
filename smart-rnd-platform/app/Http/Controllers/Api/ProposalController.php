<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Proposal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProposalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $proposals = Proposal::with([
            'challenge:id,title,posted_by_user_id',
            'student:id,name,email',
            'reviewer:id,name,email',
            'generatedProject:id,title,status',
        ])
            ->when($user->role === 'student', fn ($q) => $q->where('student_user_id', $user->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $proposals,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'student') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only students can submit proposals',
            ], 403);
        }

        $validated = $request->validate([
            'industry_challenge_id' => 'required|exists:industry_challenges,id',
            'title' => 'required|string|max:255',
            'summary' => 'required|string',
            'tech_stack' => 'nullable|string',
            'proposed_timeline' => 'nullable|string|max:255',
        ]);

        $exists = Proposal::where('industry_challenge_id', $validated['industry_challenge_id'])
            ->where('student_user_id', $request->user()->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => 'error',
                'message' => 'You already submitted a proposal for this challenge',
            ], 422);
        }

        $proposal = Proposal::create([
            ...$validated,
            'student_user_id' => $request->user()->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Proposal submitted successfully',
            'data' => $proposal->load(['challenge:id,title', 'student:id,name,email']),
        ], 201);
    }

    public function show(Proposal $proposal)
    {
        return response()->json([
            'status' => 'success',
            'data' => $proposal->load([
                'challenge:id,title,description',
                'student:id,name,email',
                'reviewer:id,name,email',
                'generatedProject:id,title,status',
            ]),
        ]);
    }

    public function review(Request $request, Proposal $proposal)
    {
        if (!in_array($request->user()->role, ['admin', 'supervisor', 'industry'], true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admin/supervisor/industry can review proposals',
            ], 403);
        }

        if ($proposal->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Proposal is already reviewed',
            ], 422);
        }

        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'review_note' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $proposal, $validated) {
            $project = null;

            if ($validated['decision'] === 'approved') {
                $project = Project::create([
                    'title' => $proposal->title,
                    'abstract' => $proposal->summary,
                    'type' => 'industry_sponsored',
                    'industry_challenge_id' => $proposal->industry_challenge_id,
                    'owner_user_id' => $proposal->student_user_id,
                    'status' => 'approved',
                    'current_progress' => 0,
                ]);
            }

            $proposal->update([
                'status' => $validated['decision'],
                'review_note' => $validated['review_note'] ?? null,
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at' => now(),
                'generated_project_id' => $project?->id,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => $validated['decision'] === 'approved'
                    ? 'Proposal approved and project created'
                    : 'Proposal rejected',
                'data' => $proposal->fresh()->load(['generatedProject:id,title,status', 'reviewer:id,name']),
            ]);
        });
    }
}
