<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProposalController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\IndustryChallengeController;
use App\Http\Controllers\Api\ChallengeRequestController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\V2\FacultyReportsApiController;
use App\Http\Controllers\Api\V2\SupervisorGanttApiController;
use App\Models\IndustryChallenge;

// ==========================================
// مسارات عامة (لا تحتاج تسجيل دخول / Token)
// ==========================================

// رابط تسجيل حساب جديد
Route::post('/register', [AuthController::class, 'register']);

// رابط تسجيل الدخول
Route::post('/login', [AuthController::class, 'login']);

// جلب تحديات الصناعة بشكل JSON
Route::get('/challenges', function () {
    return response()->json([
        'status' => 'success',
        'data' => IndustryChallenge::with('postedBy:id,name')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNotNull('published_to_students_at')
            ->latest()
            ->get(),
    ]);
});


// ==========================================
// مسارات محمية (يجب أن يكون المستخدم مسجل دخول)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // رابط لمعرفة من هو المستخدم الذي قام بتسجيل الدخول حالياً
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // تسجيل خروج وإبطال التوكن الحالي
    Route::post('/logout', [AuthController::class, 'logout']);

    // Project workflow
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::patch('/projects/{project}', [ProjectController::class, 'update']);

    // Groups (Teams)
    Route::get('/groups', [GroupController::class, 'index'])
        ->middleware('role:supervisor,hod,admin');
    Route::get('/hod/supervisors', [GroupController::class, 'supervisors'])
        ->middleware('role:hod,admin');
    Route::patch('/hod/groups/{team}/assign-supervisor', [GroupController::class, 'assignSupervisor'])
        ->middleware('role:hod,admin');

    // Industry challenges & workflow
    Route::get('/industry-challenges/approved', [IndustryChallengeController::class, 'indexApproved']);
    Route::post('/industry-challenges', [IndustryChallengeController::class, 'store'])
        ->middleware('role:industry,admin');
    Route::patch('/industry-challenges/{industryChallenge}/hod-review', [IndustryChallengeController::class, 'hodReview'])
        ->middleware('role:hod,admin');
    Route::patch('/industry-challenges/{industryChallenge}/publish-for-students', [IndustryChallengeController::class, 'hodPublishForStudents'])
        ->middleware('role:hod,admin');

    // Challenge requests
    Route::post('/challenge-requests', [ChallengeRequestController::class, 'store'])
        ->middleware('role:student');
    Route::get('/supervisor/challenge-requests/pending', [ChallengeRequestController::class, 'supervisorPending'])
        ->middleware('role:supervisor,admin');
    Route::patch('/supervisor/challenge-requests/{challengeRequest}', [ChallengeRequestController::class, 'supervisorDecide'])
        ->middleware('role:supervisor,admin');
    Route::post('/hod/challenge-assign', [ChallengeRequestController::class, 'hodAssign'])
        ->middleware('role:hod,admin');
    Route::get('/industry/challenge-requests', [ChallengeRequestController::class, 'industryIndex'])
        ->middleware('role:industry,admin');
    Route::patch('/industry/challenge-requests/{challengeRequest}', [ChallengeRequestController::class, 'industryDecide'])
        ->middleware('role:industry,admin');

    // Proposal workflow
    Route::get('/proposals', [ProposalController::class, 'index']);
    Route::get('/proposals/{proposal}', [ProposalController::class, 'show']);
    Route::post('/proposals', [ProposalController::class, 'store'])
        ->middleware('role:student');
    Route::post('/proposals/{proposal}/review', [ProposalController::class, 'review'])
        ->middleware('role:supervisor,industry,admin');

    Route::get('/projects/{project}/milestones', [MilestoneController::class, 'index']);
    Route::post('/projects/{project}/milestones', [MilestoneController::class, 'store'])
        ->middleware('role:supervisor,admin');
    Route::patch('/projects/{project}/milestones/{milestone}', [MilestoneController::class, 'update'])
        ->middleware('role:supervisor,admin');

    Route::get('/milestones/{milestone}/submissions', [SubmissionController::class, 'index']);
    Route::post('/milestones/{milestone}/submissions', [SubmissionController::class, 'store'])
        ->middleware('role:student');
    Route::patch('/submissions/{submission}', [SubmissionController::class, 'update']);

    Route::get('/submissions/{submission}/evaluations', [EvaluationController::class, 'index']);
    Route::post('/submissions/{submission}/evaluations', [EvaluationController::class, 'store'])
        ->middleware('role:supervisor,admin');
    Route::patch('/evaluations/{evaluation}', [EvaluationController::class, 'update']);

    /* Pluggable module endpoints — versioned to avoid collisions with legacy API paths */
    Route::prefix('v2')->group(function () {
        Route::get('/reports/filters', [FacultyReportsApiController::class, 'filters'])
            ->middleware('sanctum.ability:reports:read;reports:export');
        Route::get('/reports/preview', [FacultyReportsApiController::class, 'preview'])
            ->middleware('sanctum.ability:reports:read;reports:export');
        Route::post('/reports/export', [FacultyReportsApiController::class, 'export'])
            ->middleware('sanctum.ability:reports:export');

        Route::get('/supervisor/gantt', [SupervisorGanttApiController::class, 'show'])
            ->middleware('sanctum.ability:gantt:read');
    });
});