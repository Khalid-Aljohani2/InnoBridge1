<?php

use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\ImpersonationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\Modules\Faculty\FacultyReportsWebController;
use App\Http\Controllers\Modules\Faculty\SupervisorProjectTimelineWebController;
use App\Http\Controllers\PreferenceController;
use App\Http\Controllers\SupervisorGroupChatController;
use App\Http\Controllers\SupervisorNotificationController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\StudentWorkspaceController;
use App\Http\Controllers\StudentNotificationController;
use App\Http\Controllers\NotificationCenterController;
use App\Http\Controllers\SupervisorProjectController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [ChallengeController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/notifications', [NotificationCenterController::class, 'index'])
    ->middleware(['auth'])
    ->name('notifications.index');
Route::patch('/notifications/read', [NotificationCenterController::class, 'markRead'])
    ->middleware(['auth'])
    ->name('notifications.read');

// إضافة رابط حفظ التحديات الجديدة
Route::post('/challenges', [ChallengeController::class, 'store'])
    ->middleware(['auth'])
    ->name('challenges.store');

Route::patch('/challenges/{id}/progress', [ChallengeController::class, 'updateProgress'])
    ->middleware(['auth'])
    ->name('challenges.updateProgress');
Route::patch('/challenges/{id}/resubmit', [ChallengeController::class, 'resubmitAfterRevision'])
    ->middleware(['auth'])
    ->name('challenges.resubmit');
Route::get('/student/uploads', [ChallengeController::class, 'studentUploads'])
    ->middleware(['auth'])
    ->name('student.uploads');
Route::post('/student/uploads', [ChallengeController::class, 'uploadStudentSubmission'])
    ->middleware(['auth'])
    ->name('student.uploads.store');

Route::get('/supervisor/requests', [ChallengeController::class, 'supervisorRequests'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.requests');
Route::get('/supervisor/students', [ChallengeController::class, 'supervisorStudents'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.students');
Route::patch('/supervisor/students/{challenge}/plan', [ChallengeController::class, 'changeStudentPlan'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.students.plan.update');
Route::get('/supervisor/milestones', [ChallengeController::class, 'supervisorMilestones'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestones');
Route::post('/supervisor/milestones', [ChallengeController::class, 'createMilestoneTemplate'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestones.store');
Route::patch('/supervisor/milestones/{milestone}', [ChallengeController::class, 'updateMilestoneTemplate'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestones.update');
Route::delete('/supervisor/milestones/{milestone}', [ChallengeController::class, 'deleteMilestoneTemplate'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestones.destroy');
Route::put('/supervisor/milestone-plans/{plan}/milestones/sync', [ChallengeController::class, 'syncMilestoneTemplates'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestones.sync');
Route::post('/supervisor/milestone-plans', [ChallengeController::class, 'createMilestonePlan'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestone-plans.store');
Route::post('/supervisor/milestone-plans/bundle-save', [ChallengeController::class, 'saveMilestonePlanBundle'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestone-plans.bundle-save');
Route::patch('/supervisor/milestone-plans/{plan}', [ChallengeController::class, 'updateMilestonePlan'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestone-plans.update');
Route::delete('/supervisor/milestone-plans/{plan}', [ChallengeController::class, 'deleteMilestonePlan'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.milestone-plans.destroy');
Route::get('/supervisor/notifications', [SupervisorNotificationController::class, 'index'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.notifications');
Route::get('/supervisor/groups', [SupervisorGroupChatController::class, 'index'])
    ->middleware(['auth', 'role:supervisor,admin,student'])
    ->name('supervisor.groups.index');
Route::get('/supervisor/groups/{group}/chat', [SupervisorGroupChatController::class, 'show'])
    ->middleware(['auth', 'role:supervisor,admin,student'])
    ->name('supervisor.groups.chat');
Route::post('/supervisor/groups/{group}/chat/messages', [SupervisorGroupChatController::class, 'store'])
    ->middleware(['auth', 'role:supervisor,admin,student'])
    ->name('supervisor.groups.messages.store');
Route::patch('/supervisor/groups/{group}', [SupervisorGroupChatController::class, 'update'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.groups.update');
Route::patch('/supervisor/groups/{group}/members', [SupervisorGroupChatController::class, 'syncMembers'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.groups.members.sync');
Route::patch('/supervisor/groups/{group}/admins', [SupervisorGroupChatController::class, 'syncAdmins'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.groups.admins.sync');
Route::delete('/supervisor/groups/{group}', [SupervisorGroupChatController::class, 'destroy'])
    ->middleware(['auth', 'role:supervisor,admin'])
    ->name('supervisor.groups.destroy');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::patch('/preferences', [PreferenceController::class, 'update'])->name('preferences.update');
    Route::post('/supervisor/notify-student', [SupervisorNotificationController::class, 'notifyStudent'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.notify.student');
    Route::post('/supervisor/notify-group', [SupervisorNotificationController::class, 'notifyGroup'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.notify.group');

    // Student: HoD-approved company challenges only; student requests supervisor approval
    Route::get('/student/team', [TeamController::class, 'show'])
        ->middleware(['role:student'])
        ->name('student.team');
    Route::post('/student/team', [TeamController::class, 'create'])
        ->middleware(['role:student'])
        ->name('student.team.create');
    Route::post('/student/team/members', [TeamController::class, 'addMember'])
        ->middleware(['role:student'])
        ->name('student.team.members.add');
    Route::post('/student/team/join/{team}', [TeamController::class, 'join'])
        ->middleware(['role:student'])
        ->name('student.team.join');
    Route::patch('/student/team/invitations/{invitation}', [TeamController::class, 'decideInvite'])
        ->middleware(['role:student'])
        ->name('student.team.invitations.decide');
    Route::delete('/student/team/members/{memberUserId}', [TeamController::class, 'removeMember'])
        ->middleware(['role:student'])
        ->name('student.team.members.remove');
    Route::post('/student/team/leave', [TeamController::class, 'leave'])
        ->middleware(['role:student'])
        ->name('student.team.leave');

    Route::get('/student/workspace', [StudentWorkspaceController::class, 'show'])
        ->middleware(['role:student'])
        ->name('student.workspace');
    Route::get('/student/notifications', [StudentNotificationController::class, 'index'])
        ->middleware(['role:student'])
        ->name('student.notifications');
    Route::post('/student/milestones/{milestone}/submissions', [StudentWorkspaceController::class, 'upload'])
        ->middleware(['role:student'])
        ->name('student.milestones.submissions.upload');
    Route::patch('/student/submissions/{submission}', [StudentWorkspaceController::class, 'updateSubmission'])
        ->middleware(['role:student'])
        ->name('student.submissions.update');

    Route::get('/student/industry-challenges', [PortalController::class, 'studentIndustryChallenges'])
        ->middleware(['role:student'])
        ->name('student.industry-challenges');
    Route::post('/student/industry-challenges/request', [PortalController::class, 'studentRequestChallenge'])
        ->middleware(['role:student'])
        ->name('student.industry-challenges.request');

    // Supervisor/HoD: pending challenge requests
    Route::get('/supervisor/challenge-requests/pending', [PortalController::class, 'supervisorPendingChallengeRequests'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.challenge-requests.pending');
    Route::patch('/supervisor/challenge-requests/{challengeRequest}', [PortalController::class, 'supervisorDecideChallengeRequest'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.challenge-requests.decide');
    Route::patch('/supervisor/teams/{team}/designated-workspace', [PortalController::class, 'supervisorTeamWorkspace'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.teams.workspace');

    Route::get('/supervisor/projects', [SupervisorProjectController::class, 'index'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.projects');
    Route::patch('/supervisor/projects/{project}/plan', [SupervisorProjectController::class, 'setPlan'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.projects.plan');
    Route::patch('/supervisor/submissions/{submission}/decide', [SupervisorProjectController::class, 'decideSubmission'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.submissions.decide');

    // HoD panel (inside Supervisor dashboard via conditional rendering)
    Route::get('/hod/panel', [PortalController::class, 'hodPanel'])
        ->middleware(['role:hod,admin'])
        ->name('hod.panel');
    Route::get('/hod/industry-challenges', [PortalController::class, 'hodIndustryChallenges'])
        ->middleware(['role:hod,admin'])
        ->name('hod.industry-challenges');
    Route::patch('/hod/industry-challenges/{industryChallenge}/publish-for-students', [PortalController::class, 'hodPublishIndustryChallengeForStudents'])
        ->middleware(['role:hod,admin'])
        ->name('hod.industry-challenges.publish');
    Route::patch('/hod/industry-challenges/{industryChallenge}/review', [PortalController::class, 'hodReviewIndustryChallenge'])
        ->middleware(['role:hod,admin'])
        ->name('hod.industry-challenges.review');
    Route::get('/hod/industry-nominations', [PortalController::class, 'hodIndustryNominations'])
        ->middleware(['role:hod,admin'])
        ->name('hod.industry-nominations.index');
    Route::post('/hod/industry-nominations/nominate', [PortalController::class, 'hodNominateIndustryTeams'])
        ->middleware(['role:hod,admin'])
        ->name('hod.industry-nominations.nominate');
    Route::patch('/hod/industry-requests/{challengeRequest}/decline-from-pool', [PortalController::class, 'hodDeclineIndustryNomination'])
        ->middleware(['role:hod,admin'])
        ->name('hod.industry-requests.decline-from-pool');
    Route::get('/hod/teams-monitor', [PortalController::class, 'hodTeamsMonitor'])
        ->middleware(['role:hod,admin'])
        ->name('hod.teams.monitor');
    Route::patch('/hod/groups/{team}/assign-supervisor', [PortalController::class, 'hodAssignSupervisor'])
        ->middleware(['role:hod,admin'])
        ->name('hod.groups.assign-supervisor');
    Route::patch('/hod/team-join/toggle', [PortalController::class, 'hodToggleTeamJoin'])
        ->middleware(['role:hod,admin'])
        ->name('hod.team-join.toggle');
    Route::patch('/hod/teams/{team}/review', [PortalController::class, 'hodReviewTeam'])
        ->middleware(['role:hod,admin'])
        ->name('hod.teams.review');
    Route::delete('/hod/teams/{team}', [PortalController::class, 'hodDismantleTeam'])
        ->middleware(['role:hod,admin'])
        ->name('hod.teams.dismantle');
    Route::delete('/hod/supervisors/{supervisor}', [PortalController::class, 'hodDeleteSupervisor'])
        ->middleware(['role:hod,admin'])
        ->name('hod.supervisors.delete');
    Route::patch('/hod/supervisors/{supervisor}/activate', [PortalController::class, 'hodActivateSupervisor'])
        ->middleware(['role:hod,admin'])
        ->name('hod.supervisors.activate');

    Route::get('/faculty/reports-export', [FacultyReportsWebController::class, 'index'])
        ->middleware(['role:supervisor,hod,admin'])
        ->name('faculty.reports.export');
    Route::post('/faculty/reports-export/download', [FacultyReportsWebController::class, 'export'])
        ->middleware(['role:supervisor,hod,admin'])
        ->name('faculty.reports.export.download');

    Route::get('/supervisor/project-timeline', [SupervisorProjectTimelineWebController::class, 'index'])
        ->middleware(['role:supervisor,admin'])
        ->name('supervisor.project.timeline');

    // Industry portal
    Route::get('/industry/portal', [PortalController::class, 'industryPortal'])
        ->middleware(['role:industry,admin'])
        ->name('industry.portal');
    Route::post('/industry/challenges', [PortalController::class, 'industryCreateChallenge'])
        ->middleware(['role:industry,admin'])
        ->name('industry.challenges.store');
    Route::patch('/industry/challenge-requests/{challengeRequest}', [PortalController::class, 'industryDecide'])
        ->middleware(['role:industry,admin'])
        ->name('industry.challenge-requests.decide');

    Route::middleware(['role:admin', 'verified'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/overview', [AdminOverviewController::class, 'show'])->name('overview');
        Route::get('/users', [AdminUsersController::class, 'index'])->name('users.index');
        Route::post('/impersonate/{user}', [ImpersonationController::class, 'start'])
            ->name('impersonate.start');
    });
});

Route::post('/admin/impersonation/end', [ImpersonationController::class, 'leave'])
    ->middleware(['auth', 'verified'])
    ->name('admin.impersonate.leave');

require __DIR__.'/auth.php';

Route::get('/research', function () {
    return Inertia::render('Research');
})->middleware(['auth', 'verified'])->name('research');

Route::get('/milestones', [ChallengeController::class, 'milestones'])
    ->middleware(['auth', 'verified'])
    ->name('milestones.index');