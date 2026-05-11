<?php

namespace App\Contracts;

interface AiReviewServiceInterface
{
    public function analyze(string $title, string $description, string $documentText): array;
}
