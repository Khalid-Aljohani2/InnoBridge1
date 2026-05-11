<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Submission;
use App\Services\SupervisorProjectService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupervisorProjectController extends Controller
{
    public function __construct(
        private readonly SupervisorProjectService $supervisorProjectService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['supervisor', 'admin'], true)) {
            return redirect()->route('dashboard')->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        return Inertia::render('Supervisor/Projects', $this->supervisorProjectService->projectsIndexData($user));
    }

    public function setPlan(Request $request, Project $project)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['supervisor', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            'milestone_plan_id' => 'required|integer|exists:supervisor_milestone_plans,id',
        ]);

        $result = $this->supervisorProjectService->assignMilestonePlan($user, $project, (int) $validated['milestone_plan_id']);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function decideSubmission(Request $request, Submission $submission)
    {
        $user = $request->user();
        if (! in_array($user?->role, ['supervisor', 'admin'], true)) {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            'decision' => 'required|in:approve,revise,reject',
            'notes' => 'nullable|string|max:2000',
        ]);

        $result = $this->supervisorProjectService->decideSubmission($user, $submission, (string) $validated['decision'], $validated['notes'] ?? null);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }
}

