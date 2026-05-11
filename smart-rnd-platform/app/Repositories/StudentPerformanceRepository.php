<?php

namespace App\Repositories;

use App\Models\StudentPerformanceEntry;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Repositories\Contracts\StudentPerformanceRepositoryInterface;
use Illuminate\Support\Collection;

class StudentPerformanceRepository implements StudentPerformanceRepositoryInterface
{
    /**
     * @return list<int>
     */
    public function accessibleStudentIds(User $actor): array
    {
        if ($actor->role === 'admin') {
            return User::query()->where('role', 'student')->pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        if ($actor->role === 'supervisor') {
            $teamIds = Team::query()->where('supervisor_id', $actor->id)->pluck('id');
            $fromMembers = TeamMember::query()->whereIn('team_id', $teamIds)->pluck('user_id');
            $leaders = Team::query()->whereIn('id', $teamIds)->pluck('leader_id');

            return $fromMembers->merge($leaders)->unique()->filter()->map(fn ($id) => (int) $id)->values()->all();
        }

        if ($actor->role === 'hod') {
            if (empty($actor->department)) {
                return [];
            }
            $teamIds = Team::query()->where('department', $actor->department)->pluck('id');
            $fromMembers = TeamMember::query()->whereIn('team_id', $teamIds)->pluck('user_id');
            $leaders = Team::query()->whereIn('id', $teamIds)->pluck('leader_id');

            return $fromMembers->merge($leaders)->unique()->filter()->map(fn ($id) => (int) $id)->values()->all();
        }

        return [];
    }

    public function queryEntriesForReport(User $actor, int $termId, ?int $subjectId, ?int $studentUserId): Collection
    {
        $allowed = $this->accessibleStudentIds($actor);
        if ($allowed === []) {
            return collect();
        }

        $q = StudentPerformanceEntry::query()
            ->with(['student:id,name,email', 'term', 'subject'])
            ->where('report_term_id', $termId)
            ->whereIn('student_user_id', $allowed);

        if ($subjectId) {
            $q->where('report_subject_id', $subjectId);
        }

        if ($studentUserId) {
            if (! in_array($studentUserId, $allowed, true)) {
                return collect();
            }
            $q->where('student_user_id', $studentUserId);
        }

        return $q->orderBy('student_user_id')->orderBy('report_subject_id')->get();
    }
}
