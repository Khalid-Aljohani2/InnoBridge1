<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('industry_challenges', 'milestone_plan_id')) {
            Schema::table('industry_challenges', function (Blueprint $table) {
                $table->foreignId('milestone_plan_id')->nullable()->after('review_status')->constrained('supervisor_milestone_plans')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('industry_challenges', 'milestone_plan_id')) {
            Schema::table('industry_challenges', function (Blueprint $table) {
                $table->dropConstrainedForeignId('milestone_plan_id');
            });
        }
    }
};
