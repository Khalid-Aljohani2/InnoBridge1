<?php

namespace App\Services;

use App\Contracts\DocumentTextExtractorInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentTextExtractor implements DocumentTextExtractorInterface
{
    public function extract(UploadedFile $file): string
    {
        $ext = strtolower($file->getClientOriginalExtension());

        return match ($ext) {
            'docx' => $this->extractFromDocx($file),
            'pdf' => $this->extractFromPdfBinary((string) file_get_contents($file->getRealPath())),
            'doc' => $this->extractFromBinaryDoc($file),
            default => '',
        };
    }

    public function extractFromStoragePath(string $relativePathOnPublicDisk): string
    {
        $relativePathOnPublicDisk = ltrim(str_replace('\\', '/', $relativePathOnPublicDisk), '/');
        $disk = Storage::disk('public');

        if (! $disk->exists($relativePathOnPublicDisk)) {
            return '';
        }

        $ext = strtolower((string) pathinfo($relativePathOnPublicDisk, PATHINFO_EXTENSION));
        $absolute = $disk->path($relativePathOnPublicDisk);

        return match ($ext) {
            'docx' => $this->extractFromDocxPath($absolute),
            'pdf' => $this->extractFromPdfBinary((string) @file_get_contents($absolute)),
            'doc' => $this->normalize((string) @file_get_contents($absolute)),
            default => '',
        };
    }

    private function extractFromDocx(UploadedFile $file): string
    {
        return $this->extractFromDocxPath($file->getRealPath());
    }

    private function extractFromDocxPath(string $realPath): string
    {
        if (! class_exists(\ZipArchive::class)) {
            return '';
        }

        $zip = new \ZipArchive();
        if ($zip->open($realPath) !== true) {
            return '';
        }

        $xml = $zip->getFromName('word/document.xml') ?: '';
        $zip->close();
        if ($xml === '') {
            return '';
        }

        $text = strip_tags(str_replace(['</w:p>', '</w:tr>'], ["\n", "\n"], $xml));

        return $this->normalize($text);
    }

    private function extractFromPdfBinary(string $content): string
    {
        if ($content === '') {
            return '';
        }

        $chunks = [];

        // Single text show operators.
        if (preg_match_all('/\((.*?)\)\s*Tj/s', $content, $matches) && ! empty($matches[1])) {
            foreach ($matches[1] as $m) {
                $chunks[] = stripcslashes((string) $m);
            }
        }

        // Array text show operators (common in many PDF generators).
        if (preg_match_all('/\[(.*?)\]\s*TJ/s', $content, $arrayMatches) && ! empty($arrayMatches[1])) {
            foreach ($arrayMatches[1] as $arrayChunk) {
                if (preg_match_all('/\((.*?)\)/s', (string) $arrayChunk, $partMatches) && ! empty($partMatches[1])) {
                    foreach ($partMatches[1] as $part) {
                        $chunks[] = stripcslashes((string) $part);
                    }
                }
            }
        }

        // Hex-encoded text operators.
        if (preg_match_all('/<([0-9A-Fa-f\s]+)>\s*Tj/s', $content, $hexMatches) && ! empty($hexMatches[1])) {
            foreach ($hexMatches[1] as $hex) {
                $decoded = $this->decodePdfHexString((string) $hex);
                if ($decoded !== '') {
                    $chunks[] = $decoded;
                }
            }
        }

        if ($chunks !== []) {
            $text = $this->normalize(implode(' ', $chunks));
            if (mb_strlen($text) > 0) {
                return $text;
            }
        }

        $printable = preg_replace('/[^\PC\s]/u', ' ', $content);

        return $this->normalize((string) $printable);
    }

    private function decodePdfHexString(string $hex): string
    {
        $hex = preg_replace('/\s+/', '', $hex) ?? $hex;
        if ($hex === '' || strlen($hex) < 2) {
            return '';
        }

        if (strlen($hex) % 2 === 1) {
            $hex .= '0';
        }

        $bin = @hex2bin($hex);
        if ($bin === false || $bin === '') {
            return '';
        }

        // Many PDFs encode text as UTF-16BE in hex.
        if (str_contains($bin, "\x00")) {
            $utf = @mb_convert_encoding($bin, 'UTF-8', 'UTF-16BE');
            return is_string($utf) ? $utf : '';
        }

        return $bin;
    }

    private function extractFromBinaryDoc(UploadedFile $file): string
    {
        $content = @file_get_contents($file->getRealPath());
        if (! is_string($content) || $content === '') {
            return '';
        }

        return $this->normalize($content);
    }

    private function normalize(string $value): string
    {
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return trim(mb_substr($value, 0, 12000));
    }
}
