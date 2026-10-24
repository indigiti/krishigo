"""Offline no-database HTTP tests for the PHP staging boundary (Python stdlib only)."""
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PASSWORD = 'Integration-Test-Only!-' + secrets.token_hex(12)
PASSWORD_HASH = subprocess.check_output(['php', '-r', 'echo password_hash($argv[1], PASSWORD_DEFAULT);', PASSWORD], text=True).strip()

class AppTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sock = socket.socket(); sock.bind(('127.0.0.1', 0)); cls.port = sock.getsockname()[1]; sock.close()
        cls.base = f'http://127.0.0.1:{cls.port}'
        env = dict(os.environ, KRISHIGO_ALLOW_HTTP_LOCAL='1', KRISHIGO_STAGE_AUTH='enabled', KRISHIGO_STAGE_USERNAME='test_editor', KRISHIGO_STAGE_PASSWORD_HASH=PASSWORD_HASH, KRISHIGO_STAGE_ROLE='editor')
        cls.server = subprocess.Popen(['php', '-S', f'127.0.0.1:{cls.port}', '-t', str(ROOT/'public'), str(ROOT/'public'/'index.php')], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(80):
            try:
                urllib.request.urlopen(cls.base + '/healthz', timeout=.2).close(); break
            except Exception:
                time.sleep(.1)
        else:
            raise RuntimeError('PHP server failed')
    @classmethod
    def tearDownClass(cls):
        cls.server.terminate(); cls.server.wait(timeout=5)
    def setUp(self):
        self.cookies = http.cookiejar.CookieJar()
        self.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
    def request(self, method, path, body=None, headers=None):
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(self.base+path, data=data, method=method, headers={'Content-Type':'application/json', **(headers or {})})
        try:
            with self.client.open(request,timeout=3) as response: return response.status, json.load(response), dict(response.headers)
        except urllib.error.HTTPError as err: return err.code, json.load(err), dict(err.headers)
    def test_public_endpoints_are_demonstrations(self):
        status, body, _ = self.request('GET','/api/v1/status')
        self.assertEqual(status,200); self.assertEqual(body['database'],'disabled'); self.assertFalse(body['public_writes'])
        for path, expected in [('/api/v1/marketplace/listings',6),('/api/v1/community/posts',3),('/api/v1/buyers/requirements',4),('/api/v1/services',8),('/api/v1/content',6),('/api/v1/modules',25)]:
            status,body,headers=self.request('GET',path)
            self.assertEqual(status,200);self.assertEqual(len(body),expected);self.assertEqual({k.lower():v for k,v in headers.items()}.get('x-krishigo-data'),'fictional-demo')
    def test_csrf_login_session_roles_logout(self):
        status, body, _ = self.request('POST','/api/v1/auth/login', {'username':'test_editor','password':PASSWORD})
        self.assertEqual(status,419)
        status, body, _ = self.request('GET','/api/v1/admin/moderation')
        self.assertEqual(status,401)
        status, body, _ = self.request('GET','/api/v1/auth/csrf')
        csrf=body['csrf_token']; self.assertEqual(status,200)
        status, _, _ = self.request('POST','/api/v1/auth/login',{'username':'test_editor','password':'wrong'}, {'X-CSRF-Token':csrf})
        self.assertEqual(status,401)
        status, body, _ = self.request('POST','/api/v1/auth/login',{'username':'test_editor','password':PASSWORD}, {'X-CSRF-Token':csrf})
        self.assertEqual(status,200);self.assertEqual(body['identity']['role'],'editor')
        rotated=body['csrf_token']; self.assertNotEqual(csrf,rotated)
        status, body, _=self.request('GET','/api/v1/admin/moderation');self.assertEqual(status,200);self.assertFalse(body['writes_enabled'])
        status, _, _=self.request('POST','/api/v1/auth/logout',{}, {'X-CSRF-Token':csrf});self.assertEqual(status,419)
        status, _, _=self.request('POST','/api/v1/auth/logout',{}, {'X-CSRF-Token':rotated});self.assertEqual(status,200)
        status, _, _=self.request('GET','/api/v1/admin/moderation');self.assertEqual(status,401)
    def test_demo_writes_unavailable(self):
        for path in ['/api/v1/marketplace/listings','/api/v1/plant-cases','/api/v1/admin/moderation']:
            status,body,_ = self.request('POST',path,{'title':'hi'})
            self.assertEqual(status,501);self.assertEqual(body['error'],'writes_disabled_in_staging')
    def test_m3_listing_details_are_allowlisted(self):
        status,body,headers = self.request('GET','/api/v1/marketplace/listings/1')
        self.assertEqual(status,200)
        self.assertEqual(body['id'],1)
        self.assertTrue(body['demo'])
        self.assertEqual({k.lower():v for k,v in headers.items()}.get('x-krishigo-data'),'fictional-demo')
        for path in ['/api/v1/marketplace/listings/0','/api/v1/marketplace/listings/999','/api/v1/marketplace/listings/abc','/api/v1/marketplace/listings/1/other']:
            status,_,_=self.request('GET',path)
            self.assertEqual(status,404)
    def test_m3_review_queue_requires_editor_and_all_writes_stay_off(self):
        status,_,_=self.request('GET','/api/v1/admin/review-cases')
        self.assertEqual(status,401)
        _,body,_=self.request('GET','/api/v1/auth/csrf')
        status,_,_=self.request('POST','/api/v1/auth/login',{'username':'test_editor','password':PASSWORD}, {'X-CSRF-Token':body['csrf_token']})
        self.assertEqual(status,200)
        status,body,_=self.request('GET','/api/v1/admin/review-cases')
        self.assertEqual(status,200);self.assertTrue(body['demo']);self.assertFalse(body['writes_enabled'])
        self.assertEqual(len(body['items']),3)
        for path in ['/api/v1/onboarding','/api/v1/enquiries','/api/v1/admin/review-cases']:
            status,body,_ = self.request('POST',path,{'demo':True})
            self.assertEqual(status,501);self.assertEqual(body['error'],'writes_disabled_in_staging')
    def test_input_validation_and_origin(self):
        status,body,_ = self.request('GET','/api/v1/auth/csrf');csrf=body['csrf_token']
        status, _, _=self.request('POST','/api/v1/auth/login',{'username':'test_editor','password':PASSWORD},{'X-CSRF-Token':csrf,'Origin':'https://evil.example'})
        self.assertEqual(status,403)
        status, _, _=self.request('POST','/api/v1/auth/login',{'username':123,'password':PASSWORD},{'X-CSRF-Token':csrf})
        self.assertEqual(status,422)
        status, _, _=self.request('OPTIONS','/api/v1/marketplace/listings');self.assertEqual(status,405)
if __name__ == '__main__': unittest.main()
