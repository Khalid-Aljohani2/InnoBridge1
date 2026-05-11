<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class IndustryChallengeController extends Controller
{
    public function __construct(
        private readonly ChallengeWorkflowService $challengeWorkflowService,
    ) {}

    public function indexApproved()
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->challengeWorkflowService->queryCompanyChallengesApproved()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'deadline' => 'nullable|date',
        ]);

        $result = $this->challengeWorkflowService->createCompanyChallenge($request->user(), $validated);

        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'data' => $result['data'] ?? null,
        ], 201);
    }

    public function hodReview(Request $request, IndustryChallenge $industryChallenge)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->hodReviewCompanyChallenge(
            $request->user(),
            $industryChallenge,
            (string) $validated['decision'],
            $validated['notes'] ?? null
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json(['status' => 'success', 'message' => $result['message']]);
    }

    public function hodPublishForStudents(Request $request, IndustryChallenge $industryChallenge)
    {
        $result = $this->challengeWorkflowService->hodPublishCompanyChallengeToStudents(
            $request->user(),
            $industryChallenge
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json(['status' => 'success', 'message' => $result['message']]);
    }
}

