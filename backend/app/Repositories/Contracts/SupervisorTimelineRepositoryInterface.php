<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface SupervisorTimelineRepositoryInterface
{
    /**
     * @return array{projects: list<array<string, mixed>>, tasks: list<array<string, mixed>>}
     */
    public function ganttPayloadFor(User $actor): array;
}
