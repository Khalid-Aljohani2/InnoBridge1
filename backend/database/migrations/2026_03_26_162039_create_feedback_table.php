<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
    Schema::create('feedback', function (Blueprint $table) {
        $table->id();
        $table->foreignId('industry_challenge_id')->constrained()->onDelete('cascade');
        $table->text('comment'); // ملاحظة الدكتور
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
