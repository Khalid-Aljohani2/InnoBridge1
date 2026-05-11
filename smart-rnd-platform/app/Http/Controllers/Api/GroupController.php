<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\GroupManagementService;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function __construct(
        private readonly GroupManagementService $groupManagementService,
    ) {}

    public function index(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->groupManagementService->teamsForUser($request->user()),
        ]);
    }

    public function supervisors(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->groupManagementService->supervisorsForHoD($request->user()),
        ]);
    }

    public function assignSupervisor(Request $request, Team $team)
    {
        $validated = $request->validate([
            'supervisor_id' => 'required|integer|exists:users,id',
        ]);

        $result = $this->groupManagementService->assignTeamToSupervisor($request->user(), $team, (int) $validated['supervisor_id']);
        if (! ($result['ok'] ?? false)) {
            return response()->json(['status' => 'error', 'message' => $result['message'] ?? 'Error'], 403);
        }

        return response()->json(['status' => 'success', 'message' => $result['message']]);
    }
}

