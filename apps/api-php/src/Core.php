<?php
declare(strict_types=1);

/** Small PHP 8.3+ HTTP boundary. Database-free; neither Laravel nor a general-purpose framework. */
function kg_json(int $status, array $payload, array $headers = []): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    foreach ($headers as $name => $value) header($name . ': ' . $value);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') {
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
    exit;
}
function kg_env(string $name): string { $val = getenv($name); return is_string($val) ? $val : ''; }
function kg_https(): bool {
    if (($_SERVER['HTTPS'] ?? '') === 'on' || (string)($_SERVER['SERVER_PORT'] ?? '') === '443') return true;
    $peers = array_filter(array_map('trim', explode(',', kg_env('KRISHIGO_TRUSTED_PROXY_IPS'))));
    $peer = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return $peer !== '' && in_array($peer, $peers, true) && strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}
function kg_secure_transport(): bool {
    if (kg_https()) return true;
    $remote = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return kg_env('KRISHIGO_ALLOW_HTTP_LOCAL') === '1' && in_array($remote, ['127.0.0.1', '::1'], true);
}
function kg_begin_session(): void {
    if (!kg_secure_transport()) kg_json(403, ['error' => 'https_required']);
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('krishigo_stage');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => kg_https(), 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}
function kg_csrf_token(): string {
    kg_begin_session();
    if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
function kg_check_csrf(): void {
    $token = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($token === '' || !hash_equals(kg_csrf_token(), $token)) kg_json(419, ['error' => 'csrf_invalid']);
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin !== '') {
        $host = (string)($_SERVER['HTTP_HOST'] ?? '');
        $expected = (kg_https() ? 'https' : 'http') . '://' . $host;
        if ($host === '' || !hash_equals($expected, rtrim($origin, '/'))) kg_json(403, ['error' => 'origin_forbidden']);
    }
}
function kg_json_input(): array {
    $type = strtolower(trim(explode(';', (string)($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($type !== 'application/json') kg_json(415, ['error' => 'json_required']);
    $max = 2048;
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if (!is_string($raw) || strlen($raw) > $max) kg_json(413, ['error' => 'body_too_large']);
    try { $data = json_decode($raw, true, 8, JSON_THROW_ON_ERROR); }
    catch (JsonException $e) { kg_json(400, ['error' => 'invalid_json']); }
    if (!is_array($data) || array_is_list($data)) kg_json(422, ['error' => 'object_required']);
    return $data;
}
function kg_stage_auth_enabled(): bool {
    return kg_env('KRISHIGO_STAGE_AUTH') === 'enabled'
        && kg_env('KRISHIGO_STAGE_USERNAME') !== ''
        && kg_env('KRISHIGO_STAGE_PASSWORD_HASH') !== '';
}
function kg_identity(): ?array {
    kg_begin_session();
    if (!kg_stage_auth_enabled()) return null;
    $id = $_SESSION['identity'] ?? null;
    if (!is_array($id) || !is_string($id['role'] ?? null) || !is_string($id['name'] ?? null)) return null;
    if (!in_array($id['role'], ['farmer', 'buyer', 'fpo', 'editor', 'admin'], true)) return null;
    return ['name' => $id['name'], 'role' => $id['role'], 'demo' => true];
}
function kg_require_roles(array $roles): array {
    $identity = kg_identity();
    if ($identity === null) kg_json(401, ['error' => 'unauthorized']);
    if (!in_array($identity['role'], $roles, true)) kg_json(403, ['error' => 'permission_denied']);
    return $identity;
}
function kg_fixture(string $key): never {
    $path = dirname(__DIR__) . '/fixtures/catalog.json';
    $payload = json_decode((string)file_get_contents($path), true, 16, JSON_THROW_ON_ERROR);
    if (!isset($payload[$key]) || !is_array($payload[$key])) kg_json(500, ['error' => 'fixture_not_found']);
    kg_json(200, $payload[$key], ['X-KrishiGo-Data' => 'fictional-demo', 'Cache-Control' => 'public, max-age=60']);
}
