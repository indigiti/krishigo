#!/usr/bin/env python3
"""Create an opt-in, *separate* DigiOps-compatible protected JSON pilot package.
NEVER overwrites the default digiops-release artifact. No databases or credentials.
"""
from __future__ import annotations
import argparse
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from package_digiops import package as package_static
from package_staging import ROOT

SRC = ROOT / 'apps' / 'api-php'
BACKEND = (
    'public/index.php', 'src/Core.php',
    'src/Modules/Registry.php',
    'src/Json/Api.php', 'src/Json/Doctor.php',
    'src/Json/Services.php', 'src/Json/Store.php',
    'src/Json/Queue.php', 'src/Json/ModuleDrafts.php',
    'fixtures/catalog.json', 'fixtures/module-registry.json',
    'fixtures/module-workflow-contracts.json', 'src/Json/Contracts.php',
)

FRONT = r'''<?php
declare(strict_types=1);
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
// The private code path comes from trusted *server* configuration, never a request.
if (getenv('KRISHIGO_API_MODE') !== 'staging' ||
    getenv('KRISHIGO_JSON_WORKFLOWS') !== 'enabled' ||
    getenv('KRISHIGO_STAGE_AUTH') !== 'enabled') {
    http_response_code(503);
    header('Content-Type: application/json');
    echo '{"error":"protected_staging_api_inactive"}';
    exit;
}
$env = getenv('KRISHIGO_PRIVATE_APP_ROOT');
$root = is_string($env) && $env !== '' ? realpath($env) : false;
if ($root === false || !is_dir($root) || !is_dir($root . '/api-service')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo '{"error":"private_runtime_unavailable"}';
    exit;
}
$file = realpath($root . '/api-service/public/index.php');
if ($file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR . 'api-service' . DIRECTORY_SEPARATOR)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo '{"error":"private_router_unavailable"}';
    exit;
}
$uri = (string)($_SERVER['REQUEST_URI'] ?? '');
$path = parse_url($uri, PHP_URL_PATH);
$prefix = '/krishigo/api/v1';
if (!is_string($path) || ($path !== $prefix && !str_starts_with($path, $prefix . '/'))) {
    http_response_code(404);
    exit;
}
$tail = substr($path, strlen($prefix));
$query = parse_url($uri, PHP_URL_QUERY);
$_SERVER['REQUEST_URI'] = '/api/v1' . $tail . (is_string($query) && $query !== '' ? '?' . $query : '');
require $file;
'''
CHILD_RULES = '''Options -Indexes
DirectoryIndex index.php
<IfModule mod_rewrite.c>
 RewriteEngine On
 RewriteBase /krishigo/api/v1/
 RewriteRule ^index\\.php$ - [L]
 RewriteRule ^.*$ index.php [L]
</IfModule>
<IfModule mod_headers.c>
 Header always set Cache-Control "private, no-store"
 Header always set X-Content-Type-Options "nosniff"
 Header always set X-Robots-Tag "noindex, nofollow"
</IfModule>
'''

def package(destination: Path) -> dict:
    destination = destination.resolve()
    if destination == SRC.resolve() or SRC.resolve() in destination.parents:
        raise ValueError('Output must not be inside API source')
    info = package_static(destination)
    public = destination / 'public'
    private = destination / 'private' / 'api-service'
    for relative in BACKEND:
        source = SRC / relative
        if not source.is_file() or source.is_symlink():
            raise ValueError('Missing or unsafe private source: ' + relative)
        target = private / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    api = public / 'api' / 'v1'
    api.mkdir(parents=True, exist_ok=True)
    (api / 'index.php').write_text(FRONT, encoding='utf-8')
    (api / '.htaccess').write_text(CHILD_RULES, encoding='utf-8')
    apache = public / '.htaccess'
    rules = apache.read_text(encoding='utf-8')
    needle = ' RewriteCond %{REQUEST_FILENAME} !-f'
    if needle not in rules:
        raise ValueError('Unexpected SPA rewrite rules; refusing to expose API incorrectly')
    rules = rules.replace(needle, ' RewriteRule ^api/v1(/|$) - [L]\n' + needle, 1)
    apache.write_text(rules, encoding='utf-8')
    meta = json.loads((destination / 'RELEASE.json').read_text())
    meta.update({
        'version': 'm14-protected-pilot',
        'private': 'private',
        'apiMode': 'staging-opt-in',
        'requiresPrivateRootEnv': 'KRISHIGO_PRIVATE_APP_ROOT',
        'publicWritesEnabledByDefault': False,
        'requiresProtectedHostAcceptance': True,
        'database': 'none',
    })
    (destination / 'RELEASE.json').write_text(json.dumps(meta, indent=2)+'\n')
    return {'destination': str(destination), 'private_files': len(BACKEND),
            'public_api_bootstrap': 'public/api/v1/index.php',
            'source_sha': os.getenv('GITHUB_SHA', 'local'),
            'static_files': info['publicFiles']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(package(args.output), indent=2))
