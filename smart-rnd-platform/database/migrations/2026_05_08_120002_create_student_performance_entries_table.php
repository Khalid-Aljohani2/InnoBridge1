<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_performance_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('report_term_id')->constrained('report_terms')->cascadeOnDelete();
            $table->foreignId('report_subject_id')->nullable()->constrained('report_subjects')->nullOnDelete();
            $table->decimal('grade', 5, 2)->nullable();
            $table->decimal('attendance_percentage', 5, 2)->nullable();
            $table->string('academic_level_ar')->nullable();
            $table->string('academic_level_en')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['student_user_id', 'report_term_id', 'report_subject_id'], 'spe_student_term_subject_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_performance_entries');
    }
};
