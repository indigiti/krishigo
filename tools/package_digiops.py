#!/usr/bin/env python3
"""Prepare a no-database DigiOps release from the *built* Vite static staging app.

Artifact archive name in GitHub: digiops-release
Expected contents when GitHub artifact is unzipped:
    public/index.html
    public/assets/...
    public/.htaccess
    RELEASE.json

DigiOps copies public/ to the configured public_html/krishigo/ directory.
No PHP, Python, private runtime or database is shipped in this first release.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import re
import shutil
from datetime import datetime, timezone

from package_staging import ROOT, DIST, APACHE_RULES, assert_safe_dist

RELEASE = ROOT / 'release'
BASE = '/krishigo/'


def package(destination: Path = RELEASE) -> dict:
    # Fail early on missing or accidentally root-based frontend builds.
    assert_safe_dist(DIST, base=BASE)
    if destination.resolve() == DIST.resolve() or DIST.resolve() in destination.resolve().parents:
        raise ValueError('Release directory must be outside Vite dist')
    if destination.exists():
        shutil.rmtree(destination)
    public = destination / 'public'
    shutil.copytree(DIST, public)
    (public / '.htaccess').write_text(APACHE_RULES, encoding='utf-8')
    (public / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
    (public / 'STAGING_ONLY.txt').write_text(
        'KrishiGo staging demo: fictional prices, sellers, weather, and plant guidance. '
        'No production data, persistent trade, or AI diagnosis.\n', encoding='utf-8')
    # Metadata is intentionally outside public/; it is not served by the web app.
    meta = {
        'schema': 'DIGIOPS-BUILD/1', 'name': 'KrishiGo',
        'version': '0.4-staging', 'public': 'public',
        'path': BASE, 'dataMode': 'mock', 'private': None,
        'branch': os.environ.get('GITHUB_REF_NAME', 'local'),
        'sourceSha': os.environ.get('GITHUB_SHA', 'local'),
        'ciRunId': os.environ.get('GITHUB_RUN_ID', ''),
        'ciRunAttempt': os.environ.get('GITHUB_RUN_ATTEMPT', ''),
        'builtAt': datetime.now(timezone.utc).isoformat(),
    }
    (destination / 'RELEASE.json').write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')
    return {'directory': str(destination), 'publicFiles': sum(p.is_file() for p in public.rglob('*')),
            'branch': meta['branch'], 'sourceSha': meta['sourceSha']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=RELEASE)
    args = parser.parse_args()
    try:
        print(json.dumps(package(args.output), indent=2))
    except ValueError as ex:
        parser.error(str(ex))
