<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('milestone_id')->constrained('milestones')->cascadeOnDelete();
            $table->foreignId('submitted_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->string('file_path');
            $table->unsignedInteger('version')->default(1);
            $table->enum('status', ['submitted', 'reviewed', 'needs_revision'])->default('submitted');
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['milestone_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
