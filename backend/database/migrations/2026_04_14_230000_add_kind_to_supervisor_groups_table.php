<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supervisor_groups', function (Blueprint $table) {
            if (! Schema::hasColumn('supervisor_groups', 'kind')) {
                $table->enum('kind', ['with_supervisor', 'students_only'])->default('with_supervisor')->after('description');
                $table->index(['supervisor_id', 'kind']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('supervisor_groups', function (Blueprint $table) {
            if (Schema::hasColumn('supervisor_groups', 'kind')) {
                $table->dropIndex(['supervisor_id', 'kind']);
                $table->dropColumn('kind');
            }
        });
    }
};

