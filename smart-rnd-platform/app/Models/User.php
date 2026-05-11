<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // الحقول المسموح إدخالها عند التسجيل
    protected $fillable = [
        'name', 'email', 'password', 'is_active', 'role', 'preferred_language', 'preferred_theme', 'department', 'university_id'
    ];

    // إخفاء كلمة المرور عند إرسال البيانات للواجهة الأمامية
    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // العلاقة: المستخدم ينتمي لجامعة (قد تكون null للشركات)
    public function university()
    {
        return $this->belongsTo(University::class);
    }

    // العلاقة: إذا كان طالباً، يمكنه قيادة فرق
    public function ledTeams()
    {
        return $this->hasMany(Team::class, 'leader_id');
    }

    // العلاقة: إذا كان مشرفاً، يمكنه الإشراف على فرق
    public function supervisedTeams()
    {
        return $this->hasMany(Team::class, 'supervisor_id');
    }

    public function ownedProjects()
    {
        return $this->hasMany(Project::class, 'owner_user_id');
    }

    public function teamMemberships()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class, 'submitted_by_user_id');
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'evaluator_user_id');
    }

    public function proposals()
    {
        return $this->hasMany(Proposal::class, 'student_user_id');
    }

    public function reviewedProposals()
    {
        return $this->hasMany(Proposal::class, 'reviewed_by_user_id');
    }

    public function industryChallenges()
    {
        return $this->hasMany(IndustryChallenge::class, 'posted_by_user_id');
    }

    public function supervisorGroups()
    {
        return $this->hasMany(SupervisorGroup::class, 'supervisor_id');
    }

    public function receivedNotifications()
    {
        return $this->hasMany(StudentNotification::class, 'student_id');
    }

    public function sentNotifications()
    {
        return $this->hasMany(StudentNotification::class, 'supervisor_id');
    }

    public function groupMessages()
    {
        return $this->hasMany(SupervisorGroupMessage::class, 'sender_id');
    }

    public function coAdminGroups()
    {
        return $this->belongsToMany(SupervisorGroup::class, 'supervisor_group_admins', 'user_id', 'supervisor_group_id');
    }

    public function milestoneTemplates()
    {
        return $this->hasMany(SupervisorMilestone::class, 'supervisor_id');
    }

    public function milestonePlans()
    {
        return $this->hasMany(SupervisorMilestonePlan::class, 'supervisor_id');
    }
}