<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('name');
            $table->foreignId('leader_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('max_members')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
