<?php

namespace App\Services;

use App\Models\IndustryChallenge;
use App\Models\SupervisorGroup;
use App\Models\SupervisorMilestone;
use App\Models\SupervisorMilestonePlan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MilestonePlanService
{
    /**
     * Build milestone options for a specific student based on assigned/active plan.
     */
    public function supervisorMilestoneOptions($user, ?int $studentId = null): array
    {
        $planId = $this->resolvePlanIdForStudent($user, $studentId);
        if (! $planId) {
            return collect($this->milestoneMap())
                ->map(fn ($item, $key) => [
                    'id' => "default:{$key}",
                    'label' => $item['label'],
                    'progress' => (int) $item['progress'],
                    'submission_title' => null,
                    'deadline' => null,
                ])->values()->all();
        }

        $templates = SupervisorMilestone::where('supervisor_id', $user->id)
            ->where('plan_id', $planId)
            ->orderBy('sort_order')
            ->get();
        $running = 0;

        return $templates->map(function ($template) use (&$running) {
            $running += (int) $template->increment_percent;
            return [
                'id' => (string) $template->id,
                'label' => $template->title,
                'progress' => min(100, $running),
                'increment_percent' => (int) $template->increment_percent,
                'sort_order' => (int) $template->sort_order,
                'submission_title' => $template->submission_title,
                'deadline' => optional($template->deadline)->toDateString(),
                'plan_id' => (int) $template->plan_id,
            ];
        })->values()->all();
    }

    /**
     * Resolve the selected milestone option or fallback to first available option.
     */
    public function resolveMilestoneBySelection($user, ?int $studentId, ?string $selectedId): array
    {
        $options = $this->supervisorMilestoneOptions($user, $studentId);
        if (count($options) === 0) {
            return ['label' => 'اختيار الفكرة', 'progress' => 10];
        }
        if (! $selectedId) {
            return $options[0];
        }
        foreach ($options as $option) {
            if ((string) $option['id'] === (string) $selectedId) {
                return $option;
            }
        }

        return $options[0];
    }

    /**
     * Validate that adding/updating a milestone does not push plan total above 100%.
     */
    public function ensureMilestoneTotalNotOver100(int $supervisorId, int $planId, int $incomingPercent, ?int $excludingId = null): ?string
    {
        $query = SupervisorMilestone::where('supervisor_id', $supervisorId)
            ->where('plan_id', $planId);
        if ($excludingId) {
            $query->where('id', '!=', $excludingId);
        }
        $currentTotal = (int) $query->sum('increment_percent');
        if ($currentTotal + $incomingPercent > 100) {
            return 'مجموع نسب المراحل لا يمكن أن يتجاوز 100%.';
        }

        return null;
    }

    /**
     * Check if a user can manage a milestone plan.
     */
    public function userCanManagePlan($user, ?int $planId): bool
    {
        if (! $planId) {
            return false;
        }
        $plan = SupervisorMilestonePlan::find($planId);
        if (! $plan) {
            return false;
        }
        if ((int) $plan->supervisor_id !== (int) $user->id) {
            return false;
        }
        if (! $plan->supervisor_group_id) {
            return true;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return SupervisorGroup::whereKey($plan->supervisor_group_id)
            ->where(function ($q) use ($user) {
                $q->where('supervisor_id', $user->id)
                    ->orWhereHas('admins', fn ($adminQ) => $adminQ->where('user_id', $user->id));
            })->exists();
    }

    /**
     * Build the milestone path shown to students for their current project.
     */
    public function planMilestonesForStudentView(IndustryChallenge $challenge): array
    {
        if (! $challenge->milestone_plan_id) {
            return collect($this->milestoneMap())
                ->map(fn ($item, $key) => [
                    'id' => "default:{$key}",
                    'label' => $item['label'],
                    'progress' => (int) $item['progress'],
                    'submission_title' => null,
                    'deadline' => null,
                ])->values()->all();
        }

        $rows = SupervisorMilestone::where('plan_id', $challenge->milestone_plan_id)
            ->orderBy('sort_order')
            ->get();
        $running = 0;
        return $rows->map(function ($m) use (&$running) {
            $running += (int) $m->increment_percent;
            return [
                'id' => (string) $m->id,
                'label' => $m->title,
                'progress' => min(100, $running),
                'submission_title' => $m->submission_title,
                'deadline' => optional($m->deadline)->toDateString(),
            ];
        })->values()->all();
    }

    /**
     * Check if supervisor/co-admin can access a specific group.
     */
    public function canSupervisorAccessGroup($user, int $groupId): bool
    {
        return SupervisorGroup::where('id', $groupId)
            ->where(function ($q) use ($user) {
                $q->where('supervisor_id', $user->id)
                    ->orWhereHas('admins', fn ($adminQ) => $adminQ->where('user_id', $user->id));
            })->exists();
    }

    /**
     * Synchronize milestone rows for a plan (upsert + remove missing rows).
     */
    public function syncPlanRows(int $supervisorId, SupervisorMilestonePlan $plan, array $rows): void
    {
        $keepIds = [];
        $existingById = SupervisorMilestone::where('supervisor_id', $supervisorId)
            ->where('plan_id', $plan->id)
            ->get()
            ->keyBy('id');

        foreach ($rows as $row) {
            $rowId = is_numeric($row['id'] ?? null) ? (int) $row['id'] : null;
            $payload = [
                'supervisor_id' => $supervisorId,
                'plan_id' => $plan->id,
                'supervisor_group_id' => $plan->supervisor_group_id,
                'title' => trim((string) $row['title']),
                'submission_title' => trim((string) $row['submission_title']),
                'deadline' => $row['deadline'] ?? null,
                'increment_percent' => (int) $row['increment_percent'],
                'sort_order' => (int) $row['sort_order'],
            ];

            if ($rowId && $existingById->has($rowId)) {
                $existingById[$rowId]->update($payload);
                $keepIds[] = $rowId;
            } else {
                $created = SupervisorMilestone::create($payload);
                $keepIds[] = $created->id;
            }
        }

        SupervisorMilestone::where('supervisor_id', $supervisorId)
            ->where('plan_id', $plan->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }

    /**
     * Create a new milestone plan.
     */
    public function createMilestonePlan($user, array $validated): array
    {
        if (! in_array($user->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $groupId = $validated['supervisor_group_id'] ?? null;
        if ($groupId && $user->role === 'supervisor' && ! $this->canSupervisorAccessGroup($user, (int) $groupId)) {
            return ['ok' => false, 'message' => 'لا تملك صلاحية هذه المجموعة.'];
        }

        SupervisorMilestonePlan::create([
            'supervisor_id' => $user->id,
            'supervisor_group_id' => $groupId,
            'name' => trim((string) $validated['name']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return ['ok' => true, 'message' => 'تم إنشاء خطة مراحل جديدة بنجاح.'];
    }

    /**
     * Update an existing milestone plan.
     */
    public function updateMilestonePlan($user, SupervisorMilestonePlan $plan, array $validated): array
    {
        if ((int) $plan->supervisor_id !== (int) $user->id) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $plan->update([
            'name' => trim((string) $validated['name']),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return ['ok' => true, 'message' => 'تم تحديث خطة المراحل.'];
    }

    /**
     * Delete an existing milestone plan.
     */
    public function deleteMilestonePlan($user, SupervisorMilestonePlan $plan): array
    {
        if ((int) $plan->supervisor_id !== (int) $user->id) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $plan->delete();

        return ['ok' => true, 'message' => 'تم حذف خطة المراحل.'];
    }

    /**
     * Create a milestone template row for a plan.
     */
    public function createMilestoneTemplate($user, array $validated): array
    {
        if (! in_array($user->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $planId = (int) $validated['plan_id'];
        if (! $this->userCanManagePlan($user, $planId)) {
            return ['ok' => false, 'message' => 'لا تملك صلاحية هذه الخطة.'];
        }

        $plan = SupervisorMilestonePlan::findOrFail($planId);
        $totalError = $this->ensureMilestoneTotalNotOver100((int) $user->id, $planId, (int) $validated['increment_percent']);
        if ($totalError) {
            return ['ok' => false, 'message' => $totalError];
        }

        $nextOrder = (int) SupervisorMilestone::where('supervisor_id', $user->id)
            ->where('plan_id', $planId)
            ->max('sort_order') + 1;

        SupervisorMilestone::create([
            'supervisor_id' => $user->id,
            'plan_id' => $planId,
            'supervisor_group_id' => $plan->supervisor_group_id,
            'title' => trim((string) $validated['title']),
            'submission_title' => trim((string) $validated['submission_title']),
            'deadline' => $validated['deadline'] ?? null,
            'increment_percent' => (int) $validated['increment_percent'],
            'sort_order' => $nextOrder,
        ]);

        return ['ok' => true, 'message' => 'تم إضافة مرحلة جديدة بنجاح.'];
    }

    /**
     * Update a milestone template row.
     */
    public function updateMilestoneTemplate($user, SupervisorMilestone $milestone, array $validated): array
    {
        if (! in_array($user->role, ['supervisor', 'admin'], true) || (int) $milestone->supervisor_id !== (int) $user->id) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $planId = (int) $validated['plan_id'];
        if (! $this->userCanManagePlan($user, $planId)) {
            return ['ok' => false, 'message' => 'لا تملك صلاحية هذه الخطة.'];
        }

        $plan = SupervisorMilestonePlan::findOrFail($planId);
        $totalError = $this->ensureMilestoneTotalNotOver100(
            (int) $user->id,
            $planId,
            (int) $validated['increment_percent'],
            (int) $milestone->id
        );
        if ($totalError) {
            return ['ok' => false, 'message' => $totalError];
        }

        $milestone->update([
            'plan_id' => $planId,
            'supervisor_group_id' => $plan->supervisor_group_id,
            'title' => trim((string) $validated['title']),
            'submission_title' => trim((string) $validated['submission_title']),
            'deadline' => $validated['deadline'] ?? null,
            'increment_percent' => (int) $validated['increment_percent'],
            'sort_order' => isset($validated['sort_order']) ? (int) $validated['sort_order'] : $milestone->sort_order,
        ]);

        return ['ok' => true, 'message' => 'تم تحديث المرحلة بنجاح.'];
    }

    /**
     * Delete a milestone template row.
     */
    public function deleteMilestoneTemplate($user, SupervisorMilestone $milestone): array
    {
        if (! in_array($user->role, ['supervisor', 'admin'], true) || (int) $milestone->supervisor_id !== (int) $user->id) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $milestone->delete();

        return ['ok' => true, 'message' => 'تم حذف المرحلة بنجاح.'];
    }

    /**
     * Validate and persist all milestone rows for a plan.
     */
    public function syncMilestoneTemplates($user, SupervisorMilestonePlan $plan, array $rows): array
    {
        if (! in_array($user->role, ['supervisor', 'admin'], true) || (int) $plan->supervisor_id !== (int) $user->id) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $total = collect($rows)->sum(fn ($row) => (int) $row['increment_percent']);
        if ($total !== 100) {
            return ['ok' => false, 'message' => 'لا يمكن حفظ الخطة إلا إذا كان مجموع النسب يساوي 100% بالضبط.'];
        }

        DB::transaction(function () use ($user, $plan, $rows) {
            $this->syncPlanRows((int) $user->id, $plan, $rows);
        });

        return ['ok' => true, 'message' => 'تم حفظ كافة تغييرات المراحل بنجاح.'];
    }

    /**
     * Save a full plan bundle (plan metadata + milestone rows) in one transaction.
     */
    public function saveMilestonePlanBundle($user, array $validated): array
    {
        if (! in_array($user->role, ['supervisor', 'admin'], true)) {
            return ['ok' => false, 'message' => 'غير مصرح لك بهذا الإجراء.'];
        }

        $total = collect($validated['rows'])->sum(fn ($row) => (int) $row['increment_percent']);
        if ($total !== 100) {
            return ['ok' => false, 'message' => 'لا يمكن حفظ الخطة إلا إذا كان مجموع النسب يساوي 100% بالضبط.'];
        }

        $groupId = $validated['supervisor_group_id'] ?? null;
        if ($groupId && $user->role === 'supervisor' && ! $this->canSupervisorAccessGroup($user, (int) $groupId)) {
            return ['ok' => false, 'message' => 'لا تملك صلاحية هذه المجموعة.'];
        }

        DB::transaction(function () use ($validated, $user, $groupId) {
            $rawPlanId = $validated['plan_id'] ?? null;
            $planId = is_numeric($rawPlanId) ? (int) $rawPlanId : null;

            if ($planId) {
                $plan = SupervisorMilestonePlan::findOrFail($planId);
                if (! $this->userCanManagePlan($user, $plan->id)) {
                    abort(403, 'غير مصرح لك بهذا الإجراء.');
                }
                $plan->update([
                    'name' => trim((string) $validated['name']),
                    'supervisor_group_id' => $groupId,
                    'is_active' => (bool) ($validated['is_active'] ?? true),
                ]);
            } else {
                $plan = SupervisorMilestonePlan::create([
                    'supervisor_id' => $user->id,
                    'supervisor_group_id' => $groupId,
                    'name' => trim((string) $validated['name']),
                    'is_active' => (bool) ($validated['is_active'] ?? true),
                ]);
            }

            $this->syncPlanRows((int) $user->id, $plan, $validated['rows']);
        });

        return ['ok' => true, 'message' => 'تم حفظ الخطة والمراحل بنجاح.'];
    }

    private function milestoneMap(): array
    {
        return [
            'idea' => ['progress' => 10, 'label' => 'اختيار الفكرة'],
            'analysis' => ['progress' => 40, 'label' => 'تحليل النظام'],
            'implementation' => ['progress' => 70, 'label' => 'التنفيذ البرمجي'],
            'final' => ['progress' => 100, 'label' => 'الاعتماد النهائي'],
        ];
    }

    private function resolveGroupIdForStudent($user, ?int $studentId): ?int
    {
        if (! $studentId) {
            return null;
        }

        $query = SupervisorGroup::whereHas('members', fn ($q) => $q->where('student_id', $studentId));
        if ($user->role === 'supervisor') {
            $query->where(function ($q) use ($user) {
                $q->where('supervisor_id', $user->id)
                    ->orWhereHas('admins', fn ($adminQ) => $adminQ->where('user_id', $user->id));
            });
        }

        return optional($query->latest('id')->first())->id;
    }

    private function resolvePlanIdForStudent($user, ?int $studentId): ?int
    {
        if (! Schema::hasTable('supervisor_milestone_plans')) {
            return null;
        }

        $groupId = $this->resolveGroupIdForStudent($user, $studentId);

        $groupPlanId = SupervisorMilestonePlan::where('supervisor_id', $user->id)
            ->where('supervisor_group_id', $groupId)
            ->where('is_active', true)
            ->latest('id')
            ->value('id');
        if ($groupPlanId) {
            return (int) $groupPlanId;
        }

        $globalPlanId = SupervisorMilestonePlan::where('supervisor_id', $user->id)
            ->whereNull('supervisor_group_id')
            ->where('is_active', true)
            ->latest('id')
            ->value('id');
        if ($globalPlanId) {
            return (int) $globalPlanId;
        }

        return null;
    }
}
