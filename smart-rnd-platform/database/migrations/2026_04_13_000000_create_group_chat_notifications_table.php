<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_chat_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supervisor_group_message_id')->nullable()->constrained('supervisor_group_messages')->nullOnDelete();
            $table->string('title');
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
            $table->index(['supervisor_group_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_chat_notifications');
    }
};
