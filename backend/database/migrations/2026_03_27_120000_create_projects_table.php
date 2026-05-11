<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('abstract')->nullable();
            $table->enum('type', ['student_initiated', 'industry_sponsored'])->default('student_initiated');
            $table->foreignId('industry_challenge_id')->nullable()->constrained('industry_challenges')->nullOnDelete();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['draft', 'submitted', 'approved', 'in_progress', 'completed', 'archived'])->default('draft');
            $table->unsignedSmallInteger('current_progress')->default(0);
            $table->date('start_date')->nullable();
            $table->date('target_end_date')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
