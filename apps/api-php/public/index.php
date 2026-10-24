<?php
/** KrishiGo M2 Custom PHP API; staging fixtures and opt-in session testing only. */
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/Core.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
header('Referrer-Policy: no-referrer');
header('X-Frame-Options: DENY');
header('Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\'');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
if (kg_https()) header('Strict-Transport-Security: max-age=31536000');

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
if (!is_string($path)) kg_json(400, ['error' => 'invalid_path']);
$path = '/' . trim($path, '/');
if (!in_array($method, ['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'], true)) {
    kg_json(405, ['error' => 'method_not_allowed'], ['Allow' => 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS']);
}

// The existing database-free demo is the default. Production is an explicit, fail-closed mode.
if (kg_env('KRISHIGO_API_MODE') === 'production') {
    foreach (['Validation','Connection','Repository','Api'] as $module) {
        require_once dirname(__DIR__) . '/src/Production/' . $module . '.php';
    }
    \KrishiGo\Production\Api::dispatch($method, $path);
}

// Optional database-free control plane. All writes require admin + CSRF.
if ($path === '/api/v1/modules/registry' || $path === '/api/v1/modules/health' || str_starts_with($path, '/api/v1/admin/module-controls')) {
    require_once dirname(__DIR__).'/src/Modules/Registry.php';
    try {
        $modules = new \KrishiGo\Modules\Registry(dirname(__DIR__).'/fixtures/module-registry.json',kg_env('KRISHIGO_JSON_STORE_DIR'));
        if ($method==='GET' && $path==='/api/v1/modules/registry') kg_json(200,$modules->snapshot());
        if ($method==='GET' && $path==='/api/v1/modules/health') {
            $state=$modules->snapshot();
            kg_json(200,['ok'=>true,'catalog_count'=>count($state['modules']),'store_configured'=>$state['configured'],'recovered_from_snapshot'=>$state['recovered'],'database'=>'none','revision'=>$state['revision'],'enabled_count'=>$state['enabled_count'],'disabled_count'=>$state['disabled_count']]);
        }
        kg_require_roles(['admin']);
        if ($method==='GET' && $path==='/api/v1/admin/module-controls') kg_json(200,$modules->snapshot());
        if ($method==='POST') {
            kg_check_csrf();
            $body=kg_json_input(256);
            $expected=$body['expected_revision']??null;
            if($expected!==null && (!is_string($expected)||!preg_match('/^[a-f0-9]{64}$/D',$expected)))kg_json(422,['error'=>'invalid_revision']);
            if($path==='/api/v1/admin/module-controls/reset')kg_json(200,$modules->reset($expected));
            if($path==='/api/v1/admin/module-controls/rollback')kg_json(200,$modules->rollback($expected));
            if(preg_match('~^/api/v1/admin/module-controls/([1-9][0-9]{0,2})$~D',$path,$parts)===1){
                if(!isset($body['enabled'])||!is_bool($body['enabled']))kg_json(422,['error'=>'enabled_boolean_required']);
                kg_json(200,$modules->update((int)$parts[1],$body['enabled'],$expected));
            }
        }
        kg_json(405,['error'=>'method_not_allowed']);
    }catch(\RuntimeException $exception){
        $error=$exception->getMessage();
        if($error==='MODULE_UNKNOWN')kg_json(404,['error'=>'module_unknown']);
        if($error==='DEPENDENCY_REQUIRED')kg_json(409,['error'=>'module_dependency_required']);
        if($error==='MODULE_VERSION_CONFLICT')kg_json(409,['error'=>'module_state_conflict']);
        if($error==='ROLLBACK_UNAVAILABLE')kg_json(409,['error'=>'rollback_unavailable']);
        if($error==='STORE_NOT_CONFIGURED')kg_json(503,['error'=>'module_store_not_configured']);
        kg_json(503,['error'=>'module_store_unavailable']);
    }
}
// Module-off sample API routes cannot accidentally publish disabled content.
if (in_array($method,['GET','HEAD'],true)) {
    $routeIds=['/api/v1/marketplace/listings'=>2,'/api/v1/buyers/requirements'=>3,'/api/v1/community/posts'=>4,'/api/v1/services'=>13,'/api/v1/content'=>7];
    $moduleId=$routeIds[$path]??null;
    if($moduleId===null&&preg_match('~^/api/v1/marketplace/listings/[1-9][0-9]{0,8}$~D',$path))$moduleId=2;
    if($moduleId!==null){
        require_once dirname(__DIR__).'/src/Modules/Registry.php';
        try {
            $guard=new \KrishiGo\Modules\Registry(dirname(__DIR__).'/fixtures/module-registry.json',kg_env('KRISHIGO_JSON_STORE_DIR'));
            foreach($guard->snapshot()['modules'] as $row)if($row['id']===$moduleId&&!$row['enabled'])kg_json(404,['error'=>'module_disabled']);
        }catch(\RuntimeException $exception){kg_json(503,['error'=>'module_state_unavailable']);}
    }
}

if ($method === 'OPTIONS') kg_json(405, ['error' => 'cross_origin_not_supported'], ['Allow' => 'GET, HEAD, POST, PUT, PATCH, DELETE']);

if (in_array($method, ['GET','HEAD'], true)) {
    if ($path === '/healthz') kg_json(200, ['ok' => true, 'service' => 'krishigo-api']);
    if ($path === '/api/v1/status' || $path === '/api/v1/capabilities') kg_json(200, [
        'ok' => true, 'service' => 'krishigo-api', 'stage' => 'M2-fixtures',
        'database' => 'disabled', 'fixtures' => 'fictional', 'public_writes' => false,
        'plant_diagnosis' => false, 'staging_auth' => kg_stage_auth_enabled(),
    ]);
    $fixtures = [
        '/api/v1/marketplace/listings' => 'listings',
        '/api/v1/community/posts' => 'posts',
        '/api/v1/buyers/requirements' => 'requirements',
        '/api/v1/services' => 'services',
        '/api/v1/content' => 'content',
        '/api/v1/modules' => 'modules',
    ];
    if (isset($fixtures[$path])) kg_fixture($fixtures[$path]);
    if (preg_match('~^/api/v1/marketplace/listings/([1-9][0-9]{0,8})$~D', $path, $matches) === 1) {
        kg_fixture_record('listings', (int)$matches[1]);
    }
    if ($path === '/api/v1/admin/review-cases') {
        kg_require_roles(['editor','admin']);
        kg_json(200, ['demo' => true, 'writes_enabled' => false, 'items' => [
            ['id' => 'RV-101', 'type' => 'profile', 'status' => 'sample_pending', 'reason' => 'Sample seller identity evidence required'],
            ['id' => 'RV-102', 'type' => 'listing', 'status' => 'sample_pending', 'reason' => 'Sample produce quantity documentation required'],
            ['id' => 'RV-103', 'type' => 'content', 'status' => 'sample_pending', 'reason' => 'Sample crop advice pending expert review'],
        ]], ['Cache-Control' => 'private, no-store']);
    }

    if ($path === '/api/v1/auth/csrf') {
        kg_json(200, ['csrf_token' => kg_csrf_token(), 'staging_only' => true]);
    }
    if ($path === '/api/v1/auth/me') {
        kg_json(200, ['identity' => kg_identity(), 'staging_only' => true]);
    }
    if ($path === '/api/v1/admin/moderation') {
        kg_require_roles(['editor','admin']);
        kg_json(200, ['items' => [
            ['id' => 'demo-1', 'type' => 'community', 'reason' => 'Example pending review', 'status' => 'sample'],
            ['id' => 'demo-2', 'type' => 'marketplace', 'reason' => 'Example seller verification', 'status' => 'sample'],
        ], 'writes_enabled' => false]);
    }
}
if ($method === 'POST' && $path === '/api/v1/auth/login') {
    if (!kg_stage_auth_enabled()) kg_json(503, ['error' => 'staging_auth_disabled']);
    kg_check_csrf();
    $input = kg_json_input();
    $username = $input['username'] ?? null;
    $password = $input['password'] ?? null;
    if (!is_string($username) || !is_string($password) || strlen($username) > 100 || strlen($password) > 200) kg_json(422, ['error' => 'invalid_credentials']);
    kg_begin_session();
    $attempts = (int)($_SESSION['failed_logins'] ?? 0);
    $firstAttempt = (int)($_SESSION['first_failure_at'] ?? time());
    if (time() - $firstAttempt > 900) { $attempts = 0; $firstAttempt = time(); }
    if ($attempts >= 5) kg_json(429, ['error' => 'temporarily_blocked']);
    $valid = hash_equals(kg_env('KRISHIGO_STAGE_USERNAME'), $username) && password_verify($password, kg_env('KRISHIGO_STAGE_PASSWORD_HASH'));
    if (!$valid) {
        $_SESSION['failed_logins'] = $attempts + 1;
        $_SESSION['first_failure_at'] = $firstAttempt;
        kg_json(401, ['error' => 'invalid_credentials']);
    }
    session_regenerate_id(true);
    $role = kg_env('KRISHIGO_STAGE_ROLE');
    if (!in_array($role, ['farmer','buyer','fpo','editor','admin'], true)) $role = 'farmer';
    $_SESSION['identity'] = ['name' => $username, 'role' => $role];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    unset($_SESSION['failed_logins'], $_SESSION['first_failure_at']);
    kg_json(200, ['identity' => kg_identity(), 'csrf_token' => $_SESSION['csrf'], 'staging_only' => true]);
}
if ($method === 'POST' && $path === '/api/v1/auth/logout') {
    kg_check_csrf();
    kg_begin_session();
    $_SESSION = [];
    session_regenerate_id(true);
    kg_json(200, ['ok' => true]);
}
// No real marketplace writes, moderation decisions, user registration, uploads, or diagnoses.
$protected = ['/api/v1/marketplace/listings', '/api/v1/community/posts', '/api/v1/buyers/requirements', '/api/v1/services', '/api/v1/plant-cases', '/api/v1/admin/moderation', '/api/v1/admin/review-cases', '/api/v1/onboarding', '/api/v1/enquiries'];
if (in_array($path, $protected, true) && in_array($method, ['POST','PUT','PATCH','DELETE'], true)) {
    kg_json(501, ['error' => 'writes_disabled_in_staging']);
}
kg_json(404, ['error' => 'not_found']);
