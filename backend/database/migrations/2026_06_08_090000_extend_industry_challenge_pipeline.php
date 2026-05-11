<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('challenge_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('challenge_requests', 'presented_to_company_at')) {
                $table->timestamp('presented_to_company_at')->nullable()->after('company_decided_at');
            }
            if (! Schema::hasColumn('challenge_requests', 'company_nominated_for_hod_at')) {
                $table->timestamp('company_nominated_for_hod_at')->nullable()->after('presented_to_company_at');
            }
            if (! Schema::hasColumn('challenge_requests', 'hod_nomination_status')) {
                $table->string('hod_nomination_status', 40)->nullable()->after('company_nominated_for_hod_at');
            }
            if (! Schema::hasColumn('challenge_requests', 'hod_nomination_notes')) {
                $table->text('hod_nomination_notes')->nullable()->after('hod_nomination_status');
            }
            if (! Schema::hasColumn('challenge_requests', 'hod_nomination_decided_at')) {
                $table->timestamp('hod_nomination_decided_at')->nullable()->after('hod_nomination_notes');
            }
            if (! Schema::hasColumn('challenge_requests', 'hod_nomination_template_key')) {
                $table->string('hod_nomination_template_key', 80)->nullable()->after('hod_nomination_decided_at');
            }
        });

        Schema::table('teams', function (Blueprint $table) {
            if (! Schema::hasColumn('teams', 'industry_project_id')) {
                $table->foreignId('industry_project_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('projects')
                    ->nullOnDelete();
            }
            if (! Schema::hasColumn('teams', 'supervisor_designated_workspace')) {
                $table->string('supervisor_designated_workspace', 20)->nullable()->after('industry_project_id');
                // nullable | 'student' | 'industry'
            }
        });

        if (Schema::hasTable('challenge_requests') && Schema::hasColumn('challenge_requests', 'company_status')) {
            DB::table('challenge_requests')->where('company_status', 'accepted')->update([
                'company_status' => 'finalized_won',
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            if (Schema::hasColumn('teams', 'supervisor_designated_workspace')) {
                $table->dropColumn('supervisor_designated_workspace');
            }
            if (Schema::hasColumn('teams', 'industry_project_id')) {
                $table->dropForeign(['industry_project_id']);
                $table->dropColumn('industry_project_id');
            }
        });

        Schema::table('challenge_requests', function (Blueprint $table) {
            foreach ([
                'hod_nomination_template_key',
                'hod_nomination_decided_at',
                'hod_nomination_notes',
                'hod_nomination_status',
                'company_nominated_for_hod_at',
                'presented_to_company_at',
            ] as $col) {
                if (Schema::hasColumn('challenge_requests', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        DB::table('challenge_requests')->where('company_status', 'finalized_won')->update([
            'company_status' => 'accepted',
        ]);
    }
};
