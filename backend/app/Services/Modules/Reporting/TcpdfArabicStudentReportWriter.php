<?php

namespace App\Services\Modules\Reporting;

class TcpdfArabicStudentReportWriter
{
    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public function render(array $rows): string
    {
        $pdf = new \TCPDF('L', PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        $pdf->setRTL(true);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->SetMargins(12, 12, 12);
        $pdf->AddPage();
        $pdf->SetFont('aealarabiya', '', 13);
        $pdf->WriteHTML('<h2 style="text-align:center;">تقارير أداء الطلاب</h2>', true, false, true, false, '');
        $pdf->Ln(4);
        $pdf->SetFont('aealarabiya', '', 10);

        $html = '<table border="1" cellpadding="4" cellspacing="0" width="100%"><thead><tr style="background-color:#0B2447;color:#fff;">'
            .'<th>الطالب</th><th>الفصل</th><th>المادة</th><th>الدرجة</th><th>الحضور %</th><th>المستوى الدراسي</th><th>ملاحظات</th>'
            .'</tr></thead><tbody>';

        foreach ($rows as $r) {
            $html .= '<tr>'
                .'<td>'.e((string) ($r['student_name'] ?? '')).'</td>'
                .'<td>'.e((string) ($r['term'] ?? '')).'</td>'
                .'<td>'.e((string) ($r['subject_ar'] ?? '')).'</td>'
                .'<td>'.e((string) ($r['grade'] ?? '—')).'</td>'
                .'<td>'.e((string) ($r['attendance_percentage'] ?? '—')).'</td>'
                .'<td>'.e((string) ($r['academic_level_ar'] ?? '—')).'</td>'
                .'<td>'.e((string) ($r['notes'] ?? '')).'</td>'
                .'</tr>';
        }

        if ($rows === []) {
            $html .= '<tr><td colspan="7" style="text-align:center;">لا توجد بيانات مطابقة للمرشحات</td></tr>';
        }

        $html .= '</tbody></table>';

        $pdf->writeHTML($html, true, false, true, false, '');

        return $pdf->Output('', 'S');
    }
}
