<?php

namespace App\Http\Controllers;

use App\Models\StudentNotification;
use App\Models\SupervisorGroup;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupervisorNotificationController extends Controller
{
    private function ensureSupervisor(): void
    {
        abort_unless(in_array(auth()->user()->role, ['supervisor', 'admin'], true), 403);
    }

    public function createGroup(Request $request)
    {
        $this->ensureSupervisor();

        return back()->with('error', 'Group creation is disabled. Groups are created automatically via team formation.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|integer|exists:users,id',
        ]);

        // Supervisors can only create groups for students in their assigned teams.
        if (auth()->user()->role === 'supervisor') {
            $allowedIds = TeamMember::query()
                ->join('teams', 'teams.id', '=', 'team_members.team_id')
                ->where('teams.supervisor_id', auth()->id())
                ->pluck('team_members.user_id')
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->values()
                ->all();

            $requested = collect($validated['student_ids'])->map(fn ($id) => (int) $id)->unique()->values();
            $notAllowed = $requested->reject(fn ($id) => in_array((int) $id, $allowedIds, true));
            abort_unless($notAllowed->count() === 0, 422, 'لا يمكنك إنشاء مجموعة إلا لطلاب ضمن فرقك المعينة.');
        }

        $group = SupervisorGroup::create([
            'supervisor_id' => auth()->id(),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        foreach ($validated['student_ids'] as $studentId) {
            $group->members()->create(['student_id' => $studentId]);
        }

        return back()->with('success', 'تم إنشاء المجموعة بنجاح.');
    }

    public function notifyStudent(Request $request)
    {
        $this->ensureSupervisor();

        $validated = $request->validate([
            'student_id' => 'required|integer|exists:users,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        StudentNotification::create([
            'supervisor_id' => auth()->id(),
            'student_id' => $validated['student_id'],
            'title' => $validated['title'],
            'message' => $validated['message'],
            'sent_at' => now(),
        ]);

        return back()->with('success', 'تم إرسال الإشعار للطالب بنجاح.');
    }

    public function notifyGroup(Request $request)
    {
        $this->ensureSupervisor();

        $validated = $request->validate([
            'group_id' => 'required|integer|exists:supervisor_groups,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $group = SupervisorGroup::with('members')->findOrFail($validated['group_id']);

        if (auth()->user()->role !== 'admin' && (int) $group->supervisor_id !== (int) auth()->id()) {
            return back()->with('error', 'غير مصرح لك بالإرسال لهذه المجموعة.');
        }

        foreach ($group->members as $member) {
            StudentNotification::create([
                'supervisor_id' => auth()->id(),
                'student_id' => $member->student_id,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'sent_at' => now(),
            ]);
        }

        return back()->with('success', 'تم إرسال الإشعار الجماعي بنجاح.');
    }

    public function index()
    {
        $this->ensureSupervisor();

        $notifications = StudentNotification::with('student:id,name')
            ->where('supervisor_id', auth()->id())
            ->latest()
            ->limit(100)
            ->get();

        return Inertia::render('Supervisor/Notifications', [
            'notifications' => $notifications,
        ]);
    }
}
