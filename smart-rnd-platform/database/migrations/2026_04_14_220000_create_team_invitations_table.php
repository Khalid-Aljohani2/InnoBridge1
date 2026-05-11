<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('invited_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invited_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'rejected', 'cancelled'])->default('pending');
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'invited_user_id']);
            $table->index(['invited_user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_invitations');
    }
};

