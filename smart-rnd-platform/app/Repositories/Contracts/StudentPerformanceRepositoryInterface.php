<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Support\Collection;

interface StudentPerformanceRepositoryInterface
{
    /**
     * @return list<int>
     */
    public function accessibleStudentIds(User $actor): array;

    /**
     * @return Collection<int, \App\Models\StudentPerformanceEntry>
     */
    public function queryEntriesForReport(User $actor, int $termId, ?int $subjectId, ?int $studentUserId): Collection;
}
