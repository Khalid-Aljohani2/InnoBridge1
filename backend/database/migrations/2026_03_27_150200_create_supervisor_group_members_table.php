<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_group_id')->constrained('supervisor_groups')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['supervisor_group_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_group_members');
    }
};
