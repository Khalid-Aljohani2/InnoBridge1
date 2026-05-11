<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Introspection with minimal remote round-trips — each Postgres {@see Schema::hasColumn} probe is slow over WAN.
 * We cache whole column listings per table and short memoize lookups within the HTTP request lifecycle.
 */
final class CachedSchema
{
    /** Bump after migration changes affecting columns/tables if needed before TTL expiry. */
    private const CACHE_KEY_VERSION = 'v2';

    private const TTL_SECONDS = 604800; // 7 days

    /** @var array<string, mixed> Memo for repeated lookups within one HTTP request / CLI process. */
    private static array $requestMemo = [];

    public static function hasTable(string $table): bool
    {
        $conn = Schema::getConnection()->getName();

        return (bool) self::memoOrCache(
            't:'.$conn.':'.$table,
            'sr_schema.'.self::CACHE_KEY_VERSION.'.'.$conn.'.t.'.$table,
            static fn (): bool => Schema::hasTable($table)
        );
    }

    public static function hasColumn(string $table, string $column): bool
    {
        if (! self::hasTable($table)) {
            return false;
        }

        return in_array($column, self::columnListing($table), true);
    }

    private static function columnListing(string $table): array
    {
        $conn = Schema::getConnection()->getName();
        $cacheKey = 'sr_schema.'.self::CACHE_KEY_VERSION.'.'.$conn.'.cols.'.$table;

        return Cache::remember(
            $cacheKey,
            self::TTL_SECONDS,
            static fn (): array => Schema::getColumnListing($table)
        );
    }

    /**
     * @template T
     * @param  callable(): T  $resolver
     * @return T
     */
    private static function memoOrCache(string $requestKey, string $cacheKey, callable $resolver): mixed
    {
        if (array_key_exists($requestKey, self::$requestMemo)) {
            return self::$requestMemo[$requestKey];
        }

        $value = Cache::remember($cacheKey, self::TTL_SECONDS, $resolver);

        self::$requestMemo[$requestKey] = $value;

        return $value;
    }
}
