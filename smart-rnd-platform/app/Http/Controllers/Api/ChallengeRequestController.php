<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChallengeRequest;
use App\Models\IndustryChallenge;
use App\Models\Team;
use App\Services\ChallengeWorkflowService;
use Illuminate\Http\Request;

class ChallengeRequestController extends Controller
{
    public function __construct(
        private readonly ChallengeWorkflowService $challengeWorkflowService,
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'industry_challenge_id' => 'required|integer|exists:industry_challenges,id',
        ]);

        $result = $this->challengeWorkflowService->createChallengeRequest(
            $request->user(),
            (int) $validated['industry_challenge_id']
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 422);
        }

        return response()->json(['status' => 'success', 'message' => $result['message'], 'data' => $result['data']], 201);
    }

    public function supervisorPending(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->challengeWorkflowService->supervisorPendingRequests($request->user()),
        ]);
    }

    public function supervisorDecide(Request $request, ChallengeRequest $challengeRequest)
    {
        $validated = $request->validate([
            'decision' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->supervisorDecideRequest(
            $request->user(),
            $challengeRequest,
            (string) $validated['decision'],
            $validated['notes'] ?? null
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json(['status' => 'success', 'message' => $result['message']]);
    }

    public function hodAssign(Request $request)
    {
        $validated = $request->validate([
            'team_id' => 'required|integer|exists:teams,id',
            'industry_challenge_id' => 'required|integer|exists:industry_challenges,id',
        ]);

        $team = Team::findOrFail((int) $validated['team_id']);
        $challenge = IndustryChallenge::findOrFail((int) $validated['industry_challenge_id']);

        $result = $this->challengeWorkflowService->hodAssignChallengeToTeam($request->user(), $team, $challenge);
        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json(['status' => 'success', 'message' => $result['message']]);
    }

    public function industryIndex(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->challengeWorkflowService->industryRequestsForCompany($request->user()),
        ]);
    }

    public function industryDecide(Request $request, ChallengeRequest $challengeRequest)
    {
        $validated = $request->validate([
            'decision' => 'required|in:reject,accept,approve',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->challengeWorkflowService->industryDecide(
            $request->user(),
            $challengeRequest,
            (string) $validated['decision'],
            $validated['notes'] ?? null
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json(['status' => 'success', 'message' => $result['message']]);
    }
}

