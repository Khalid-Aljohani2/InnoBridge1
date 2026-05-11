<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            if (! Schema::hasColumn('teams', 'review_status')) {
                $table->enum('review_status', ['pending', 'approved', 'rejected'])->default('pending')->after('is_active');
            }
            if (! Schema::hasColumn('teams', 'review_notes')) {
                $table->text('review_notes')->nullable()->after('review_status');
            }
            if (! Schema::hasColumn('teams', 'reviewed_by_user_id')) {
                $table->foreignId('reviewed_by_user_id')->nullable()->after('leader_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('teams', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('review_notes');
            }
            if (! Schema::hasColumn('teams', 'department')) {
                $table->string('department')->nullable()->after('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            if (Schema::hasColumn('teams', 'reviewed_by_user_id')) {
                $table->dropConstrainedForeignId('reviewed_by_user_id');
            }
            if (Schema::hasColumn('teams', 'review_status')) {
                $table->dropColumn('review_status');
            }
            if (Schema::hasColumn('teams', 'review_notes')) {
                $table->dropColumn('review_notes');
            }
            if (Schema::hasColumn('teams', 'reviewed_at')) {
                $table->dropColumn('reviewed_at');
            }
            if (Schema::hasColumn('teams', 'department')) {
                $table->dropColumn('department');
            }
        });
    }
};

