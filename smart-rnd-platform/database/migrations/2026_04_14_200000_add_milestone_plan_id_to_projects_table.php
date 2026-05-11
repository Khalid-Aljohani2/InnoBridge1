<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('projects', 'milestone_plan_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->foreignId('milestone_plan_id')
                    ->nullable()
                    ->after('industry_challenge_id')
                    ->constrained('supervisor_milestone_plans')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('projects', 'milestone_plan_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropConstrainedForeignId('milestone_plan_id');
            });
        }
    }
};

