<?php
declare(strict_types=1);
namespace KrishiGo\Production;
use PDO;

/** SQL-only infrastructure adapter: statements are bound, field names are hardcoded. */
final class Repository
{
    public function __construct(private readonly PDO $db) {}
    public function one(string $sql, array $params = []): ?array
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        $item = $statement->fetch();
        return $item === false ? null : $item;
    }
    public function all(string $sql, array $params = []): array
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        return $statement->fetchAll();
    }
    public function exec(string $sql, array $params = []): int
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        return $statement->rowCount();
    }
    public function insert(string $sql, array $params = []): int
    {
        $this->exec($sql, $params);
        return (int)$this->db->lastInsertId();
    }
    public function transaction(callable $operation): mixed
    {
        $this->db->beginTransaction();
        try {
            $result = $operation();
            $this->db->commit();
            return $result;
        } catch (\Throwable $error) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            throw $error;
        }
    }
    public function throttle(string $action, string $fingerprint, int $limit, int $seconds): void
    {
        $key = hash_hmac('sha256', $fingerprint, \kg_env('KRISHIGO_RATE_SALT'));
        $now = time();
        $blocked = $this->transaction(function () use ($action, $key, $now, $seconds, $limit): bool {
            $row = $this->one('SELECT attempts, UNIX_TIMESTAMP(window_started_at) AS started FROM auth_rate_limits WHERE action_key=? AND subject_hash=? FOR UPDATE', [$action, $key]);
            if ($row === null) {
                try {
                    $this->exec('INSERT INTO auth_rate_limits (action_key, subject_hash, attempts, window_started_at) VALUES (?, ?, 1, UTC_TIMESTAMP())', [$action, $key]);
                    return false;
                } catch (\PDOException $e) {
                    // Concurrent insert: pessimistically reject this request rather than allow a race.
                    if ($e->getCode() === '23000') return true;
                    throw $e;
                }
            }
            if ($now - (int)$row['started'] >= $seconds) {
                $this->exec('UPDATE auth_rate_limits SET attempts=1, window_started_at=UTC_TIMESTAMP() WHERE action_key=? AND subject_hash=?', [$action, $key]);
                return false;
            }
            if ((int)$row['attempts'] >= $limit) return true;
            $this->exec('UPDATE auth_rate_limits SET attempts=attempts+1 WHERE action_key=? AND subject_hash=?', [$action, $key]);
            return false;
        });
        if ($blocked) \kg_json(429, ['error' => 'rate_limited'], ['Retry-After' => (string)$seconds]);
    }
}
