<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supervisor_milestones', function (Blueprint $table) {
            $table->foreignId('supervisor_group_id')->nullable()->after('supervisor_id')->constrained('supervisor_groups')->nullOnDelete();
            $table->string('submission_title')->nullable()->after('title');
            $table->date('deadline')->nullable()->after('submission_title');
        });
    }

    public function down(): void
    {
        Schema::table('supervisor_milestones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supervisor_group_id');
            $table->dropColumn(['submission_title', 'deadline']);
        });
    }
};
