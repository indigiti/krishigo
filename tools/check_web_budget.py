#!/usr/bin/env python3
"""Fail CI when an uncompressed static build would become excessively heavy.

Measured against gzipped transfer sizes; this is a build-budget gate, not a
substitute for LCP/INP/CLS field measurements.
"""
from __future__ import annotations
import gzip
from pathlib import Path

DIST=Path(__file__).resolve().parents[1]/'apps/web/dist'
# Generous initial targets for a 15+ screen dashboard; tighten using release telemetry.
MAX_TOTAL_JS_GZIP = 400 * 1024
MAX_CSS_GZIP = 90 * 1024
MAX_SINGLE_ASSET_GZIP = 200 * 1024

def check(dist: Path = DIST) -> dict:
    if not dist.is_dir():raise ValueError('Build assets unavailable')
    assets=[p for p in dist.rglob('*') if p.is_file()]
    js=[p for p in assets if p.suffix=='.js']
    css=[p for p in assets if p.suffix=='.css']
    if not js or not css:raise ValueError('Expected JS and CSS assets')
    sizes={p:len(gzip.compress(p.read_bytes(),compresslevel=9,mtime=0)) for p in js+css}
    total_js=sum(sizes[p] for p in js)
    total_css=sum(sizes[p] for p in css)
    if total_js>MAX_TOTAL_JS_GZIP:raise ValueError(f'JS transfer budget exceeded: {total_js} > {MAX_TOTAL_JS_GZIP}')
    if total_css>MAX_CSS_GZIP:raise ValueError(f'CSS transfer budget exceeded: {total_css} > {MAX_CSS_GZIP}')
    large=[p.name for p,n in sizes.items() if n>MAX_SINGLE_ASSET_GZIP]
    if large:raise ValueError(f'Oversized individual assets: {large}')
    return {'js_files':len(js),'js_gzip_bytes':total_js,'css_gzip_bytes':total_css,'largest_gzip_asset':max(sizes.values())}

if __name__=='__main__':
    import json
    print(json.dumps(check(),indent=2))
