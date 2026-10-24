"""No MySQL driver needed: production mode must fail closed and staging stay unchanged."""
import http.cookiejar
import json
import os
from pathlib import Path
import socket
import subprocess
import time
import unittest
import urllib.error
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
class ModeBoundaryTests(unittest.TestCase):
    def test_unconfigured_production_mode_fails_closed(self):
        with socket.socket() as s:
            s.bind(('127.0.0.1',0));port=s.getsockname()[1]
        env=dict(os.environ,KRISHIGO_API_MODE='production',KRISHIGO_ALLOW_HTTP_LOCAL='1',KRISHIGO_DB_DSN='',KRISHIGO_RATE_SALT='')
        server=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(ROOT/'public'),str(ROOT/'public/index.php')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        try:
            for _ in range(40):
                try:urllib.request.urlopen(f'http://127.0.0.1:{port}/healthz',timeout=.2);break
                except Exception:time.sleep(.1)
            for path in ['/api/v1/status','/api/v1/marketplace/listings','/api/v1/auth/me']:
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    urllib.request.urlopen(f'http://127.0.0.1:{port}'+path,timeout=3)
                self.assertEqual(caught.exception.code,503)
                self.assertEqual(json.load(caught.exception)['error'],'service_unavailable')
        finally:
            server.terminate();server.wait(timeout=5)
    def test_staging_never_loads_production_router_without_opt_in(self):
        index=(ROOT/'public/index.php').read_text()
        self.assertIn("kg_env('KRISHIGO_API_MODE') === 'production'",index)
        self.assertIn('writes_disabled_in_staging',index)
        self.assertFalse((ROOT/'public').joinpath('database').exists())
if __name__=='__main__':unittest.main()
