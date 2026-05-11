<?php

namespace App\Http\Controllers;

use App\Models\IndustryChallenge;
use App\Models\SupervisorMilestone;
use App\Models\SupervisorMilestonePlan;
use App\Services\ChallengeHistoryService;
use App\Services\ChallengeQueryService;
use App\Services\ChallengeReviewService;
use App\Services\GroupManagementService;
use App\Services\MilestonePlanService;
use App\Services\StudentChallengeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChallengeController extends Controller
{
    public function __construct(
        private readonly ChallengeHistoryService $challengeHistoryService,
        private readonly MilestonePlanService $milestonePlanService,
        private readonly ChallengeReviewService $challengeReviewService,
        private readonly ChallengeQueryService $challengeQueryService,
        private readonly StudentChallengeService $studentChallengeService,
        private readonly GroupManagementService $groupManagementService,
    ) {}

    private function respondFromServiceResult(array $result)
    {
        $redirect = back()->with(($result['ok'] ?? false) ? 'success' : 'error', (string) ($result['message'] ?? 'حدث خطأ غير متوقع.'));

        if (($result['ok'] ?? false) && isset($result['originality']) && is_array($result['originality'])) {
            $redirect->with('originality', $result['originality']);
        }

        return $redirect;
    }

    private function canUseSupervisorTools($user): bool
    {
        return in_array(($user->role ?? null), ['supervisor', 'admin'], true);
    }

    public function index()
    {
        $user = auth()->user();

        if (($user->role ?? null) === 'admin') {
            return redirect()->route('admin.overview');
        }

        if (($user->role ?? null) === 'hod') {
            if (function_exists('set_time_limit')) {
                set_time_limit(180);
            }

            return Inertia::render('Supervisor/HoDashboard', [
                'preview' => $this->groupManagementService->hodDashboardSummary($user),
            ]);
        }

        if ($this->canUseSupervisorTools($user)) {
            return Inertia::render('Supervisor/Home', $this->challengeQueryService->supervisorHomeData($user));
        }

        if (($user->role ?? null) === 'industry') {
            return Inertia::render('Dashboard', $this->challengeQueryService->industryDashboardData($user));
        }

        return Inertia::render('Dashboard', $this->challengeQueryService->studentDashboardData($user));
    }

    public function supervisorRequests(Request $request)
    {
        $user = auth()->user();
        if (! $this->canUseSupervisorTools($user)) {
            return redirect()->route('dashboard')
                ->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        return Inertia::render('Dashboard', $this->challengeQueryService->supervisorRequestsData($user, $request->integer('student_id')));
    }

    public function supervisorStudents()
    {
        $user = auth()->user();
        if (! $this->canUseSupervisorTools($user)) {
            return redirect()->route('dashboard')
                ->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        return Inertia::render('Supervisor/Students', $this->challengeQueryService->supervisorStudentsData($user));
    }

    public function supervisorMilestones()
    {
        $user = auth()->user();
        if (! $this->canUseSupervisorTools($user)) {
            return redirect()->route('dashboard')
                ->with('error', 'غير مصرح لك بالدخول لهذه الصفحة.');
        }

        if (($user->role ?? null) === 'supervisor') {
            $this->groupManagementService->repairMissingChatGroupsForSupervisorTeams($user);
        }

        return Inertia::render('Supervisor/Milestones', $this->challengeQueryService->supervisorMilestonesData($user));
    }

    public function createMilestonePlan(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'supervisor_group_id' => 'nullable|integer|exists:supervisor_groups,id',
            'is_active' => 'nullable|boolean',
        ]);

        return $this->respondFromServiceResult(
            $this->milestonePlanService->createMilestonePlan(auth()->user(), $validated)
        );
    }

    public function updateMilestonePlan(Request $request, SupervisorMilestonePlan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        return $this->respondFromServiceResult(
            $this->milestonePlanService->updateMilestonePlan(auth()->user(), $plan, $validated)
        );
    }

    public function deleteMilestonePlan(SupervisorMilestonePlan $plan)
    {
        return $this->respondFromServiceResult(
            $this->milestonePlanService->deleteMilestonePlan(auth()->user(), $plan)
        );
    }

    public function createMilestoneTemplate(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:supervisor_milestone_plans,id',
            'title' => 'required|string|max:255',
            'increment_percent' => 'required|integer|min:1|max:100',
            'submission_title' => 'required|string|max:255',
            'deadline' => 'nullable|date',
        ]);

        return $this->respondFromServiceResult(
            $this->milestonePlanService->createMilestoneTemplate(auth()->user(), $validated)
        );
    }

    public function updateMilestoneTemplate(Request $request, SupervisorMilestone $milestone)
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:supervisor_milestone_plans,id',
            'title' => 'required|string|max:255',
            'increment_percent' => 'required|integer|min:1|max:100',
            'submission_title' => 'required|string|max:255',
            'deadline' => 'nullable|date',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        return $this->respondFromServiceResult(
            $this->milestonePlanService->updateMilestoneTemplate(auth()->user(), $milestone, $validated)
        );
    }

    public function deleteMilestoneTemplate(SupervisorMilestone $milestone)
    {
        return $this->respondFromServiceResult(
            $this->milestonePlanService->deleteMilestoneTemplate(auth()->user(), $milestone)
        );
    }

    public function syncMilestoneTemplates(Request $request, SupervisorMilestonePlan $plan)
    {
        $validated = $request->validate([
            'rows' => 'required|array|min:1',
            'rows.*.id' => 'nullable',
            'rows.*.title' => 'required|string|max:255',
            'rows.*.increment_percent' => 'required|integer|min:1|max:100',
            'rows.*.submission_title' => 'required|string|max:255',
            'rows.*.deadline' => 'nullable|date',
            'rows.*.sort_order' => 'required|integer|min:0',
        ]);

        return $this->respondFromServiceResult(
            $this->milestonePlanService->syncMilestoneTemplates(auth()->user(), $plan, $validated['rows'])
        );
    }

    public function saveMilestonePlanBundle(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'nullable',
            'name' => 'required|string|max:255',
            'supervisor_group_id' => 'nullable|integer|exists:supervisor_groups,id',
            'is_active' => 'nullable|boolean',
            'rows' => 'required|array|min:1',
            'rows.*.id' => 'nullable',
            'rows.*.title' => 'required|string|max:255',
            'rows.*.increment_percent' => 'required|integer|min:1|max:100',
            'rows.*.submission_title' => 'required|string|max:255',
            'rows.*.deadline' => 'nullable|date',
            'rows.*.sort_order' => 'required|integer|min:1',
        ]);

        return $this->respondFromServiceResult(
            $this->milestonePlanService->saveMilestonePlanBundle(auth()->user(), $validated)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'required|file|mimes:pdf,doc,docx,zip|max:20480',
        ]);
        return $this->respondFromServiceResult(
            $this->studentChallengeService->storeInitialSubmission(auth()->user(), $validated)
        );
    }

    public function updateProgress(Request $request, $id)
    {
        if (! $this->canUseSupervisorTools(auth()->user())) {
            return back()->with('error', 'غير مصرح لك بتعديل التقدم.');
        }

        $request->validate([
            'decision' => 'required|in:approve,reject,revise',
            'milestone_id' => 'nullable|string|max:100',
            'comment' => 'nullable|string|max:1000',
        ]);

        $challenge = IndustryChallenge::findOrFail($id);
        if (($challenge->kind ?? null) === 'company_challenge') {
            return back()->with(
                'error',
                'تحديات الشركات / الصناعة لا تُراجع من هنا. يعتمدها رئيس القسم أولاً ثم تُدار الطلبات من مسار «طلب التحدي» لفريقك.'
            );
        }
        $selectedMilestone = $this->milestonePlanService->resolveMilestoneBySelection(
            auth()->user(),
            (int) $challenge->posted_by_user_id,
            $request->milestone_id
        );
        $decisionMessage = $this->challengeReviewService->applySupervisorDecision(
            $challenge,
            (string) $request->decision,
            $selectedMilestone,
            $request->comment
        );

        return back()->with('success', $decisionMessage);
    }

    public function milestones()
    {
        $user = auth()->user();
        if (! $user) {
            return redirect()->route('login');
        }

        if ($this->canUseSupervisorTools($user)) {
            return redirect()->route('supervisor.milestones');
        }

        if (($user->role ?? null) === 'hod') {
            return redirect()->route('dashboard');
        }

        if (($user->role ?? null) === 'student') {
            $payload = $this->challengeQueryService->studentMilestonesLogPage($user);

            if (in_array($payload['source'] ?? '', ['no_team', 'no_project'], true)) {
                $legacy = IndustryChallenge::query()
                    ->where('posted_by_user_id', $user->id)
                    ->where('kind', 'student_idea')
                    ->latest()
                    ->first(['id', 'title', 'progress', 'current_milestone']);

                if ($legacy) {
                    $payload = [
                        'source' => 'legacy_idea',
                        'progress' => min(100, max(0, (int) ($legacy->progress ?? 0))),
                        'current' => [
                            'kind' => 'legacy',
                            'legacy_label' => $legacy->current_milestone ? (string) $legacy->current_milestone : null,
                            'milestone_title' => null,
                        ],
                        'project_title' => (string) $legacy->title,
                        'approved_milestone_count' => 0,
                        'milestone_count' => 0,
                        'milestones' => [],
                    ];
                }
            }

            return inertia('Milestones', [
                'myProject' => $payload,
            ]);
        }

        return redirect()->route('dashboard');
    }

    public function studentUploads()
    {
        if (auth()->user()->role !== 'student') {
            return redirect()->route('dashboard')->with('error', 'هذه الصفحة مخصصة للطلاب فقط.');
        }

        $project = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with([
                'histories.actor:id,name',
                'milestonePlan:id,name',
                'feedbacks' => fn ($q) => $q->latest(),
            ])
            ->where('posted_by_user_id', auth()->id())
            ->latest()
            ->first();

        return inertia('Student/Uploads', [
            'project' => $project,
            'milestonePath' => $project ? $this->milestonePlanService->planMilestonesForStudentView($project) : [],
        ]);
    }

    public function uploadStudentSubmission(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'required|file|mimes:pdf,doc,docx,zip|max:20480',
        ]);
        return $this->respondFromServiceResult(
            $this->studentChallengeService->uploadSubmission(auth()->user(), $validated)
        );
    }

    public function changeStudentPlan(Request $request, $challengeId)
    {
        $user = auth()->user();
        if (! $this->canUseSupervisorTools($user)) {
            return back()->with('error', 'غير مصرح لك بهذا الإجراء.');
        }

        $request->validate([
            'plan_id' => 'required|integer|exists:supervisor_milestone_plans,id',
        ]);

        $challenge = IndustryChallenge::findOrFail($challengeId);
        if (((int) $challenge->progress) > 20) {
            return back()->with('error', 'لا يمكن تغيير خطة الطالب بعد تجاوز 20% من الإنجاز.');
        }

        $plan = SupervisorMilestonePlan::findOrFail((int) $request->plan_id);
        if ($user->role === 'supervisor' && (int) $plan->supervisor_id !== (int) $user->id) {
            return back()->with('error', 'لا يمكنك اختيار خطة لا تتبع حسابك.');
        }

        $challenge->update([
            'milestone_plan_id' => $plan->id,
            'current_milestone' => 'تم تحديث خطة الإنجاز من المشرف',
        ]);

        $this->challengeHistoryService->record(
            $challenge,
            'supervisor_changed_plan',
            'تم تغيير خطة الإنجاز',
            "تم ربط المشروع بالخطة: {$plan->name}",
            [
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'progress' => (int) $challenge->progress,
            ]
        );

        return back()->with('success', 'تم تغيير خطة الطالب بنجاح.');
    }

    public function resubmitAfterRevision(Request $request, $id)
    {
        $validated = $request->validate([
            'comment' => 'nullable|string|max:1000',
        ]);
        return $this->respondFromServiceResult(
            $this->studentChallengeService->resubmitAfterRevision(auth()->user(), (int) $id, $validated['comment'] ?? null)
        );
    }
}
