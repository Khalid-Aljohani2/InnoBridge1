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
    Schema::table('industry_challenges', function (Blueprint $table) {
        $table->integer('progress')->default(0); // نسبة التقدم من 0 إلى 100
        $table->string('current_milestone')->default('تقديم الفكرة'); // النص الظاهر فوق الشريط
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('industry_challenges', function (Blueprint $table) {
            $table->dropColumn(['progress', 'current_milestone']);
        });
    }
};
