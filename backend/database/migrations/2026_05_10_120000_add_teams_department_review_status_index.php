<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('teams')) {
            return;
        }

        if (
            Schema::hasColumn('teams', 'department')
            && Schema::hasColumn('teams', 'review_status')
        ) {
            Schema::table('teams', function (Blueprint $table) {
                $table->index(
                    ['department', 'review_status'],
                    'teams_department_review_status_idx'
                );
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('teams')) {
            return;
        }

        Schema::table('teams', function (Blueprint $table) {
            try {
                $table->dropIndex('teams_department_review_status_idx');
            } catch (\Throwable) {
                //
            }
        });
    }
};
