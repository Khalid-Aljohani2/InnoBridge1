<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('supervisor_milestone_plans')) {
            Schema::create('supervisor_milestone_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('supervisor_group_id')->nullable()->constrained('supervisor_groups')->nullOnDelete();
                $table->string('name');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('supervisor_milestones') && !Schema::hasColumn('supervisor_milestones', 'plan_id')) {
            Schema::table('supervisor_milestones', function (Blueprint $table) {
                $table->foreignId('plan_id')->nullable()->after('supervisor_id')->constrained('supervisor_milestone_plans')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        // Safety migration: no destructive rollback.
    }
};
