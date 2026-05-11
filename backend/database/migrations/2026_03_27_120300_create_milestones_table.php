<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('weight')->default(0);
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'in_review', 'approved', 'rejected'])->default('pending');
            $table->unsignedSmallInteger('sequence')->default(1);
            $table->timestamps();

            $table->index(['project_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('milestones');
    }
};
