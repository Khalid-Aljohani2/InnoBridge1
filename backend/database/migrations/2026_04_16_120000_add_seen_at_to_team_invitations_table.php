<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_invitations', function (Blueprint $table) {
            $table->timestamp('seen_at')->nullable()->after('decided_at');
            $table->index(['invited_user_id', 'seen_at']);
        });
    }

    public function down(): void
    {
        Schema::table('team_invitations', function (Blueprint $table) {
            $table->dropIndex(['invited_user_id', 'seen_at']);
            $table->dropColumn('seen_at');
        });
    }
};
