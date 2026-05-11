<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('submissions')->cascadeOnDelete();
            $table->foreignId('evaluator_user_id')->constrained('users')->restrictOnDelete();
            $table->unsignedTinyInteger('score')->nullable();
            $table->text('feedback')->nullable();
            $table->enum('decision', ['approved', 'rejected', 'needs_revision'])->nullable();
            $table->timestamp('evaluated_at')->nullable();
            $table->timestamps();

            $table->index(['evaluator_user_id', 'decision']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
