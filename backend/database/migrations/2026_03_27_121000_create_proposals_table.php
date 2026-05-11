<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('industry_challenge_id')->constrained('industry_challenges')->cascadeOnDelete();
            $table->foreignId('student_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('summary');
            $table->text('tech_stack')->nullable();
            $table->string('proposed_timeline')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'withdrawn'])->default('pending');
            $table->text('review_note')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('generated_project_id')->nullable()->unique()->constrained('projects')->nullOnDelete();
            $table->timestamps();

            $table->index(['industry_challenge_id', 'status']);
            $table->index(['student_user_id', 'status']);
            $table->unique(['industry_challenge_id', 'student_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
