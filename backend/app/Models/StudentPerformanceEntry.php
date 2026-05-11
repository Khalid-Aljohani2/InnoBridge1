<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPerformanceEntry extends Model
{
    protected $fillable = [
        'student_user_id',
        'report_term_id',
        'report_subject_id',
        'grade',
        'attendance_percentage',
        'academic_level_ar',
        'academic_level_en',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'grade' => 'float',
            'attendance_percentage' => 'float',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_user_id');
    }

    public function term(): BelongsTo
    {
        return $this->belongsTo(ReportTerm::class, 'report_term_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(ReportSubject::class, 'report_subject_id');
    }
}
