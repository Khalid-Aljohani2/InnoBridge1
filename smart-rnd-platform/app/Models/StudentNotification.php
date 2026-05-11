<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentNotification extends Model
{
    protected $fillable = [
        'supervisor_id',
        'student_id',
        'title',
        'message',
        'is_read',
        'sent_at',
    ];

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
