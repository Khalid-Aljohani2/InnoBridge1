<?php

namespace App\Services;

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
use App\Models\Project;
use App\Models\User;
use App\Models\SupervisorGroup;
use App\Models\SupervisorGroupMember;
use Illuminate\Support\Facades\DB;

class TeamInvitationService
{
    public function inviteByIdentifier(User $actor, string $identifier): array
    {
        $identifier = trim($identifier);
        if ($actor->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($identifier === '') {
            return ['ok' => false, 'message' => 'Invalid identifier'];
        }

        $teamId = TeamMember::query()->where('user_id', $actor->id)->value('team_id');
        if (! $teamId) {
            return ['ok' => false, 'message' => 'Create a team first'];
        }

        $team = Team::withCount('members')->find((int) $teamId);
        if (! $team) {
            return ['ok' => false, 'message' => 'Team not found'];
        }

        if (($team->review_status ?? 'pending') === 'approved') {
            return ['ok' => false, 'message' => 'Team is approved and membership is locked'];
        }

        if ((int) $team->leader_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Only team leader can invite members'];
        }

        $member = null;
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $member = User::query()->where('email', $identifier)->first();
        } else {
            $member = User::query()->where('university_id', $identifier)->first();
        }

        if (! $member || $member->role !== 'student') {
            return ['ok' => false, 'message' => 'Student not found'];
        }
        if ((int) $member->id === (int) $actor->id) {
            return ['ok' => false, 'message' => 'You are already the leader'];
        }

        $alreadyHasTeam = TeamMember::where('user_id', $member->id)->exists();
        if ($alreadyHasTeam) {
            return ['ok' => false, 'message' => 'This student is already in a team'];
        }

        $max = (int) ($team->max_members ?? 4);
        if ((int) $team->members_count >= $max) {
            return ['ok' => false, 'message' => 'Team is full'];
        }

        $existing = TeamInvitation::where('team_id', $team->id)
            ->where('invited_user_id', $member->id)
            ->first();

        if ($existing && $existing->status === 'pending') {
            return ['ok' => false, 'message' => 'Invite already sent'];
        }

        TeamInvitation::updateOrCreate(
            ['team_id' => $team->id, 'invited_user_id' => $member->id],
            ['invited_by_user_id' => $actor->id, 'status' => 'pending', 'decided_at' => null, 'seen_at' => null]
        );

        return ['ok' => true, 'message' => 'Invitation sent'];
    }

    public function decideInvite(User $actor, TeamInvitation $invitation, string $decision): array
    {
        if ($actor->role !== 'student') {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ((int) $invitation->invited_user_id !== (int) $actor->id) {
            return ['ok' => false, 'message' => 'Forbidden'];
        }
        if ($invitation->status !== 'pending') {
            return ['ok' => false, 'message' => 'Invite already decided'];
        }

        $decision = $decision === 'accept' ? 'accepted' : 'rejected';

        return DB::transaction(function () use ($invitation, $decision, $actor) {
            $invitation = TeamInvitation::lockForUpdate()->findOrFail($invitation->id);
            if ($invitation->status !== 'pending') {
                return ['ok' => false, 'message' => 'Invite already decided'];
            }

            if ($decision === 'accepted') {
                // If the student created a solo draft team (not approved), allow switching by dismantling it before joining.
                $existingMembership = TeamMember::query()->where('user_id', $actor->id)->first();
                if ($existingMembership) {
                    $existingTeam = Team::withCount('members')->lockForUpdate()->find((int) $existingMembership->team_id);
                    if ($existingTeam && (int) $existingTeam->id !== (int) $invitation->team_id) {
                        $isSoloLeader = (int) $existingTeam->leader_id === (int) $actor->id
                            && (int) $existingTeam->members_count === 1
                            && (($existingTeam->review_status ?? 'pending') !== 'approved');

                        if ($isSoloLeader) {
                            $supervisorGroupId = (int) ($existingTeam->supervisor_group_id ?? 0);
                            $studentsGroupId = (int) ($existingTeam->students_group_id ?? 0);
                            if ($supervisorGroupId) {
                                SupervisorGroup::whereKey($supervisorGroupId)->delete();
                            }
                            if ($studentsGroupId) {
                                SupervisorGroup::whereKey($studentsGroupId)->delete();
                            }
                            $projectId = (int) ($existingTeam->project_id ?? 0);
                            $existingTeam->delete();
                            if ($projectId) {
                                Project::whereKey($projectId)->delete();
                            }
                        } else {
                            $invitation->update(['status' => 'rejected', 'decided_at' => now()]);
                            return ['ok' => false, 'message' => 'You are already in a team'];
                        }
                    }
                }

                $alreadyHasTeam = TeamMember::where('user_id', $actor->id)->exists();
                if ($alreadyHasTeam) {
                    $invitation->update(['status' => 'rejected', 'decided_at' => now()]);
                    return ['ok' => false, 'message' => 'You are already in a team'];
                }

                $team = Team::withCount('members')->lockForUpdate()->find((int) $invitation->team_id);
                if (! $team) {
                    $invitation->update(['status' => 'rejected', 'decided_at' => now()]);
                    return ['ok' => false, 'message' => 'Team not found'];
                }

                if (($team->review_status ?? 'pending') === 'approved') {
                    $invitation->update(['status' => 'rejected', 'decided_at' => now()]);
                    return ['ok' => false, 'message' => 'Team is approved and membership is locked'];
                }

                $max = (int) ($team->max_members ?? 4);
                if ((int) $team->members_count >= $max) {
                    $invitation->update(['status' => 'rejected', 'decided_at' => now()]);
                    return ['ok' => false, 'message' => 'Team is full'];
                }

                TeamMember::create([
                    'team_id' => $team->id,
                    'user_id' => $actor->id,
                    'role_in_team' => 'member',
                ]);

                // If team chats already exist, add the student to both.
                if ($team->supervisor_group_id) {
                    SupervisorGroupMember::firstOrCreate([
                        'supervisor_group_id' => (int) $team->supervisor_group_id,
                        'student_id' => (int) $actor->id,
                    ]);
                }
                if ($team->students_group_id) {
                    SupervisorGroupMember::firstOrCreate([
                        'supervisor_group_id' => (int) $team->students_group_id,
                        'student_id' => (int) $actor->id,
                    ]);
                }
            }

            $invitation->update(['status' => $decision, 'decided_at' => now()]);
            return ['ok' => true, 'message' => 'Decision saved'];
        });
    }

    public function pendingInvitesForStudent(User $student)
    {
        return TeamInvitation::query()
            ->with(['team:id,name,leader_id', 'team.leader:id,name,email', 'invitedBy:id,name,email'])
            ->where('invited_user_id', $student->id)
            ->where('status', 'pending')
            ->latest()
            ->get();
    }
}

