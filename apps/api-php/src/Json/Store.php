<?php
declare(strict_types=1);
namespace KrishiGo\Json;

use RuntimeException;

/**
 * Private JSON repository for staging-only fictional workflows.
 * Files are locked, bounded, validated and atomically replaced; no SQL required.
 * This is NOT a durable production transaction engine.
 */
final class Store {
    private const DOMAINS = ['marketplace','buyers','community','plant','services','editorial'];
    private string $directory;

    public function __construct(string $directory) {
        $resolved = realpath($directory);
        $public = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? ''));
        if ($resolved === false || !is_dir($resolved) || !is_writable($resolved)) {
            throw new RuntimeException('JSON_STORE_UNAVAILABLE');
        }
        if ($public !== false && ($resolved === $public || str_starts_with($resolved, $public . DIRECTORY_SEPARATOR))) {
            throw new RuntimeException('JSON_PUBLIC_STORE_FORBIDDEN');
        }
        $this->directory = $resolved;
    }

    private function path(string $domain, string $kind): string {
        if (!in_array($domain, self::DOMAINS, true) &&
            preg_match('/^module-(?:[1-9]|1[0-9]|2[0-5])$/D', $domain)!==1)
            throw new RuntimeException('UNKNOWN_DOMAIN');
        return $this->directory . '/workflow-' . $domain . '-' . $kind . '.json';
    }
    private function empty(): array { return ['schema'=>1,'next_id'=>1,'records'=>[]]; }

    private function validate(mixed $data): ?array {
        if (!is_array($data) || ($data['schema'] ?? null) !== 1 ||
            !is_int($data['next_id'] ?? null) || $data['next_id'] < 1 || $data['next_id'] > 10000000 ||
            !is_array($data['records'] ?? null) || !array_is_list($data['records']) ||
            count($data['records']) > 500) return null;
        $seen = [];
        foreach ($data['records'] as $record) {
            if (!is_array($record) || !is_int($record['id'] ?? null) ||
                $record['id'] < 1 || $record['id'] >= $data['next_id'] ||
                isset($seen[$record['id']]) ||
                !is_string($record['owner'] ?? null) || strlen($record['owner']) > 100 ||
                !in_array($record['status'] ?? null, ['pending-demo','reviewed-demo','rejected-demo'], true) ||
                !is_array($record['fields'] ?? null) ||
                !is_string($record['created_at'] ?? null) ||
                !is_string($record['request_hash'] ?? null) ||
                !preg_match('/^[a-f0-9]{64}$/D', $record['request_hash'])) return null;
            $seen[$record['id']] = true;
            if (count($record['fields']) > 12) return null;
            foreach ($record['fields'] as $key=>$value) {
                if (!is_string($key) || strlen($key) > 32 ||
                    (!is_string($value) && !is_int($value)) ||
                    (is_string($value) && strlen($value) > 700)) return null;
            }
        }
        return $data;
    }

    private function loadFile(string $file): ?array {
        if (!is_file($file) || is_link($file) || filesize($file) > 900000) return null;
        $text = @file_get_contents($file);
        if (!is_string($text)) return null;
        try { return $this->validate(json_decode($text, true, 32, JSON_THROW_ON_ERROR)); }
        catch (\JsonException) { return null; }
    }

    private function saveFile(string $path, array $doc): void {
        $encoded = json_encode($doc, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (strlen($encoded) > 900000) throw new RuntimeException('JSON_CAPACITY_REACHED');
        $tmp = tempnam($this->directory, 'kg-wf-');
        if ($tmp === false) throw new RuntimeException('JSON_WRITE_FAILED');
        try {
            if (!chmod($tmp, 0600) || file_put_contents($tmp, $encoded, LOCK_EX) !== strlen($encoded) ||
                !rename($tmp, $path)) throw new RuntimeException('JSON_WRITE_FAILED');
        } finally { if (is_file($tmp)) @unlink($tmp); }
    }

    private function state(string $domain): array {
        $current = $this->path($domain, 'state');
        $good = $this->path($domain, 'last-good');
        $initialized = $this->directory . '/workflow-' . $domain . '.initialized';
        if (!is_file($current) && !is_file($good)) {
            if (file_exists($initialized)) throw new RuntimeException('JSON_STATE_UNRECOVERABLE');
            $doc = $this->empty();
            $this->saveFile($current, $doc);
            $this->saveFile($good, $doc);
            if (file_put_contents($initialized, "1\n", LOCK_EX) === false) throw new RuntimeException('JSON_WRITE_FAILED');
            return ['doc'=>$doc,'recovered'=>false];
        }
        $doc = $this->loadFile($current);
        if ($doc !== null) return ['doc'=>$doc,'recovered'=>false];
        $doc = $this->loadFile($good);
        if ($doc === null) throw new RuntimeException('JSON_STATE_UNRECOVERABLE');
        $this->saveFile($current, $doc);
        return ['doc'=>$doc,'recovered'=>true];
    }

    private function synchronized(string $domain, callable $action): mixed {
        $lock = $this->directory . '/workflow-' . $domain . '.lock';
        $fp = @fopen($lock, 'c+');
        if ($fp === false) throw new RuntimeException('JSON_LOCK_FAILED');
        try {
            if (!flock($fp, LOCK_EX)) throw new RuntimeException('JSON_LOCK_FAILED');
            return $action($this->state($domain));
        } finally { flock($fp, LOCK_UN); fclose($fp); }
    }

    private function persist(string $domain, array $doc): void {
        if ($this->validate($doc) === null) throw new RuntimeException('JSON_RECORD_INVALID');
        // Current is committed first. If backup write fails, previous valid snapshot remains.
        $this->saveFile($this->path($domain,'state'), $doc);
        $this->saveFile($this->path($domain,'last-good'), $doc);
    }

    public function records(string $domain, ?string $owner = null, bool $reviewQueue = false): array {
        return $this->synchronized($domain, function(array $state) use ($owner,$reviewQueue) {
            $items = array_filter($state['doc']['records'], function(array $record) use ($owner,$reviewQueue) {
                if ($reviewQueue) return $record['status'] === 'pending-demo';
                if ($owner !== null) return hash_equals($record['owner'], $owner);
                return $record['status'] === 'reviewed-demo';
            });
            $items = array_values(array_reverse(array_slice(array_values($items), -30)));
            // Never expose private idempotency hashes to clients.
            return ['items'=>array_map(self::visible(...),$items), 'recovered'=>$state['recovered']];
        });
    }

    private static function visible(array $record): array {
        unset($record['request_hash']);
        return $record;
    }

    public function create(string $domain, string $owner, array $fields, string $requestKey): array {
        return $this->synchronized($domain, function(array $state) use ($domain,$owner,$fields,$requestKey) {
            $doc = $state['doc'];
            $hash = hash('sha256', $owner . ':' . $domain . ':' . $requestKey);
            foreach ($doc['records'] as $record) {
                if (hash_equals($record['request_hash'], $hash)) {
                    if ($record['fields'] !== $fields) throw new RuntimeException('IDEMPOTENCY_CONFLICT');
                    return ['item'=>self::visible($record),'created'=>false,'recovered'=>$state['recovered']];
                }
            }
            if (count($doc['records']) >= 500) throw new RuntimeException('JSON_CAPACITY_REACHED');
            $record = [
                'id'=>$doc['next_id']++,
                'owner'=>$owner,
                'status'=>'pending-demo',
                'fields'=>$fields,
                'request_hash'=>$hash,
                'created_at'=>gmdate('c')
            ];
            $doc['records'][] = $record;
            $this->persist($domain,$doc);
            return ['item'=>self::visible($record),'created'=>true,'recovered'=>$state['recovered']];
        });
    }

    public function review(string $domain, int $id, string $decision): array {
        return $this->synchronized($domain, function(array $state) use ($domain,$id,$decision) {
            $doc=$state['doc'];
            foreach ($doc['records'] as &$record) {
                if ($record['id'] !== $id) continue;
                if ($record['status'] !== 'pending-demo') throw new RuntimeException('ALREADY_REVIEWED');
                $record['status'] = $decision === 'approve' ? 'reviewed-demo' : 'rejected-demo';
                $visible = self::visible($record);
                unset($record);
                $this->persist($domain,$doc);
                return $visible;
            }
            throw new RuntimeException('RECORD_NOT_FOUND');
        });
    }

    public function health(): array {
        $result = [];
        foreach (self::DOMAINS as $domain) {
            $result[$domain] = $this->synchronized($domain, function(array $state) {
                $records = $state['doc']['records'];
                return ['ok'=>true,'records'=>count($records),'pending'=>count(array_filter($records,fn($r)=>$r['status']==='pending-demo')),'recovered'=>$state['recovered']];
            });
        }
        return ['ok'=>true,'mode'=>'fictional-json-staging','database'=>'none','domains'=>$result];
    }
}
