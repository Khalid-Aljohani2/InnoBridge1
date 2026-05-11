<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // DB-level default only; business rules (2-4) are enforced in services.
            $table->unsignedTinyInteger('max_members')->default(4)->change();
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->unsignedTinyInteger('max_members')->default(5)->change();
        });
    }
};

