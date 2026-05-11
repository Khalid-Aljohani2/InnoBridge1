<?php

namespace App\Console\Commands;

use App\Jobs\ProcessProjectEmbeddingJob;
use App\Models\IndustryChallenge;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class IdeasBackfillCommand extends Command
{
    protected $signature = 'ideas:backfill';

    protected $description = 'Queue embedding generation for files under storage/app/public/projects and matching student ideas';

    public function handle(): int
    {
        $dir = config('similarity.projects_directory', 'projects');
        $disk = Storage::disk('public');

        if (! $disk->exists($dir)) {
            $this->warn("Directory [{$dir}] does not exist on the public disk.");

            return self::SUCCESS;
        }

        $files = $disk->allFiles($dir);
        $dispatched = 0;

        foreach ($files as $relativePath) {
            $normalizedRelativePath = $this->normalizePath($relativePath);
            $ext = strtolower((string) pathinfo($normalizedRelativePath, PATHINFO_EXTENSION));
            if (! in_array($ext, ['pdf', 'docx', 'doc'], true)) {
                continue;
            }

            $basename = basename($normalizedRelativePath);
            $challenge = $this->findMatchingChallenge($normalizedRelativePath, $basename);

            if (! $challenge) {
                $this->line("Skip (no DB row): {$normalizedRelativePath}");

                continue;
            }

            ProcessProjectEmbeddingJob::dispatch($challenge->id);
            $dispatched++;
            $this->info("Queued challenge #{$challenge->id} for {$normalizedRelativePath}");
        }

        $this->info("Dispatched {$dispatched} job(s). Run `php artisan queue:work` to process.");

        return self::SUCCESS;
    }

    private function normalizePath(string $path): string
    {
        $normalized = trim(str_replace('\\', '/', $path), '/');
        $normalized = preg_replace('#^storage/app/public/#', '', $normalized) ?? $normalized;

        return $normalized;
    }

    private function findMatchingChallenge(string $normalizedRelativePath, string $basename): ?IndustryChallenge
    {
        return IndustryChallenge::query()
            ->where('kind', 'student_idea')
            ->whereNotNull('file_path')
            ->where(function ($q) use ($normalizedRelativePath, $basename) {
                $q->where('file_path', $normalizedRelativePath)
                    ->orWhereRaw("REPLACE(file_path, '\\\\', '/') = ?", [$normalizedRelativePath])
                    ->orWhereRaw("REPLACE(file_path, '\\\\', '/') = ?", ['projects/'.$basename])
                    ->orWhereRaw("REPLACE(file_path, '\\\\', '/') = ?", ['project_ideas/'.$basename])
                    ->orWhereRaw("LOWER(REPLACE(file_path, '\\\\', '/')) LIKE ?", ['%/'.strtolower($basename)])
                    ->orWhereRaw("LOWER(REPLACE(file_path, '\\\\', '/')) LIKE ?", ['%'.strtolower($basename)]);
            })
            ->latest('id')
            ->first();
    }
}
