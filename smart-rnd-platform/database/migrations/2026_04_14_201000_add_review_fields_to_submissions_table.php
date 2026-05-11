<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('submissions', 'review_notes')) {
                $table->text('review_notes')->nullable()->after('notes');
            }
            if (! Schema::hasColumn('submissions', 'reviewed_by_user_id')) {
                $table->foreignId('reviewed_by_user_id')->nullable()->after('submitted_by_user_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('submissions', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('submitted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            if (Schema::hasColumn('submissions', 'reviewed_by_user_id')) {
                $table->dropConstrainedForeignId('reviewed_by_user_id');
            }
            if (Schema::hasColumn('submissions', 'review_notes')) {
                $table->dropColumn('review_notes');
            }
            if (Schema::hasColumn('submissions', 'reviewed_at')) {
                $table->dropColumn('reviewed_at');
            }
        });
    }
};

