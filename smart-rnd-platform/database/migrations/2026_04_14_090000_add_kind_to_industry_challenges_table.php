<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            if (! Schema::hasColumn('industry_challenges', 'kind')) {
                $table->string('kind')->default('student_idea')->after('posted_by_user_id');
                $table->index(['kind', 'review_status'], 'industry_challenges_kind_review_status_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            if (Schema::hasColumn('industry_challenges', 'kind')) {
                $table->dropIndex('industry_challenges_kind_review_status_idx');
                $table->dropColumn('kind');
            }
        });
    }
};

