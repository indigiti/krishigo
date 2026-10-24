<?php
/**
 * KrishiGo API boundary, milestone M1.
 * No framework, no database, no authentication, no public writes.
 * Protected resources deliberately return 501 until M2 implements safe persistence.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, private');
header('Referrer-Policy: no-referrer');

function json_response(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($path)) { json_response(400, ['error' => 'invalid_path']); }
$path = '/' . trim($path, '/');

if (!in_array($method, ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    header('Allow: GET, HEAD, POST, PUT, PATCH, DELETE');
    json_response(405, ['error' => 'method_not_allowed']);
}
if (($path === '/healthz' || $path === '/api/v1/status') && in_array($method, ['GET', 'HEAD'], true)) {
    json_response(200, [
        'ok' => true,
        'service' => 'krishigo-api',
        'stage' => 'scaffold',
        'database' => 'disabled',
        'write_api' => 'not_implemented',
    ]);
}

// These are the planned domain paths, not mock public CRUD endpoints.
$planned = [
    '/api/v1/marketplace/listings', '/api/v1/community/posts', '/api/v1/buyers/requirements',
    '/api/v1/services', '/api/v1/content', '/api/v1/modules',
    '/api/v1/plant-cases', '/api/v1/auth/session',
];
if (in_array($path, $planned, true)) {
    json_response(501, [
        'error' => 'not_implemented',
        'message' => 'This API is an architecture scaffold. Use the database-free React staging application.',
    ]);
}
json_response(404, ['error' => 'not_found']);
