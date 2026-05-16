<?php

namespace App\Services;

use App\Models\ChallengeRequest;
use App\Models\FacultyNotification;
use App\Models\IndustryChallenge;
use App\Models\Project;
use App\Models\StudentNotification;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ChallengeWorkflowService
{
    public const COMPANY_CHALLENGE_VISIBLE_TO_STUDENTS_MILESTONE = 'Approved for students';

    public const COMPANY_CHALLENGE_APPROVED_AWAITING_PUBLISH_MILESTONE = 'HoD approved — awaiting publication to students';

    public const COMPANY_CHALLENGE_PENDING_HOD_MILESTONE = 'Pending HoD approval';

    public const CS_WAITING_SUPERVISOR = 'waiting_supervisor';

    /** بانتظار ترشيح رئيس القسم (بعد موافقة المشرف). */
    public const CS_AWAITING_HOD_NOMINATION = 'awaiting_hod_nomination';

    /** مرشح للشركة (بعد ترشيح رئيس القسم). */
    public const CS_NOMINATED_TO_COMPANY = 'nominated_to_company';

    /** مقبول من الشركة + إنشاء مشروع الصناعة. */
    public const CS_ACCEPTED_BY_COMPANY = 'accepted_by_company';

    public const CS_REJECTED_BY_COMPANY = 'rejected_by_company';

    /** لم يُرشّح أو أُغلق لصالح فريق آخر. */
    public const CS_FINALIZED_LOST = 'finalized_lost';

    /** Legacy DB value — treat as {@see CS_ACCEPTED_BY_COMPANY} when read. */
    public const CS_LEGACY_FINALIZED_WON = 'finalized_won';

    public function __construct(
        private readonly GroupManagementService $groupManagementService,
    ) {}

    public function scopedStudentIdsForSupervisor(User $user): array
    {
        if (($user->role ?? null) !== 'supervisor') {
            return [];
        }

        return TeamMember::query()
            ->join('teams', 'teams.id', '=', 'team_members.team_id')
            ->where('teams.supervisor_id', $user->id)
            ->pluck('team_members.user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    public function queryCompanyChallengesApproved(): Builder
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNotNull('published_to_students_at')
            ->whereDoesntHave('projects')
            ->latest();
    }

    public function queryCompanyChallengesAwaitingStudentPublication(): Builder
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name,email')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNull('published_to_students_at')
            ->latest();
    }

    public function queryCompanyChallengesPendingHoD(): Builder
    {
        return IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->with('postedBy:id,name,email')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'pending_action')
            ->latest();
    }

    public function createCompanyChallenge(User $industryUser, array $validated): array
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::create([
            'title' => trim((string) $validated['title']),
            'description' => trim((string) $validated['description']),
            'deadline' => $validated['deadline'] ?? null,
            'posted_by_user_id' => $industryUser->id,
            'kind' => 'company_challenge',
            'posted_date' => now(),
            'review_status' => 'pending_action',
            'progress' => 0,
            'current_milestone' => self::COMPANY_CHALLENGE_PENDING_HOD_MILESTONE,
        ]);

        return [
            'ok' => true,
            'message' => 'Challenge submitted — awaiting Head of Department approval before students can view it.',
            'data' => $challenge,
        ];
    }

    public function hodReviewCompanyChallenge(User $hod, IndustryChallenge $challenge, string $decision, ?string $notes): array
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($challenge->kind !== 'company_challenge') {
            return ['ok' => false, 'message' => 'Not a company challenge'];
        }
        if ($challenge->review_status !== 'pending_action') {
            return ['ok' => false, 'message' => 'This challenge is not awaiting HoD approval'];
        }

        $decision = $decision === 'approve' ? 'approved' : 'rejected';
        $challenge->update([
            'review_status' => $decision,
            'current_milestone' => $decision === 'approved'
                ? self::COMPANY_CHALLENGE_APPROVED_AWAITING_PUBLISH_MILESTONE
                : 'Rejected by HoD',
            'published_to_students_at' => $decision === 'approved' ? null : $challenge->published_to_students_at,
        ]);
        if ($notes) {
            $challenge->feedbacks()->create([
                'comment' => "HoD Notes:\n".trim($notes),
            ]);
        }

        return ['ok' => true, 'message' => $decision === 'approved'
            ? 'Challenge accepted. Publish it to students when you are ready.'
            : 'Decision saved'];
    }

    public function hodPublishCompanyChallengeToStudents(User $hod, IndustryChallenge $challenge): array
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($challenge->kind !== 'company_challenge') {
            return ['ok' => false, 'message' => 'Not a company challenge'];
        }
        if ($challenge->review_status !== 'approved') {
            return ['ok' => false, 'message' => 'Challenge is not approved'];
        }
        if ($challenge->published_to_students_at !== null) {
            return ['ok' => false, 'message' => 'Already visible to students'];
        }

        $challenge->update([
            'published_to_students_at' => now(),
            'current_milestone' => self::COMPANY_CHALLENGE_VISIBLE_TO_STUDENTS_MILESTONE,
        ]);

        return ['ok' => true, 'message' => 'Challenge is now visible to students.'];
    }

    public function createChallengeRequest(User $student, int $industryChallengeId): array
    {
        if ($student->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::query()
            ->withoutVectorEmbedding()
            ->where('id', $industryChallengeId)
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->whereNotNull('published_to_students_at')
            ->first();

        if (! $challenge) {
            return ['ok' => false, 'message' => 'Challenge not available'];
        }

        $teamId = TeamMember::query()
            ->where('user_id', $student->id)
            ->value('team_id');

        if (! $teamId) {
            return ['ok' => false, 'message' => 'You are not assigned to a group'];
        }

        $team = Team::find((int) $teamId);
        if ($team && ($team->review_status ?? 'pending') !== 'approved') {
            return ['ok' => false, 'message' => 'Your group is pending HoD approval'];
        }
        if (! $team || ! $team->supervisor_id) {
            return ['ok' => false, 'message' => 'Your group has no assigned supervisor'];
        }

        if ($team->industry_project_id) {
            return ['ok' => false, 'message' => 'Your group already has an assigned industry challenge project'];
        }

        $blockingOther = ChallengeRequest::query()
            ->where('team_id', $team->id)
            ->where(function (Builder $q): void {
                $q->where('status', 'pending')
                    ->orWhere(function (Builder $q2): void {
                        $q2->where('status', 'approved')
                            ->whereIn('company_status', [
                                self::CS_AWAITING_HOD_NOMINATION,
                                self::CS_NOMINATED_TO_COMPANY,
                            ]);
                    });
            })
            ->exists();
        if ($blockingOther) {
            return ['ok' => false, 'message' => 'Your group already has an active industry challenge application'];
        }

        $duplicateThisChallenge = ChallengeRequest::query()
            ->where('team_id', $team->id)
            ->where('industry_challenge_id', $challenge->id)
            ->where(function (Builder $q): void {
                $q->where('status', 'pending')
                    ->orWhere(function (Builder $q2): void {
                        $q2->where('status', 'approved')
                            ->whereNotIn('company_status', [
                                self::CS_REJECTED_BY_COMPANY,
                                self::CS_FINALIZED_LOST,
                                self::CS_ACCEPTED_BY_COMPANY,
                                self::CS_LEGACY_FINALIZED_WON,
                            ]);
                    });
            })
            ->exists();
        if ($duplicateThisChallenge) {
            return ['ok' => false, 'message' => 'A request already exists for this challenge'];
        }

        $req = ChallengeRequest::create([
            'team_id' => $team->id,
            'industry_challenge_id' => $challenge->id,
            'requested_by_student_id' => $student->id,
            'supervisor_id' => $team->supervisor_id,
            'status' => 'pending',
            'company_status' => self::CS_WAITING_SUPERVISOR,
        ]);

        return ['ok' => true, 'message' => 'Request submitted', 'data' => $req];
    }

    public function supervisorPendingRequests(User $supervisor): Collection
    {
        if (! in_array($supervisor->role, ['supervisor', 'admin'], true)) {
            return collect();
        }

        $query = ChallengeRequest::query()
            ->with([
                'team:id,name,leader_id,supervisor_id,project_id,industry_project_id',
                'team.leader:id,name',
                'industryChallenge:id,title,description,posted_by_user_id,deadline',
                'industryChallenge.postedBy:id,name',
                'requestedByStudent:id,name',
            ])
            ->where('status', 'pending')
            ->latest();

        if ($supervisor->role === 'supervisor') {
            $query->where('supervisor_id', $supervisor->id);
        }

        return $query->get();
    }

    public function supervisorDecideRequest(User $supervisor, ChallengeRequest $request, string $decision, ?string $notes): array
    {
        if (! in_array($supervisor->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->status !== 'pending') {
            return ['ok' => false, 'message' => 'Request already decided'];
        }

        if ($supervisor->role === 'supervisor' && (int) $request->supervisor_id !== (int) $supervisor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $decision = $decision === 'approve' ? 'approved' : 'rejected';

        return DB::transaction(function () use ($request, $decision, $notes, $supervisor) {
            $team = Team::lockForUpdate()->findOrFail((int) $request->team_id);
            if ($supervisor->role === 'supervisor' && (int) $team->supervisor_id !== (int) $supervisor->id) {
                return ['ok' => false, 'message' => 'Forbidden'];
            }

            if ($decision === 'approved' && Project::where('industry_challenge_id', (int) $request->industry_challenge_id)->exists()) {
                $request->update([
                    'status' => 'rejected',
                    'supervisor_notes' => 'Industry challenge already assigned to another team.',
                    'decided_at' => now(),
                    'company_status' => self::CS_FINALIZED_LOST,
                ]);

                return ['ok' => false, 'message' => 'Challenge is no longer available for new assignments'];
            }

            $request->update([
                'status' => $decision,
                'supervisor_notes' => $notes ? trim($notes) : null,
                'decided_at' => now(),
                'company_status' => $decision === 'approved'
                    ? self::CS_AWAITING_HOD_NOMINATION
                    : self::CS_REJECTED_BY_COMPANY,
                'presented_to_company_at' => $decision === 'approved' ? now() : null,
            ]);

            return ['ok' => true, 'message' => 'Decision saved'];
        });
    }

    public function hodAssignChallengeToTeam(User $hod, Team $team, IndustryChallenge $challenge): array
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($challenge->kind !== 'company_challenge' || $challenge->review_status !== 'approved') {
            return ['ok' => false, 'message' => 'Challenge not assignable'];
        }
        if ($challenge->published_to_students_at === null) {
            return ['ok' => false, 'message' => 'Challenge not assignable'];
        }

        return DB::transaction(function () use ($team, $challenge) {
            $team = Team::lockForUpdate()->findOrFail($team->id);

            $project = Project::create([
                'title' => $challenge->title,
                'abstract' => $challenge->description,
                'type' => 'industry_sponsored',
                'industry_challenge_id' => $challenge->id,
                'owner_user_id' => $team->leader_id,
                'status' => 'approved',
                'current_progress' => 0,
                'start_date' => now()->toDateString(),
            ]);

            $team->update([
                'industry_project_id' => $project->id,
                'project_id' => $project->id,
            ]);

            return ['ok' => true, 'message' => 'Challenge assigned'];
        });
    }

    /**
     * طلبات بانتظار ترشيح رئيس القسم (بعد مشرف الطلاب).
     */
    public function hodIndustryRequestsAwaitingNomination(User $hod): Collection
    {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return collect();
        }

        $query = ChallengeRequest::query()
            ->with([
                'team:id,name,leader_id,department,supervisor_id',
                'team.leader:id,name',
                'team.supervisor:id,name',
                'industryChallenge:id,title,posted_by_user_id',
                'industryChallenge.postedBy:id,name',
                'requestedByStudent:id,name',
            ])
            ->where('status', 'approved')
            ->where('company_status', self::CS_AWAITING_HOD_NOMINATION)
            ->latest('presented_to_company_at');

        if ($hod->role === 'hod') {
            $query->whereHas('team', function (Builder $teamQ) use ($hod): void {
                $this->groupManagementService->applyHodDepartmentScopeToTeamsQuery($teamQ, $hod);
            });
        }

        return $query->get();
    }

    public function hodIndustryAwaitingNominationCount(User $hod): int
    {
        if (! $hod || ! in_array($hod->role, ['hod', 'admin'], true)) {
            return 0;
        }

        $query = ChallengeRequest::query()
            ->where('status', 'approved')
            ->where('company_status', self::CS_AWAITING_HOD_NOMINATION);

        if ($hod->role === 'hod') {
            $query->whereHas('team', function (Builder $teamQ) use ($hod): void {
                $this->groupManagementService->applyHodDepartmentScopeToTeamsQuery($teamQ, $hod);
            });
        }

        return (int) $query->count();
    }

    /**
     * @param  list<int>  $requestIds
     */
    public function hodNominateTeamsToCompany(User $hod, array $requestIds): array
    {
        $requestIds = array_values(array_unique(array_map(static fn ($v) => (int) $v, $requestIds)));
        if ($requestIds === []) {
            return ['ok' => false, 'message' => 'No requests selected'];
        }

        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        return DB::transaction(function () use ($hod, $requestIds) {
            $locked = ChallengeRequest::query()->lockForUpdate()->whereIn('id', $requestIds)->get();

            if ($locked->count() !== count($requestIds)) {
                return ['ok' => false, 'message' => 'One or more requests were not found'];
            }

            $challengeId = null;
            foreach ($locked as $req) {
                if ($hod->role === 'hod') {
                    $req->loadMissing('team');
                    if (! $this->groupManagementService->hodMayAccessTeamModel($hod, $req->team)) {
                        return ['ok' => false, 'message' => 'Forbidden'];
                    }
                }

                if ($req->status !== 'approved' || $req->company_status !== self::CS_AWAITING_HOD_NOMINATION) {
                    return ['ok' => false, 'message' => 'One or more requests are not awaiting HoD nomination'];
                }

                if (Project::where('industry_challenge_id', (int) $req->industry_challenge_id)->exists()) {
                    return ['ok' => false, 'message' => 'This challenge is already finalized'];
                }

                if ($challengeId === null) {
                    $challengeId = (int) $req->industry_challenge_id;
                } elseif ($challengeId !== (int) $req->industry_challenge_id) {
                    return ['ok' => false, 'message' => 'Nominate teams for one challenge at a time'];
                }
            }

            foreach ($locked as $req) {
                $req->update([
                    'company_status' => self::CS_NOMINATED_TO_COMPANY,
                    'hod_sent_to_company_at' => now(),
                ]);
            }

            return ['ok' => true, 'message' => 'Nominated teams are now visible to the company'];
        });
    }

    public function hodDeclineTeamWithoutCompanyNomination(
        User $hod,
        ChallengeRequest $request,
        string $templateKey,
        ?string $notes,
    ): array {
        if (! in_array($hod->role, ['hod', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $request->loadMissing('team');
        if ($hod->role === 'hod' && ! $this->groupManagementService->hodMayAccessTeamModel($hod, $request->team)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->status !== 'approved' || $request->company_status !== self::CS_AWAITING_HOD_NOMINATION) {
            return ['ok' => false, 'message' => 'Request is not in HoD review pool'];
        }

        $bundle = config('industry_challenge_flow.hod_student_messages.'.$templateKey);
        $bodyAr = is_array($bundle) ? (string) ($bundle['ar'] ?? '') : '';
        if ($bodyAr === '') {
            $defaults = config('industry_challenge_flow.hod_student_messages.not_nominated_efficiency', []);
            $bodyAr = (string) ($defaults['ar'] ?? 'بناءً على معايير الكفاءة، تم ترشيح فريق آخر لهذا التحدي.');
        }

        $request->update([
            'status' => 'rejected',
            'supervisor_notes' => $notes ? trim($notes) : null,
            'decided_at' => now(),
            'company_status' => self::CS_FINALIZED_LOST,
            'hod_nomination_template_key' => $templateKey,
        ]);

        if ($request->team && filled($request->team->supervisor_id)) {
            $this->notifyTeamStudentsTemplate(
                $request->team,
                $hod->role === 'hod' ? 'رسالة من رئيس القسم' : 'Department update',
                $bodyAr,
                (int) $request->team->supervisor_id
            );
        }

        return ['ok' => true, 'message' => 'Team notified and application closed'];
    }

    /** طلبات تظهر للشركة فقط (مرشّحة من رئيس القسم). */
    public function industryRequestsForCompany(User $industryUser)
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return collect();
        }

        return ChallengeRequest::query()
            ->with([
                'team:id,name,leader_id,project_id,industry_project_id,supervisor_id',
                'team.leader:id,name',
                'team.supervisor:id,name',
                'industryChallenge:id,title,posted_by_user_id',
                'requestedByStudent:id,name',
            ])
            ->where('status', 'approved')
            ->where('company_status', self::CS_NOMINATED_TO_COMPANY)
            ->whereHas('industryChallenge', fn ($q) => $q->where('posted_by_user_id', $industryUser->id))
            ->latest('hod_sent_to_company_at')
            ->get();
    }

    public function industryDecide(User $industryUser, ChallengeRequest $request, string $decision, ?string $notes): array
    {
        $decision = strtolower($decision);
        if ($decision === 'nominate') {
            return ['ok' => false, 'message' => 'Invalid action: teams are nominated by the Head of Department first.'];
        }
        if (in_array($decision, ['accept', 'approve'], true)) {
            return $this->companyAcceptNominatedTeam($industryUser, $request, $notes);
        }

        return $this->companyRejectNominatedTeam($industryUser, $request, $notes);
    }

    public function companyAcceptNominatedTeam(User $industryUser, ChallengeRequest $request, ?string $notes): array
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::find((int) $request->industry_challenge_id);
        if (! $challenge || (int) $challenge->posted_by_user_id !== (int) $industryUser->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->status !== 'approved' || $request->company_status !== self::CS_NOMINATED_TO_COMPANY) {
            return ['ok' => false, 'message' => 'This nomination is not active for company review'];
        }

        return DB::transaction(function () use ($industryUser, $request, $challenge, $notes) {
            $req = ChallengeRequest::lockForUpdate()->findOrFail($request->id);

            if (Project::where('industry_challenge_id', $challenge->id)->exists()) {
                return ['ok' => false, 'message' => 'Challenge already assigned'];
            }

            $team = Team::lockForUpdate()->findOrFail((int) $req->team_id);

            $project = Project::create([
                'title' => $challenge->title,
                'abstract' => $challenge->description,
                'type' => 'industry_sponsored',
                'industry_challenge_id' => $challenge->id,
                'owner_user_id' => $team->leader_id,
                'status' => 'approved',
                'current_progress' => 0,
                'start_date' => now()->toDateString(),
            ]);

            $team->update([
                'industry_project_id' => $project->id,
                'project_id' => $project->id,
            ]);

            $req->update([
                'company_status' => self::CS_ACCEPTED_BY_COMPANY,
                'company_notes' => $notes ? trim($notes) : null,
                'company_decided_at' => now(),
            ]);

            $tpl = config('industry_challenge_flow.hod_apologies.company_picked_other', []);
            $losersBody = $this->pickLocaleFromBundle(is_array($tpl) ? $tpl : [], 'ar');
            if ($losersBody === '') {
                $losersBody = 'نعتذر لكم، لقد اختارت الشركة فريقاً آخر لهذا التحدي، وتم إلغاء الطلب من طرفكم.';
            }
            $this->closePipelineAfterCompanyAccept($challenge, $req, $losersBody);

            foreach ($this->hodRecipientsForIndustryChallenge() as $hodId) {
                FacultyNotification::create([
                    'recipient_user_id' => $hodId,
                    'title' => 'تم قبول ترشيح من الشركة',
                    'message' => 'قَبِلَت الشركة الطلب لفريق '.($team->name ?? '').' على تحدي: '.($challenge->title ?? ''),
                    'is_read' => false,
                ]);
            }

            return ['ok' => true, 'message' => 'Team confirmed for the industry challenge'];
        });
    }

    public function companyRejectNominatedTeam(User $industryUser, ChallengeRequest $request, ?string $notes): array
    {
        if (! in_array($industryUser->role, ['industry', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $challenge = IndustryChallenge::find((int) $request->industry_challenge_id);
        if (! $challenge || (int) $challenge->posted_by_user_id !== (int) $industryUser->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        if ($request->status !== 'approved' || $request->company_status !== self::CS_NOMINATED_TO_COMPANY) {
            return ['ok' => false, 'message' => 'Nothing to reject in the current workflow step'];
        }

        $bundle = config('industry_challenge_flow.company_reject_messages.challenge_reopened', []);
        $bodyAr = $this->pickLocaleFromBundle(is_array($bundle) ? $bundle : [], 'ar');
        $tplKey = 'challenge_reopened';

        $request->update([
            'company_status' => self::CS_REJECTED_BY_COMPANY,
            'company_notes' => $notes ? trim($notes) : null,
            'company_decided_at' => now(),
            'hod_nomination_template_key' => $tplKey,
        ]);

        if ($request->team && filled($request->team->supervisor_id)) {
            $this->notifyTeamStudentsTemplate(
                $request->team,
                'تحديث من الشركة / رئيس القسم',
                $bodyAr !== '' ? $bodyAr : 'تم رفض الطلب من جهة الشركة.',
                (int) $request->team->supervisor_id
            );
        }

        foreach ($this->hodRecipientsForIndustryChallenge() as $hodId) {
            FacultyNotification::create([
                'recipient_user_id' => $hodId,
                'title' => 'رفض الشركة للترشيح الحالي',
                'message' => 'لم تُوافِق الشركة على ترشيح فريق '.($request->team?->name ?? '').'؛ سيظل التحدي متاحاً لفرص أخرى.',
                'is_read' => false,
            ]);
        }

        return ['ok' => true, 'message' => 'Rejection processed; challenge remains available'];
    }

    public function hodStudentDeclineTemplates(): array
    {
        $templates = config('industry_challenge_flow.hod_student_messages', []);

        return $this->normalizeTemplateList($templates);
    }

    public function hodApologyTemplateChoices(): array
    {
        $templates = config('industry_challenge_flow.hod_apologies', []);

        return $this->normalizeTemplateList($templates);
    }

    /** @deprecated */
    public function companyNominateForHoD(User $industryUser, ChallengeRequest $request, ?string $notes): array
    {
        return ['ok' => false, 'message' => 'This action is obsolete; nominations are HoD-managed.'];
    }

    /** @deprecated */
    public function companyRejectCandidate(User $industryUser, ChallengeRequest $request, ?string $notes): array
    {
        return $this->companyRejectNominatedTeam($industryUser, $request, $notes);
    }

    /** @deprecated */
    public function hodPendingIndustryNominations(User $hod)
    {
        return $this->hodIndustryRequestsAwaitingNomination($hod);
    }

    /** @deprecated */
    public function hodPendingIndustryNominationsCount(User $hod): int
    {
        return $this->hodIndustryAwaitingNominationCount($hod);
    }

    /** @deprecated */
    public function hodFinalizeIndustryNomination(
        User $hod,
        ChallengeRequest $nominationRequest,
        string $decision,
        ?string $templateKeyForLosers,
        ?string $notes,
    ): array {
        return ['ok' => false, 'message' => 'Use the HoD nominate / decline endpoints for the updated workflow.'];
    }

    public function apologyTextForStudent(string $templateKey, User $recipient): string
    {
        $locale = ($recipient->locale ?? null) === 'en' ? 'en' : 'ar';

        return $this->pickLocaleFromBundle(config('industry_challenge_flow.hod_apologies.'.$templateKey, []), $locale);
    }

    public function supervisorDesignatedWorkspace(User $supervisor, Team $team, string $workspace): array
    {
        if (! in_array($supervisor->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if (! in_array($workspace, ['student', 'industry'], true)) {
            return ['ok' => false, 'message' => 'Invalid workspace'];
        }
        if ($supervisor->role === 'supervisor' && (int) $team->supervisor_id !== (int) $supervisor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }

        $team->update([
            'supervisor_designated_workspace' => $workspace,
        ]);

        return ['ok' => true, 'message' => 'Workspace preference saved'];
    }

    /**
     * @return list<int>
     */
    private function hodRecipientsForIndustryChallenge(): array
    {
        if (! \App\Support\CachedSchema::hasColumn('users', 'is_active')) {
            return User::query()
                ->where('role', 'hod')
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all();
        }

        return User::query()
            ->where('role', 'hod')
            ->where('is_active', true)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    private function closePipelineAfterCompanyAccept(IndustryChallenge $challenge, ChallengeRequest $winnerRequest, string $bodyAr): void
    {
        $losers = ChallengeRequest::query()
            ->where('industry_challenge_id', $challenge->id)
            ->where('id', '<>', $winnerRequest->id)
            ->where('status', 'approved')
            ->whereIn('company_status', [
                self::CS_AWAITING_HOD_NOMINATION,
                self::CS_NOMINATED_TO_COMPANY,
            ])
            ->with(['team'])
            ->get();

        $titleAr = 'تحديث من رئيس القسم';

        foreach ($losers as $loser) {
            $loser->update([
                'status' => 'rejected',
                'supervisor_notes' => $bodyAr,
                'decided_at' => now(),
                'company_status' => self::CS_FINALIZED_LOST,
            ]);

            if ($loser->team && filled($loser->team->supervisor_id)) {
                $this->notifyTeamStudentsTemplate($loser->team, $titleAr, $bodyAr, (int) $loser->team->supervisor_id);
            }
        }
    }

    private function notifyTeamStudentsTemplate(Team $team, string $title, string $messageBody, int $supervisorFk): void
    {
        $ids = TeamMember::query()->where('team_id', $team->id)->pluck('user_id')->map(fn ($id) => (int) $id)->unique()->filter()->values();
        foreach ($ids as $studentId) {
            StudentNotification::create([
                'supervisor_id' => $supervisorFk,
                'student_id' => $studentId,
                'title' => $title,
                'message' => $messageBody,
                'sent_at' => now(),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $bundle
     */
    private function pickLocaleFromBundle(array $bundle, string $locale): string
    {
        return (string) ($bundle[$locale] ?? $bundle['ar'] ?? '');
    }

    /**
     * @param  array<string, mixed>  $templates
     * @return list<array{key: string, ar: string, en: string}>
     */
    private function normalizeTemplateList(array $templates): array
    {
        $out = [];
        foreach ($templates as $key => $row) {
            if (! is_array($row)) {
                continue;
            }
            $out[] = [
                'key' => (string) $key,
                'ar' => (string) ($row['ar'] ?? ''),
                'en' => (string) ($row['en'] ?? ''),
            ];
        }

        return $out;
    }
}
