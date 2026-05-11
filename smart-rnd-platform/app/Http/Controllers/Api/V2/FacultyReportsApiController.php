<?php

namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Controller;
use App\Services\Modules\Reporting\StudentPerformanceReportService;
use Illuminate\Http\Request;

class FacultyReportsApiController extends Controller
{
    public function filters(Request $request, StudentPerformanceReportService $reports)
    {
        return response()->json([
            'status' => 'success',
            'data' => $reports->getFilterOptions($request->user()),
        ]);
    }

    public function preview(Request $request, StudentPerformanceReportService $reports)
    {
        $validated = $request->validate([
            'report_term_id' => 'required|integer|exists:report_terms,id',
            'report_subject_id' => 'nullable|integer|exists:report_subjects,id',
            'student_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $rows = $reports->buildRows(
            $request->user(),
            (int) $validated['report_term_id'],
            isset($validated['report_subject_id']) ? (int) $validated['report_subject_id'] : null,
            isset($validated['student_user_id']) ? (int) $validated['student_user_id'] : null,
        );

        return response()->json([
            'status' => 'success',
            'data' => $rows,
        ]);
    }

    public function export(Request $request, StudentPerformanceReportService $reports)
    {
        $validated = $request->validate([
            'format' => 'required|in:pdf,xlsx',
            'report_term_id' => 'required|integer|exists:report_terms,id',
            'report_subject_id' => 'nullable|integer|exists:report_subjects,id',
            'student_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $termId = (int) $validated['report_term_id'];
        $subjectId = isset($validated['report_subject_id']) ? (int) $validated['report_subject_id'] : null;
        $studentId = isset($validated['student_user_id']) ? (int) $validated['student_user_id'] : null;

        return $validated['format'] === 'pdf'
            ? $reports->downloadPdf($request->user(), $termId, $subjectId, $studentId)
            : $reports->downloadXlsx($request->user(), $termId, $subjectId, $studentId);
    }
}
