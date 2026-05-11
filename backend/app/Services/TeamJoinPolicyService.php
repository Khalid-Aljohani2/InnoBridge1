<?php

namespace App\Services;

use App\Support\CachedSchema;
use Illuminate\Support\Facades\DB;

class TeamJoinPolicyService
{
    private const KEY = 'team_join_enabled';

    public function isEnabled(): bool
    {
        if (! CachedSchema::hasTable('system_settings')) {
            return true;
        }

        $value = DB::table('system_settings')->where('key', self::KEY)->value('value');
        if ($value === null) {
            return true;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    public function setEnabled(bool $enabled): void
    {
        if (! CachedSchema::hasTable('system_settings')) {
            return;
        }

        $now = now();
        DB::table('system_settings')->updateOrInsert(
            ['key' => self::KEY],
            [
                'value' => $enabled ? '1' : '0',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );
    }
}
