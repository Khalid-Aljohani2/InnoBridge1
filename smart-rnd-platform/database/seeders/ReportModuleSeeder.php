<?php

namespace Database\Seeders;

use App\Models\ReportSubject;
use App\Models\ReportTerm;
use App\Models\StudentPerformanceEntry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * Seeds optional demo data for the faculty reporting module (new tables only).
 */
class ReportModuleSeeder extends Seeder
{
    public function run(): void
    {
        if (! Schema::hasTable('report_terms') || ! Schema::hasTable('report_subjects')) {
            return;
        }

        $t1 = ReportTerm::query()->firstOrCreate(
            ['code' => '2026-1'],
            [
                'name_ar' => 'الفصل الدراسي الأول 2026',
                'name_en' => 'Term 1 — 2026',
                'starts_on' => '2026-01-01',
                'ends_on' => '2026-05-31',
            ]
        );

        $s1 = ReportSubject::query()->firstOrCreate(
            ['code' => 'GP-401'],
            [
                'name_ar' => 'مشروع التخرج',
                'name_en' => 'Graduation Project',
            ]
        );

        ReportSubject::query()->firstOrCreate(
            ['code' => 'RS-ALL'],
            [
                'name_ar' => 'جميع المواد (تجميعي)',
                'name_en' => 'All subjects (aggregate)',
            ]
        );

        $student = User::query()->where('role', 'student')->orderBy('id')->first();
        if ($student && Schema::hasTable('student_performance_entries')) {
            StudentPerformanceEntry::query()->firstOrCreate(
                [
                    'student_user_id' => $student->id,
                    'report_term_id' => $t1->id,
                    'report_subject_id' => $s1->id,
                ],
                [
                    'grade' => 88.5,
                    'attendance_percentage' => 92,
                    'academic_level_ar' => 'ممتاز — تقدم مطرد في المخرجات',
                    'academic_level_en' => 'Strong progression; deliverables on track',
                    'notes' => 'بيانات تجريبية لوحدة التقارير',
                ]
            );
        }
    }
}
