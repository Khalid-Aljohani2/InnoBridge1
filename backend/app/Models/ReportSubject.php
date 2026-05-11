<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportSubject extends Model
{
    protected $fillable = ['code', 'name_ar', 'name_en'];

    public function performanceEntries(): HasMany
    {
        return $this->hasMany(StudentPerformanceEntry::class, 'report_subject_id');
    }
}
