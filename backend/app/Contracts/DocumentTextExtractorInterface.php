<?php

namespace App\Contracts;

use Illuminate\Http\UploadedFile;

interface DocumentTextExtractorInterface
{
    public function extract(UploadedFile $file): string;

    /**
     * Extract text from a path on the public disk (e.g. projects/report.pdf).
     */
    public function extractFromStoragePath(string $relativePathOnPublicDisk): string;
}
