<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    
    public function up(): void
{
    Schema::create('industry_challenges', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->text('description');
        $table->date('deadline')->nullable();
        $table->timestamp('posted_date')->useCurrent();
        // هذا السطر مهم جداً لربط التحدي بالشركة
        $table->foreignId('posted_by_user_id')->constrained('users')->onDelete('cascade');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('industry_challenges');
    }
};
