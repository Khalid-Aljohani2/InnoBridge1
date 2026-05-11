<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('challenge_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('industry_challenge_id')->constrained('industry_challenges')->cascadeOnDelete();

            $table->foreignId('requested_by_student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();

            // Supervisor decision (assigns challenge to team)
            $table->string('status')->default('pending'); // pending|approved|rejected
            $table->text('supervisor_notes')->nullable();
            $table->timestamp('decided_at')->nullable();

            // Company decision after receiving solution (optional)
            $table->string('company_status')->default('pending'); // pending|accepted|rejected
            $table->text('company_notes')->nullable();
            $table->timestamp('company_decided_at')->nullable();

            $table->timestamps();

            $table->index(['supervisor_id', 'status'], 'challenge_requests_supervisor_status_idx');
            $table->index(['team_id', 'status'], 'challenge_requests_team_status_idx');
            $table->index(['industry_challenge_id', 'status'], 'challenge_requests_challenge_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challenge_requests');
    }
};

