<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\SupervisorTimelineRepositoryInterface;
use Illuminate\Http\Request;

class SupervisorGanttApiController extends Controller
{
    public function show(Request $request, SupervisorTimelineRepositoryInterface $timeline)
    {
        return response()->json([
            'status' => 'success',
            'data' => $timeline->ganttPayloadFor($request->user()),
        ]);
    }
}
