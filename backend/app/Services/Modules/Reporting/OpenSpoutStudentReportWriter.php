<?php

namespace App\Services\Modules\Reporting;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OpenSpoutStudentReportWriter
{
    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public function streamDownload(array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows) {
            $writer = new Writer;
            $writer->openToFile('php://output');

            $header = ['الطالب', 'الفصل الدراسي', 'المادة', 'الدرجة', 'نسبة الحضور', 'تطور المستوى (ع)', 'تطور المستوى (En)', 'ملاحظات'];
            $writer->addRow(Row::fromValues($header));

            foreach ($rows as $r) {
                $writer->addRow(Row::fromValues([
                    (string) ($r['student_name'] ?? ''),
                    (string) ($r['term'] ?? ''),
                    (string) ($r['subject_ar'] ?? ''),
                    isset($r['grade']) ? (string) $r['grade'] : '',
                    isset($r['attendance_percentage']) ? (string) $r['attendance_percentage'] : '',
                    (string) ($r['academic_level_ar'] ?? ''),
                    (string) ($r['progression_en'] ?? ''),
                    (string) ($r['notes'] ?? ''),
                ]));
            }

            $writer->close();
        }, 'student-performance.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
