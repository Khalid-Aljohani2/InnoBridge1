<?php

namespace App\Http\Controllers\Modules\Faculty;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\SupervisorTimelineRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupervisorProjectTimelineWebController extends Controller
{
    public function index(Request $request, SupervisorTimelineRepositoryInterface $timeline): Response
    {
        return Inertia::render('Modules/Supervisor/ProjectTimeline', [
            'gantt' => $timeline->ganttPayloadFor($request->user()),
        ]);
    }
}
