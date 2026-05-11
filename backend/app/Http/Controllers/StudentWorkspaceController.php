<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use App\Models\Submission;
use App\Services\StudentWorkspaceService;
use App\Support\SubmissionUploadMessages;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentWorkspaceController extends Controller
{
    public function __construct(
        private readonly StudentWorkspaceService $studentWorkspaceService,
    ) {}

    public function show(Request $request)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return redirect()->route('dashboard')->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        return Inertia::render('Student/Workspace', $this->studentWorkspaceService->workspaceData($user));
    }

    public function upload(Request $request, Milestone $milestone)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate(
            [
                'title' => 'required|string|max:255',
                'notes' => 'nullable|string|max:5000',
                'file' => 'required|file|mimes:pdf,doc,docx,zip|max:20480',
            ],
            SubmissionUploadMessages::forUser($user)
        );

        $result = $this->studentWorkspaceService->uploadSubmission($user, $milestone, $validated);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }

    public function updateSubmission(Request $request, Submission $submission)
    {
        $user = $request->user();
        if ($user?->role !== 'student') {
            return back()->with('error', 'Forbidden');
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string|max:5000',
        ]);

        $result = $this->studentWorkspaceService->updateSubmission($user, $submission, $validated);
        return back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'Error'));
    }
}

