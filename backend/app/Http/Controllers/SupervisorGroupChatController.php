<?php

namespace App\Http\Controllers;

use App\Models\SupervisorGroup;
use App\Models\GroupChatNotification;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\GroupChatNotificationService;
use App\Services\GroupManagementService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupervisorGroupChatController extends Controller
{
    public function __construct(
        private readonly GroupChatNotificationService $groupChatNotificationService,
        private readonly GroupManagementService $groupManagementService,
    ) {}
    private function userGroupRole(SupervisorGroup $group, $user): string
    {
        if ($user->role === 'admin') {
            return 'admin';
        }

        if ($user->role === 'supervisor' && (int) $group->supervisor_id === (int) $user->id) {
            return 'admin';
        }

        if ($group->admins()->where('user_id', $user->id)->exists()) {
            return 'admin';
        }

        return 'member';
    }

    private function ensureGroupAccess(SupervisorGroup $group): void
    {
        $user = auth()->user();

        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'supervisor' && ($group->kind ?? 'with_supervisor') === 'students_only') {
            abort(403);
        }

        if ($user->role === 'supervisor' && (int) $group->supervisor_id === (int) $user->id) {
            return;
        }

        if ($group->admins()->where('user_id', $user->id)->exists()) {
            return;
        }

        if ($user->role === 'student' && $group->members()->where('student_id', $user->id)->exists()) {
            return;
        }

        abort(403);
    }

    private function ensureGroupAdmin(SupervisorGroup $group): void
    {
        $user = auth()->user();
        abort_unless($this->userGroupRole($group, $user) === 'admin', 403);
    }

    private function teamForGroup(SupervisorGroup $group): ?Team
    {
        return Team::query()
            ->where(function ($q) use ($group) {
                $q->where('supervisor_group_id', $group->id)
                    ->orWhere('students_group_id', $group->id);
            })
            ->first();
    }

    private function scopedStudentIdsForSupervisor(User $user): array
    {
        if ($user->role !== 'supervisor') {
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

    public function index()
    {
        $user = auth()->user();
        if ($user->role === 'supervisor') {
            $this->groupManagementService->repairMissingChatGroupsForSupervisorTeams($user);
        }

        $query = SupervisorGroup::query()
            ->with(['members.student:id,name', 'latestMessage.sender:id,name', 'admins.user:id,name'])
            ->withCount('members')
            ->latest();

        if ($user->role === 'supervisor') {
            $query->where(function ($q) use ($user) {
                $q->where('supervisor_id', $user->id)
                    ->orWhereHas('admins', fn ($adminQ) => $adminQ->where('user_id', $user->id));
            });
            $query->where('kind', '!=', 'students_only');
        } elseif ($user->role === 'student') {
            $query->whereHas('members', fn ($q) => $q->where('student_id', $user->id));
        } elseif ($user->role !== 'admin') {
            abort(403);
        }

        $groups = $query->get()->map(function ($group) use ($user) {
            $group->setAttribute('user_group_role', $this->userGroupRole($group, $user));
            return $group;
        });

        $assignedTeamCount = 0;
        if ($user->role === 'supervisor') {
            $assignedTeamCount = Team::query()->where('supervisor_id', $user->id)->count();
        }

        return Inertia::render('Supervisor/Groups', [
            'groups' => $groups,
            'assignedTeamCount' => $assignedTeamCount,
        ]);
    }

    public function show(SupervisorGroup $group)
    {
        $this->ensureGroupAccess($group);

        GroupChatNotification::query()
            ->where('user_id', auth()->id())
            ->where('supervisor_group_id', $group->id)
            ->where('is_read', 'false')
            ->update(['is_read' => true]);

        $group->load(['members.student:id,name', 'supervisor:id,name', 'admins.user:id,name']);
        $userGroupRole = $this->userGroupRole($group, auth()->user());
        $canManage = $userGroupRole === 'admin';
        $availableStudents = [];
        $availableSupervisors = [];
        $selectedAdminIds = [];
        if ($canManage) {
            $boundTeam = $this->teamForGroup($group);
            if ($boundTeam) {
                $teamStudentIds = TeamMember::query()
                    ->where('team_id', $boundTeam->id)
                    ->pluck('user_id')
                    ->map(fn ($id) => (int) $id)
                    ->values();

                $availableStudents = User::query()
                    ->whereIn('id', $teamStudentIds)
                    ->where('role', 'student')
                    ->orderBy('name')
                    ->get(['id', 'name']);
            } else {
                $availableStudents = User::query()
                    ->where('role', 'student')
                    ->orderBy('name')
                    ->get(['id', 'name']);
            }

            $availableSupervisors = User::query()
                ->whereIn('role', ['supervisor', 'admin'])
                ->orderBy('name')
                ->get(['id', 'name', 'role']);

            $selectedAdminIds = $group->admins->pluck('user_id')->map(fn ($id) => (int) $id)->values();
        }
        $messages = $group->messages()
            ->with('sender:id,name')
            ->latest()
            ->limit(200)
            ->get()
            ->reverse()
            ->values();

        return Inertia::render('Supervisor/GroupChat', [
            'group' => $group,
            'messages' => $messages,
            'userGroupRole' => $userGroupRole,
            'canManage' => $canManage,
            'availableStudents' => $availableStudents,
            'availableSupervisors' => $availableSupervisors,
            'selectedAdminIds' => $selectedAdminIds,
        ]);
    }

    public function store(Request $request, SupervisorGroup $group)
    {
        $this->ensureGroupAccess($group);

        $validated = $request->validate([
            'message' => 'required|string|max:3000',
        ]);

        $message = $group->messages()->create([
            'sender_id' => auth()->id(),
            'message' => trim($validated['message']),
        ]);

        $message->load('sender:id,name');
        $group->loadMissing(['members', 'admins']);
        $this->groupChatNotificationService->notifyParticipants($group, $message);

        return back()->with('success', 'تم إرسال الرسالة.');
    }

    public function update(Request $request, SupervisorGroup $group)
    {
        $this->ensureGroupAdmin($group);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ]);

        $group->update([
            'name' => trim($validated['name']),
            'description' => trim((string) ($validated['description'] ?? '')) ?: null,
        ]);

        return back()->with('success', 'تم تحديث بيانات القروب بنجاح.');
    }

    public function syncMembers(Request $request, SupervisorGroup $group)
    {
        $this->ensureGroupAdmin($group);

        $validated = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|integer|exists:users,id',
        ]);

        $requestedIds = collect($validated['student_ids'])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $validStudentIds = User::query()
            ->whereIn('id', $requestedIds)
            ->where('role', 'student')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        abort_unless($validStudentIds->count() > 0, 422, 'يجب اختيار طالب واحد على الأقل.');

        // If this chat belongs to a Team, only allow members from that Team.
        $boundTeam = $this->teamForGroup($group);
        if ($boundTeam) {
            $teamStudentIds = TeamMember::query()
                ->where('team_id', $boundTeam->id)
                ->pluck('user_id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all();

            $notInTeam = $validStudentIds->reject(fn ($id) => in_array((int) $id, $teamStudentIds, true));
            abort_unless($notInTeam->count() === 0, 422, 'لا يمكنك إضافة طلاب ليسوا ضمن نفس الفريق.');
        }

        $group->members()->whereNotIn('student_id', $validStudentIds)->delete();

        foreach ($validStudentIds as $studentId) {
            $group->members()->firstOrCreate(['student_id' => $studentId]);
        }

        return back()->with('success', 'تم تحديث أعضاء القروب بنجاح.');
    }

    public function destroy(SupervisorGroup $group)
    {
        $this->ensureGroupAdmin($group);
        $group->delete();

        return redirect()->route('supervisor.groups.index')
            ->with('success', 'تم حذف القروب بنجاح.');
    }

    public function syncAdmins(Request $request, SupervisorGroup $group)
    {
        $this->ensureGroupAdmin($group);

        $validated = $request->validate([
            'admin_user_ids' => 'nullable|array',
            'admin_user_ids.*' => 'required|integer|exists:users,id',
        ]);

        $requestedIds = collect($validated['admin_user_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->reject(fn ($id) => $id === (int) $group->supervisor_id)
            ->values();

        $validAdminIds = User::query()
            ->whereIn('id', $requestedIds)
            ->whereIn('role', ['supervisor', 'admin'])
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $group->admins()->whereNotIn('user_id', $validAdminIds)->delete();
        foreach ($validAdminIds as $adminId) {
            $group->admins()->firstOrCreate(['user_id' => $adminId]);
        }

        return back()->with('success', 'تم تحديث المشرفين المشاركين (Co-admins) بنجاح.');
    }
}
