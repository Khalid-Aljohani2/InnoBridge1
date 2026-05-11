<?php

namespace App\Http\Controllers\Modules\Faculty;

use App\Http\Controllers\Controller;
use App\Services\Modules\Reporting\StudentPerformanceReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FacultyReportsWebController extends Controller
{
    public function index(Request $request, StudentPerformanceReportService $reports): Response
    {
        return Inertia::render('Modules/Faculty/ReportsExport', [
            'filters' => $reports->getFilterOptions($request->user()),
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
