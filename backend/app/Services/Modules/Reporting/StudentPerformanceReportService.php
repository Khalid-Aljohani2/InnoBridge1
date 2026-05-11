<?php

namespace App\Services\Modules\Reporting;

use App\Models\ReportSubject;
use App\Models\ReportTerm;
use App\Models\User;
use App\Repositories\Contracts\StudentPerformanceRepositoryInterface;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentPerformanceReportService
{
    public function __construct(
        private readonly StudentPerformanceRepositoryInterface $performanceRepository,
        private readonly TcpdfArabicStudentReportWriter $pdfWriter,
        private readonly OpenSpoutStudentReportWriter $xlsxWriter,
    ) {}

    /**
     * Filter metadata for faculty export UI + API v2.
     *
     * @return array{terms: list<array<string, mixed>>, subjects: list<array<string, mixed>>, students: list<array<string, mixed>>}
     */
    public function getFilterOptions(User $actor): array
    {
        $terms = ReportTerm::query()->orderBy('starts_on')->get()->map(fn ($t) => [
            'id' => (int) $t->id,
            'code' => $t->code,
            'name_ar' => $t->name_ar,
            'name_en' => $t->name_en,
        ])->values()->all();

        $subjects = ReportSubject::query()->orderBy('code')->get()->map(fn ($s) => [
            'id' => (int) $s->id,
            'code' => $s->code,
            'name_ar' => $s->name_ar,
            'name_en' => $s->name_en,
        ])->values()->all();

        $ids = $this->performanceRepository->accessibleStudentIds($actor);
        $students = User::query()
            ->whereIn('id', $ids)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn ($u) => [
                'id' => (int) $u->id,
                'name' => $u->name,
                'email' => $u->email,
            ])->values()->all();

        return [
            'terms' => $terms,
            'subjects' => $subjects,
            'students' => $students,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function buildRows(User $actor, int $termId, ?int $subjectId, ?int $studentUserId): array
    {
        return $this->performanceRepository
            ->queryEntriesForReport($actor, $termId, $subjectId, $studentUserId)
            ->map(function ($row) {
                return [
                    'student_name' => $row->student?->name,
                    'student_email' => $row->student?->email,
                    'term' => $row->term?->name_ar,
                    'subject_ar' => $row->subject?->name_ar ?? '—',
                    'grade' => $row->grade,
                    'attendance_percentage' => $row->attendance_percentage,
                    'academic_level_ar' => $row->academic_level_ar,
                    'progression_en' => $row->academic_level_en,
                    'notes' => $row->notes,
                ];
            })
            ->values()
            ->all();
    }

    public function downloadPdf(User $actor, int $termId, ?int $subjectId, ?int $studentUserId): Response
    {
        $rows = $this->buildRows($actor, $termId, $subjectId, $studentUserId);
        $binary = $this->pdfWriter->render($rows);

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="student-performance-report.pdf"',
        ]);
    }

    public function downloadXlsx(User $actor, int $termId, ?int $subjectId, ?int $studentUserId): StreamedResponse
    {
        $rows = $this->buildRows($actor, $termId, $subjectId, $studentUserId);

        return $this->xlsxWriter->streamDownload($rows);
    }
}
