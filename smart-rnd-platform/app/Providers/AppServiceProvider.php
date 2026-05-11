<?php

namespace App\Providers;

use App\Contracts\AiReviewServiceInterface;
use App\Contracts\DocumentTextExtractorInterface;
use App\Repositories\Contracts\StudentPerformanceRepositoryInterface;
use App\Repositories\Contracts\SupervisorTimelineRepositoryInterface;
use App\Repositories\StudentPerformanceRepository;
use App\Repositories\SupervisorTimelineRepository;
use App\Services\AiReviewService;
use App\Services\AiSimilarityService;
use App\Services\DocumentTextExtractor;
use App\Services\Modules\Reporting\OpenSpoutStudentReportWriter;
use App\Services\Modules\Reporting\StudentPerformanceReportService;
use App\Services\Modules\Reporting\TcpdfArabicStudentReportWriter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AiReviewServiceInterface::class, AiReviewService::class);
        $this->app->bind(DocumentTextExtractorInterface::class, DocumentTextExtractor::class);
        $this->app->singleton(AiSimilarityService::class, AiSimilarityService::class);

        $this->app->bind(StudentPerformanceRepositoryInterface::class, StudentPerformanceRepository::class);
        $this->app->bind(SupervisorTimelineRepositoryInterface::class, SupervisorTimelineRepository::class);
        $this->app->singleton(TcpdfArabicStudentReportWriter::class);
        $this->app->singleton(OpenSpoutStudentReportWriter::class);
        $this->app->singleton(StudentPerformanceReportService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
