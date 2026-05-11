<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_milestone_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_group_id')->nullable()->constrained('supervisor_groups')->nullOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('supervisor_milestones', function (Blueprint $table) {
            $table->foreignId('plan_id')->nullable()->after('supervisor_id')->constrained('supervisor_milestone_plans')->nullOnDelete();
        });

        // Migrate existing milestones into plans grouped by supervisor + scope.
        $rows = DB::table('supervisor_milestones')
            ->select('supervisor_id', 'supervisor_group_id')
            ->groupBy('supervisor_id', 'supervisor_group_id')
            ->get();

        foreach ($rows as $row) {
            $isGlobal = is_null($row->supervisor_group_id);
            $planName = $isGlobal ? 'General Plan' : 'Group Plan #'.$row->supervisor_group_id;
            $planId = DB::table('supervisor_milestone_plans')->insertGetId([
                'supervisor_id' => $row->supervisor_id,
                'supervisor_group_id' => $row->supervisor_group_id,
                'name' => $planName,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('supervisor_milestones')
                ->where('supervisor_id', $row->supervisor_id)
                ->where(function ($q) use ($row) {
                    if (is_null($row->supervisor_group_id)) {
                        $q->whereNull('supervisor_group_id');
                    } else {
                        $q->where('supervisor_group_id', $row->supervisor_group_id);
                    }
                })
                ->update(['plan_id' => $planId]);
        }
    }

    public function down(): void
    {
        Schema::table('supervisor_milestones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
        });

        Schema::dropIfExists('supervisor_milestone_plans');
    }
};
