<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            if (! Schema::hasColumn('teams', 'supervisor_group_id')) {
                $table->foreignId('supervisor_group_id')->nullable()->after('supervisor_id')->constrained('supervisor_groups')->nullOnDelete();
            }
            if (! Schema::hasColumn('teams', 'students_group_id')) {
                $table->foreignId('students_group_id')->nullable()->after('supervisor_group_id')->constrained('supervisor_groups')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            if (Schema::hasColumn('teams', 'students_group_id')) {
                $table->dropConstrainedForeignId('students_group_id');
            }
            if (Schema::hasColumn('teams', 'supervisor_group_id')) {
                $table->dropConstrainedForeignId('supervisor_group_id');
            }
        });
    }
};

