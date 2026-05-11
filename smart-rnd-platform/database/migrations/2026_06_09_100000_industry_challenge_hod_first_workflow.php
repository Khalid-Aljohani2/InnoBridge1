<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('challenge_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('challenge_requests', 'hod_sent_to_company_at')) {
                $table->timestamp('hod_sent_to_company_at')->nullable()->after('company_nominated_for_hod_at');
            }
        });

        if (! Schema::hasTable('faculty_notifications')) {
            Schema::create('faculty_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recipient_user_id')->constrained('users')->cascadeOnDelete();
                $table->string('title');
                $table->text('message');
                $table->boolean('is_read')->default(false);
                $table->timestamps();

                $table->index(['recipient_user_id', 'is_read']);
            });
        }

        if (Schema::hasTable('challenge_requests') && Schema::hasColumn('challenge_requests', 'company_status')) {
            DB::table('challenge_requests')->where('company_status', 'awaiting_company')->update([
                'company_status' => 'awaiting_hod_nomination',
            ]);
            DB::table('challenge_requests')->where('company_status', 'hod_nomination_pending')->update([
                'company_status' => 'nominated_to_company',
            ]);
            DB::table('challenge_requests')->where('company_status', 'finalized_won')->update([
                'company_status' => 'accepted_by_company',
            ]);
            DB::table('challenge_requests')->whereIn('company_status', ['nominated_to_company'])->update([
                'hod_sent_to_company_at' => DB::raw('COALESCE(hod_sent_to_company_at, company_nominated_for_hod_at, updated_at)'),
            ]);

            DB::table('challenge_requests')
                ->whereIn('company_status', ['awaiting_hod_nomination', 'nominated_to_company', 'accepted_by_company', 'rejected_by_company'])
                ->update([
                    'hod_nomination_status' => null,
                    'hod_nomination_notes' => null,
                    'hod_nomination_decided_at' => null,
                    'hod_nomination_template_key' => null,
                ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('challenge_requests') && Schema::hasColumn('challenge_requests', 'company_status')) {
            DB::table('challenge_requests')->where('company_status', 'awaiting_hod_nomination')->update([
                'company_status' => 'awaiting_company',
            ]);
            DB::table('challenge_requests')->where('company_status', 'nominated_to_company')->update([
                'company_status' => 'hod_nomination_pending',
            ]);
            DB::table('challenge_requests')->where('company_status', 'accepted_by_company')->update([
                'company_status' => 'finalized_won',
            ]);
        }

        Schema::table('challenge_requests', function (Blueprint $table) {
            if (Schema::hasColumn('challenge_requests', 'hod_sent_to_company_at')) {
                $table->dropColumn('hod_sent_to_company_at');
            }
        });

        Schema::dropIfExists('faculty_notifications');
    }
};
