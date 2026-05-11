<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            $table->string('review_status')->default('pending_action')->after('current_milestone');
        });
    }

    public function down(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            $table->dropColumn('review_status');
        });
    }
};
