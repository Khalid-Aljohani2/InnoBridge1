<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportTerm extends Model
{
    protected $fillable = ['code', 'name_ar', 'name_en', 'starts_on', 'ends_on'];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }

    public function performanceEntries(): HasMany
    {
        return $this->hasMany(StudentPerformanceEntry::class, 'report_term_id');
    }
}
