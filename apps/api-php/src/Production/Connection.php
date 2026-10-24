<?php
declare(strict_types=1);
namespace KrishiGo\Production;
use PDO;
use RuntimeException;

final class Connection
{
    public static function open(): PDO
    {
        $dsn = \kg_env('KRISHIGO_DB_DSN');
        $rateSalt = \kg_env('KRISHIGO_RATE_SALT');
        // This prevents accidental production activation using an unconfigured or SQLite backend.
        if (!str_starts_with($dsn, 'mysql:') || strlen($rateSalt) < 32 || \kg_env('KRISHIGO_DB_USER') === '') {
            throw new RuntimeException('production_environment_incomplete');
        }
        $db = new PDO($dsn, \kg_env('KRISHIGO_DB_USER'), \kg_env('KRISHIGO_DB_PASSWORD'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        $db->exec("SET time_zone = '+00:00'");
        return $db;
    }
}
