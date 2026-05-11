<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class VerifyDatabaseCommand extends Command
{
    protected $signature = 'app:verify-db';

    protected $description = 'Verify Laravel can reach the configured database (use after wiring Supabase / Postgres).';

    public function handle(): int
    {
        $conn = DB::connection();
        $name = $conn->getName();

        try {
            $conn->select('select 1 as probe');
            $driver = $conn->getDriverName();
            $config = $conn->getConfig();

            $host = (string) ($config['host'] ?? '—');
            if (! empty($config['url']) && is_string($config['url']) && preg_match('#@([^/:]+)#', $config['url'], $m)) {
                $host = $m[1];
            }

            $this->info("OK — connection [{$name}] driver [{$driver}] host [{$host}]");

            if ($driver === 'sqlite') {
                $dbPath = (string) ($config['database'] ?? '');
                $this->warn('Registrations and logins use this SQLite file — they will NOT appear in Supabase until DB_CONNECTION=pgsql (or your remote URL) points to Postgres.');
                $this->line('  SQLite path: '.($dbPath !== '' ? $dbPath : '(default database/database.sqlite)'));
            } else {
                $db = (string) ($config['database'] ?? '—');
                $this->line("  database: [{$db}]");
            }

            try {
                $userCount = (int) $conn->table('users')->count();
                $this->line("  public.users row count: {$userCount} (compare with Table Editor in the project Laravel actually uses)");
            } catch (\Throwable) {
                $this->comment('  (could not count users — migrations missing?)');
            }

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Database connection failed: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
