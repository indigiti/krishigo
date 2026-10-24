#!/usr/bin/env python3
"""Build a deployable *static* no-database staging artifact from apps/web/dist.

Never deploy automatically. Cloudways access control and HTTPS are prerequisites.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'apps/web/dist'
APACHE_RULES = '''Options -Indexes
DirectoryIndex index.html
<IfModule mod_headers.c>
 Header always set X-Content-Type-Options "nosniff"
 Header always set X-Frame-Options "DENY"
 Header always set Referrer-Policy "strict-origin-when-cross-origin"
 Header always set X-Robots-Tag "noindex, nofollow, noarchive"
 Header always set Permissions-Policy "camera=(self), microphone=(), geolocation=()"
</IfModule>
<IfModule mod_rewrite.c>
 RewriteEngine On
 RewriteBase /krishigo/
 RewriteCond %{REQUEST_FILENAME} !-f
 RewriteCond %{REQUEST_FILENAME} !-d
 RewriteRule ^ index.html [L]
</IfModule>
'''

def assert_safe_dist(dist: Path, base: str = '/krishigo/') -> None:
    if not dist.is_dir():
        raise ValueError('Missing apps/web/dist: run Vite in mock mode')
    index = dist / 'index.html'
    if not index.exists() or not (dist / 'assets').is_dir():
        raise ValueError('Missing static entrypoint or compiled assets')
    html = index.read_text(encoding='utf-8')
    if not re.search(r'<meta\s+name="robots"\s+content="noindex,nofollow,noarchive"', html):
        raise ValueError('Staging must not be indexed by crawlers')
    if not re.search(r'<script[^>]+(?:src=|src=["\'])[^>]*' + re.escape(base) + r'assets/', html):
        raise ValueError('Vite assets are not built for the configured /krishigo/ browser path')
    if re.search(r'<(?:script|link)[^>]+(?:src|href)=["\']/(?:assets|favicon\.svg|manifest\.webmanifest)', html):
        raise ValueError('Root-relative app assets would break under /krishigo/')
    blocked = {'.env', '.env.local', 'config.php', 'db.php', '.htpasswd', 'id_rsa', '.git', 'node_modules'}
    for path in dist.rglob('*'):
        if not path.is_file():
            continue
        relative = path.relative_to(dist)
        if any(part in blocked or part.startswith('.env.') for part in relative.parts):
            raise ValueError(f'Sensitive file in static dist: {relative}')
        if path.suffix.lower() in {'.php', '.sql', '.py', '.pem', '.key', '.map'}:
            raise ValueError(f'Unexpected executable, secret or source map in dist: {relative}')


def package(output: Path) -> dict:
    assert_safe_dist(DIST)
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for path in sorted(DIST.rglob('*')):
            if path.is_file():
                z.write(path, path.relative_to(DIST).as_posix())
        z.writestr('.htaccess', APACHE_RULES)
        z.writestr('robots.txt', 'User-agent: *\nDisallow: /\n')
        z.writestr('STAGING_ONLY.txt', 'KrishiGo staging demonstration. All listings, prices, weather and diagnostics are fictional. No database or live AI.\n')
    return {'archive': str(output), 'bytes': output.stat().st_size, 'files': len(z.namelist())}

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--output', type=Path, default=ROOT / 'krishigo-staging-static.zip')
    args = p.parse_args()
    try:
        print(json.dumps(package(args.output), indent=2))
    except ValueError as exc:
        p.error(str(exc))
