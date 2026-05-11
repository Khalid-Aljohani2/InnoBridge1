<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'company')
            ->update(['role' => 'industry']);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('role', 'industry')
            ->update(['role' => 'company']);
    }
};
