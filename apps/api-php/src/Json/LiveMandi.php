<?php
declare(strict_types=1);

namespace KrishiGo\Json;

/**
 * Read-only AGMARKNET daily observations via the data.gov.in API.
 *
 * No fictional fallback, no writes to an application DB, no credentials in
 * responses, and no operator-selectable upstream URL. Staging requires a
 * server-only OGD API key and a private writable JSON cache directory.
 */
final class LiveMandi
{
    public const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
    public const SOURCE = 'https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi';
    private const UPSTREAM = 'https://api.data.gov.in/resource/' . self::RESOURCE_ID;
    private const CACHE_TTL = 1800;
    private const STALE_TTL = 604800;
    private const FIELDS = ['state', 'district', 'market', 'commodity', 'variety', 'grade'];

    /** Strictly validates the public query shape before any remote fetch. */
    public static function parameters(array $query): array
    {
        $allowed = [...self::FIELDS, 'page', 'limit', 'date'];
        foreach ($query as $key => $value) {
            if (!is_string($key) || !in_array($key, $allowed, true) || !is_string($value) && !is_int($value)) {
                throw new \InvalidArgumentException('invalid_filter');
            }
        }
        $filters = [];
        foreach (self::FIELDS as $name) {
            $value = trim((string)($query[$name] ?? ''));
            if ($value === '') continue;
            if (strlen($value) > 80 || preg_match('/^[\pL\pN][\pL\pN .()\\/-]*$/uD', $value) !== 1) {
                throw new \InvalidArgumentException('invalid_' . $name);
            }
            $filters[$name] = $value;
        }
        // Scope initial requests to Maharashtra, but allow deliberate nationwide browsing.
        if (!array_key_exists('state', $query)) $filters['state'] = 'Maharashtra';
        if (isset($query['date']) && $query['date'] !== '') {
            $date = (string)$query['date'];
            $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
            if (!$parsed || $parsed->format('Y-m-d') !== $date) throw new \InvalidArgumentException('invalid_date');
            $filters['arrival_date'] = $parsed->format('d/m/Y');
        }
        foreach (['page', 'limit'] as $field) {
            if (isset($query[$field]) && !preg_match('/^[1-9][0-9]{0,3}$/D', (string)$query[$field])) {
                throw new \InvalidArgumentException('invalid_' . $field);
            }
        }
        $page = min(100, (int)($query['page'] ?? 1));
        $limit = min(100, (int)($query['limit'] ?? 50));
        if ($page < 1 || $limit < 1) throw new \InvalidArgumentException('invalid_pagination');
        ksort($filters);
        return ['filters' => $filters, 'page' => $page, 'limit' => $limit];
    }

    public static function normalize(array $record): ?array
    {
        foreach (['state','district','market','commodity','arrival_date','min_price','max_price','modal_price'] as $key) {
            if (!isset($record[$key]) || !is_scalar($record[$key])) return null;
        }
        $prices = [];
        foreach (['min_price','max_price','modal_price'] as $key) {
            $raw = trim((string)$record[$key]);
            if (!preg_match('/^[0-9]+(?:\\.[0-9]{1,3})?$/D', $raw)) return null;
            $value = (float)$raw;
            if (!is_finite($value) || $value < 0 || $value > 100000000) return null;
            $prices[$key] = $value;
        }
        $date = trim((string)$record['arrival_date']);
        $parsed = \DateTimeImmutable::createFromFormat('!d/m/Y', $date);
        if (!$parsed || $parsed->format('d/m/Y') !== $date) return null;
        if ($prices['min_price'] > $prices['max_price']) return null;
        $result = [];
        foreach (self::FIELDS as $name) {
            $value = trim((string)($record[$name] ?? ''));
            $result[$name] = mb_substr($value, 0, 120, 'UTF-8');
        }
        return [...$result, 'arrival_date' => $parsed->format('Y-m-d'), ...$prices,
            'price_unit' => 'INR/quintal',
            'quality_warning' => $prices['modal_price'] < $prices['min_price'] || $prices['modal_price'] > $prices['max_price']];
    }

    private static function read(string $path): ?array
    {
        if (!is_file($path) || filesize($path) > 1500000) return null;
        $raw = @file_get_contents($path);
        if (!is_string($raw)) return null;
        $value = json_decode($raw, true, 15);
        return is_array($value) && isset($value['retrieved_at'], $value['records'], $value['total'])
            && is_int($value['retrieved_at']) && is_array($value['records']) ? $value : null;
    }

    private static function fetch(array $params, string $apiKey): array
    {
        $request = ['api-key'=>$apiKey, 'format'=>'json', 'offset'=>($params['page']-1)*$params['limit'],
            'limit'=>$params['limit']];
        foreach ($params['filters'] as $key=>$value) $request['filters[' . $key . ']'] = $value;
        $url = self::UPSTREAM . '?' . http_build_query($request, '', '&', PHP_QUERY_RFC3986);
        if (function_exists('curl_init')) {
            $curl = curl_init($url);
            if ($curl === false) throw new \RuntimeException('provider_unavailable');
            curl_setopt_array($curl, [
                CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>8, CURLOPT_CONNECTTIMEOUT=>3,
                CURLOPT_FOLLOWLOCATION=>false, CURLOPT_FAILONERROR=>false,
                CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
                CURLOPT_HTTPHEADER=>['Accept: application/json'],
                CURLOPT_USERAGENT=>'KrishiGo-Mandi/1.0 (daily data attribution; data.gov.in)',
            ]);
            $body = curl_exec($curl);
            $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
        } else {
            $context = stream_context_create([
                'http'=>['timeout'=>8,'follow_location'=>0,'ignore_errors'=>true,'header'=>"Accept: application/json\r\n"],
                'ssl'=>['verify_peer'=>true,'verify_peer_name'=>true],
            ]);
            $body = @file_get_contents($url, false, $context);
            $status = 0;
            foreach ($http_response_header ?? [] as $header) {
                if (preg_match('/^HTTP\\/\\S+ ([0-9]{3})/', $header, $m)) $status = (int)$m[1];
            }
        }
        if ($status !== 200 || !is_string($body) || strlen($body) > 1500000) {
            throw new \RuntimeException('provider_unavailable');
        }
        $json = json_decode($body, true, 12);
        if (!is_array($json) || !isset($json['records']) || !is_array($json['records']) ||
            !isset($json['total']) || !is_numeric($json['total'])) {
            throw new \RuntimeException('provider_invalid_response');
        }
        $records = [];
        foreach ($json['records'] as $record) {
            if (!is_array($record)) continue;
            $clean = self::normalize($record);
            if ($clean !== null) $records[] = $clean;
        }
        return ['records'=>$records, 'total'=>max(0, (int)$json['total']),
            'retrieved_at'=>time(), 'rejected_records'=>count($json['records'])-count($records)];
    }

    private static function respond(array $cache, array $params, bool $stale): never
    {
        \kg_json(200, [
            'mode'=>'live_government_data', 'stale'=>$stale, 'retrieved_at'=>gmdate('c', $cache['retrieved_at']),
            'source'=>'Directorate of Marketing and Inspection (AGMARKNET), via data.gov.in',
            'source_url'=>self::SOURCE, 'license_url'=>'https://data.gov.in/Godl',
            'price_unit'=>'INR/quintal', 'filters'=>$params['filters'], 'page'=>$params['page'],
            'limit'=>$params['limit'], 'total'=>$cache['total'], 'records'=>$cache['records'],
            'rejected_records'=>$cache['rejected_records'] ?? 0,
            'note'=>'Daily reported wholesale observations, not a real-time trading price or guaranteed quote.',
        ], ['Cache-Control'=>'private, no-store', 'X-KrishiGo-Data'=>'ogd-agmarknet']);
    }

    public static function dispatch(string $method, array $query): never
    {
        if ($method !== 'GET') \kg_json(405, ['error'=>'method_not_allowed'], ['Allow'=>'GET']);
        if (\kg_env('KRISHIGO_MANDI_ENABLED') !== 'enabled') {
            \kg_json(503, ['error'=>'mandi_feed_disabled', 'message'=>'Live mandi feed is not enabled on this host.']);
        }
        $key = \kg_env('KRISHIGO_OGD_API_KEY');
        $directory = \kg_env('KRISHIGO_MANDI_CACHE_DIR');
        if (!preg_match('/^[a-zA-Z0-9_-]{16,256}$/D', $key) || $directory === '' || $directory[0] !== '/') {
            \kg_json(503, ['error'=>'mandi_not_configured']);
        }
        try { $params = self::parameters($query); }
        catch (\InvalidArgumentException $error) {
            \kg_json(422, ['error'=>$error->getMessage()]);
        }
        $public = realpath(dirname(__DIR__, 2) . '/public');
        if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
            \kg_json(503, ['error'=>'mandi_cache_unavailable']);
        }
        $private = realpath($directory);
        if ($private === false || ($public !== false && ($private === $public || str_starts_with($private, $public . DIRECTORY_SEPARATOR))) || !is_writable($private)) {
            \kg_json(503, ['error'=>'mandi_cache_not_private']);
        }
        $path = $private . '/agmarknet-' . hash('sha256', json_encode($params, JSON_THROW_ON_ERROR)) . '.json';
        $cached = self::read($path);
        if ($cached !== null && time()-$cached['retrieved_at'] < self::CACHE_TTL) self::respond($cached, $params, false);
        $lock = @fopen($path . '.lock', 'c');
        if ($lock === false) \kg_json(503, ['error'=>'mandi_cache_unavailable']);
        if (!flock($lock, LOCK_EX | LOCK_NB)) {
            fclose($lock);
            if ($cached !== null && time()-$cached['retrieved_at'] < self::STALE_TTL) self::respond($cached, $params, true);
            \kg_json(503, ['error'=>'mandi_refresh_in_progress']);
        }
        // A second request may already have refreshed this query while we waited.
        $current = self::read($path);
        if ($current !== null && time()-$current['retrieved_at'] < self::CACHE_TTL) {
            flock($lock, LOCK_UN); fclose($lock); self::respond($current, $params, false);
        }
        try {
            $fresh = self::fetch($params, $key);
            $temp = tempnam($private, '.agmarknet-');
            if ($temp === false) throw new \RuntimeException('mandi_cache_unavailable');
            if (file_put_contents($temp, json_encode($fresh, JSON_THROW_ON_ERROR), LOCK_EX) === false
                || !@chmod($temp, 0600) || !@rename($temp, $path)) {
                @unlink($temp);
                throw new \RuntimeException('mandi_cache_unavailable');
            }
            flock($lock, LOCK_UN); fclose($lock);
            self::respond($fresh, $params, false);
        } catch (\Throwable $error) {
            flock($lock, LOCK_UN); fclose($lock);
            if ($cached !== null && time()-$cached['retrieved_at'] < self::STALE_TTL) self::respond($cached, $params, true);
            \kg_json(503, ['error'=>'mandi_provider_unavailable', 'message'=>'Government prices could not be verified. Try again later.']);
        }
    }
}
