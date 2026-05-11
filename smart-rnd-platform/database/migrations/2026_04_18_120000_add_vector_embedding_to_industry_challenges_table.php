<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            if (! Schema::hasColumn('industry_challenges', 'vector_embedding')) {
                $table->json('vector_embedding')->nullable()->after('file_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            if (Schema::hasColumn('industry_challenges', 'vector_embedding')) {
                $table->dropColumn('vector_embedding');
            }
        });
    }
};
