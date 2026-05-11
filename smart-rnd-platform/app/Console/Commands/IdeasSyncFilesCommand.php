<?php

namespace App\Console\Commands;

use App\Models\IndustryChallenge;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IdeasSyncFilesCommand extends Command
{
    protected $signature = 'ideas:sync-files {--apply : Execute insert after preview}';

    protected $description = 'Sync files from storage/app/public/projects into industry_challenges as student_idea rows';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $dir = config('similarity.projects_directory', 'projects');

        if (! $disk->exists($dir)) {
            $this->error("Directory [{$dir}] does not exist on public disk.");

            return self::FAILURE;
        }

        $files = collect($disk->allFiles($dir))
            ->map(fn (string $path) => $this->normalizePath($path))
            ->filter(fn (string $path) => in_array(strtolower((string) pathinfo($path, PATHINFO_EXTENSION)), ['pdf', 'docx', 'doc'], true))
            ->values();

        if ($files->isEmpty()) {
            $this->warn("No supported files found in [{$dir}]");

            return self::SUCCESS;
        }

        $existingPaths = IndustryChallenge::query()
            ->where('kind', 'student_idea')
            ->whereNotNull('file_path')
            ->pluck('file_path')
            ->filter()
            ->map(fn (string $path) => $this->normalizePath($path))
            ->values();

        $missing = $files->filter(fn (string $path) => ! $this->hasPathMatch($path, $existingPaths))->values();

        $this->line('=== Dry Run ===');
        $this->info('Total files in projects: '.$files->count());
        $this->info('Existing student_idea rows with file_path: '.$existingPaths->count());
        $this->warn('Will add new records: '.$missing->count());

        if ($missing->isNotEmpty()) {
            $this->table(
                ['#', 'file_path', 'title preview'],
                $missing->values()->map(fn (string $path, int $i) => [
                    $i + 1,
                    $path,
                    $this->titleFromPath($path),
                ])->all()
            );
        }

        if (! $this->option('apply')) {
            $this->comment('Dry run only. Re-run with --apply to start interactive confirmation.');

            return self::SUCCESS;
        }

        if ($missing->isEmpty()) {
            $this->info('Nothing to insert.');

            return self::SUCCESS;
        }

        if (! $this->input->isInteractive()) {
            $this->error('Interactive confirmation required. Run without --no-interaction.');

            return self::FAILURE;
        }

        if (! $this->confirm('Do you want to insert these new student_idea records now?', false)) {
            $this->warn('Cancelled by user.');

            return self::SUCCESS;
        }

        $ownerId = $this->resolveOwnerId();
        if ($ownerId === null) {
            $this->error('No user found to assign posted_by_user_id. Create at least one user first.');

            return self::FAILURE;
        }

        $inserted = 0;
        foreach ($missing as $path) {
            IndustryChallenge::create([
                'title' => $this->titleFromPath($path),
                'description' => 'Auto-created from projects sync (legacy corpus import).',
                'posted_date' => now(),
                'posted_by_user_id' => $ownerId,
                'kind' => 'student_idea',
                'file_path' => $path,
                'progress' => 0,
                'current_milestone' => 'Legacy imported idea',
                'review_status' => 'pending_action',
            ]);
            $inserted++;
        }

        $this->info("Inserted {$inserted} new record(s).");

        return self::SUCCESS;
    }

    private function resolveOwnerId(): ?int
    {
        $studentId = User::query()->where('role', 'student')->value('id');
        if ($studentId) {
            return (int) $studentId;
        }

        $fallbackId = User::query()->value('id');

        return $fallbackId ? (int) $fallbackId : null;
    }

    private function normalizePath(string $path): string
    {
        $normalized = trim(str_replace('\\', '/', $path), '/');

        return preg_replace('#^storage/app/public/#', '', $normalized) ?? $normalized;
    }

    private function hasPathMatch(string $candidatePath, $existingPaths): bool
    {
        $candidate = strtolower($this->normalizePath($candidatePath));
        $candidateBase = strtolower(basename($candidate));

        foreach ($existingPaths as $existingPath) {
            $existing = strtolower($this->normalizePath((string) $existingPath));
            $existingBase = strtolower(basename($existing));
            if ($existing === $candidate || $existingBase === $candidateBase) {
                return true;
            }

            if (Str::contains($existing, $candidateBase) || Str::contains($candidate, $existingBase)) {
                return true;
            }
        }

        return false;
    }

    private function titleFromPath(string $path): string
    {
        $base = pathinfo($path, PATHINFO_FILENAME);
        $base = str_replace(['_', '-'], ' ', (string) $base);
        $base = preg_replace('/\s+/', ' ', $base) ?? $base;

        return Str::limit(trim($base), 250, '');
    }
}
