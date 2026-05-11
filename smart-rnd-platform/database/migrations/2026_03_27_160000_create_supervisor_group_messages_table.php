<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_group_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_group_id')->constrained('supervisor_groups')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('message');
            $table->timestamps();

            $table->index(['supervisor_group_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_group_messages');
    }
};
