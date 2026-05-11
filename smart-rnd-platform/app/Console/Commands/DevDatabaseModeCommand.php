<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

/**
 * Toggle between local SQLite (fast UX) and the DB settings saved before first switching (e.g. Supabase Postgres).
 */
class DevDatabaseModeCommand extends Command
{
    protected $signature = 'dev:db
        {mode : fast (= sqlite file on disk) or remote (= restore previous .env snapshot)}
        {--seed : After switching to SQLite, run db:seed (creates demo logins)}';

    protected $description = 'Switch .env DB to fast local SQLite or restore the Postgres/remote snapshot.';

    private function snapshotPath(): string
    {
        return storage_path('app/private/dev-env-remote-snapshot.env');
    }

    public function handle(): int
    {
        $mode = strtolower(trim((string) $this->argument('mode')));
        if (! in_array($mode, ['fast', 'remote'], true)) {
            $this->error('Use: php artisan dev:db fast   OR   php artisan dev:db remote');

            return self::FAILURE;
        }

        return $mode === 'fast' ? $this->goFast() : $this->goRemote();
    }

    private function goFast(): int
    {
        $envPath = base_path('.env');
        if (! File::isFile($envPath)) {
            $this->error('Missing .env — copy .env.example first.');

            return self::FAILURE;
        }

        $snap = $this->snapshotPath();
        if (! File::isFile($snap)) {
            File::ensureDirectoryExists(dirname($snap));
            File::copy($envPath, $snap);
            $this->info('Saved remote DB snapshot to storage (first time only).');
        }

        $sqlitePath = database_path('dev-fast.sqlite');
        File::ensureDirectoryExists(dirname($sqlitePath));
        if (! File::exists($sqlitePath)) {
            File::put($sqlitePath, '');
        }

        $dbEnv = $this->quotedSqlitePathForEnv($sqlitePath);
        $contents = File::get($envPath);
        $contents = self::rewriteEnvDbBlock($contents, $dbEnv);
        File::put($envPath, $contents);

        Artisan::call('config:clear');
        Artisan::call('cache:clear');

        Artisan::call('migrate', ['--force' => true]);
        $this->line(trim(Artisan::output()));

        if ($this->option('seed')) {
            Artisan::call('db:seed', ['--force' => true]);
            $this->line(trim(Artisan::output()));
            $this->info('Demo data seeded (password for factory users defaults to «password» unless changed).');
        } else {
            $this->comment('Tip: create demo accounts with: php artisan db:seed');
        }

        $this->info('Done. DB is now local SQLite at database/dev-fast.sqlite (fast browsing).');
        $this->comment('Important: Refresh the browser — your old Postgres session cannot map to SQLite users.');
        $this->comment('Restore Supabase/Postgres: php artisan dev:db remote');

        return self::SUCCESS;
    }

    private function goRemote(): int
    {
        $snap = $this->snapshotPath();
        if (! File::isFile($snap)) {
            $this->error('No snapshot found. Run `php artisan dev:db fast` once while on remote Postgres first.');

            return self::FAILURE;
        }

        File::copy($snap, base_path('.env'));
        Artisan::call('config:clear');
        Artisan::call('cache:clear');

        $this->info('Restored .env from snapshot. You are back on remote Postgres settings.');
        $this->comment('If connection fails, verify network / Supabase credentials in .env.');

        return self::SUCCESS;
    }

    /**
     * Quoted DB_DATABASE value safe for paths with spaces/slashes cross-platform.
     */
    private function quotedSqlitePathForEnv(string $absoluteSqlitePath): string
    {
        $normalized = str_replace('\\', '/', $absoluteSqlitePath);

        return '"'.$normalized.'"';
    }

    /**
     * Replace or insert DB_* section for SQLite; comment out usual remote keys so drivers stay unambiguous.
     */
    private static function rewriteEnvDbBlock(string $envContents, string $dbDatabaseSqliteQuoted): string
    {
        $lines = preg_split("/\r\n|\n|\r/", $envContents);
        $out = [];

        foreach ($lines as $line) {
            if (self::isRemoteDbKeyLine($line)) {
                $trim = ltrim($line);
                if (! str_starts_with($trim, '#')) {
                    $out[] = '# '.$trim.' # dev:db fast';

                    continue;
                }
            }
            $out[] = $line;
        }

        $text = implode("\n", $out);

        if (preg_match('/^DB_CONNECTION=/m', $text)) {
            $text = preg_replace('/^DB_CONNECTION=.*/m', 'DB_CONNECTION=sqlite', $text);
        } else {
            $text = rtrim($text)."\nDB_CONNECTION=sqlite\n";
        }

        if (preg_match('/^DB_DATABASE=/m', $text)) {
            $text = preg_replace('/^DB_DATABASE=.*/m', 'DB_DATABASE='.$dbDatabaseSqliteQuoted, $text);
        } else {
            $text = rtrim($text)."\nDB_DATABASE=".$dbDatabaseSqliteQuoted."\n";
        }

        if (preg_match('/^DB_URL=/m', $text)) {
            $text = preg_replace('/^DB_URL=.*/m', '# DB_URL= # dev:db fast (unused for sqlite)', $text);
        }

        return rtrim($text)."\n";
    }

    private static function isRemoteDbKeyLine(string $line): bool
    {
        if (! preg_match('/^\s*([A-Za-z_][A-Za-z0-9_]*)=/', $line, $m)) {
            return false;
        }

        return in_array($m[1], ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_SSLMODE', 'DB_SOCKET'], true);
    }
}
