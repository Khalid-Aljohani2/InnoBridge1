<?php

use App\Services\ChallengeWorkflowService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('industry_challenges')) {
            return;
        }

        Schema::table('industry_challenges', function (Blueprint $table) {
            if (! Schema::hasColumn('industry_challenges', 'published_to_students_at')) {
                $table->timestamp('published_to_students_at')->nullable()->after('current_milestone');
            }
        });

        $milestone = ChallengeWorkflowService::COMPANY_CHALLENGE_VISIBLE_TO_STUDENTS_MILESTONE;
        DB::table('industry_challenges')
            ->where('kind', 'company_challenge')
            ->where('review_status', 'approved')
            ->where('current_milestone', $milestone)
            ->whereNull('published_to_students_at')
            ->update(['published_to_students_at' => DB::raw('COALESCE(updated_at, created_at)')]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('industry_challenges')) {
            return;
        }

        Schema::table('industry_challenges', function (Blueprint $table) {
            if (Schema::hasColumn('industry_challenges', 'published_to_students_at')) {
                $table->dropColumn('published_to_students_at');
            }
        });
    }
};
