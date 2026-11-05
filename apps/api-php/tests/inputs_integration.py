"""Protected agricultural inputs API HTTP regression. No external feeds or commerce."""
import http.cookiejar
import json
import os
import secrets
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PASSWORD='Pilot-'+secrets.token_hex(12)
HASH=subprocess.check_output(
    ['php','-r','echo password_hash($argv[1],PASSWORD_DEFAULT);',PASSWORD],text=True
).strip()
BASE='/api/v1/staging/inputs'

def today():
    return time.strftime('%Y-%m-%d',time.gmtime())

class InputsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0))
            cls.port=sock.getsockname()[1]
        cls.root=f'http://127.0.0.1:{cls.port}'
        env=dict(os.environ,KRISHIGO_ALLOW_HTTP_LOCAL='1',KRISHIGO_STAGE_AUTH='enabled',
            KRISHIGO_STAGE_USERNAME='pilot-admin',KRISHIGO_STAGE_ROLE='admin',
            KRISHIGO_STAGE_PASSWORD_HASH=HASH,KRISHIGO_JSON_STORE_DIR=cls.temp.name,
            KRISHIGO_JSON_WORKFLOWS='enabled',KRISHIGO_API_MODE='staging')
        cls.proc=subprocess.Popen(['php','-S',f'127.0.0.1:{cls.port}','-t',
            str(ROOT/'public'),str(ROOT/'public/index.php')],
            env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        for _ in range(80):
            try:
                with urllib.request.urlopen(cls.root+'/healthz',timeout=.2):break
            except Exception:time.sleep(.05)
        else:raise RuntimeError('PHP server unavailable')
    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.wait(timeout=5)
        cls.temp.cleanup()
    def setUp(self):
        self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def call(self,method,path,data=None,csrf='',key=''):
        headers={'Accept':'application/json','Content-Type':'application/json'}
        if csrf:headers['X-CSRF-Token']=csrf
        if key:headers['Idempotency-Key']=key
        req=urllib.request.Request(self.root+path,method=method,headers=headers,
          data=None if data is None else json.dumps(data).encode())
        try:
            with self.http.open(req,timeout=10) as response:
                return response.status,json.load(response)
        except urllib.error.HTTPError as exc:
            with exc:return exc.code,json.load(exc)
    def auth(self):
        code,res=self.call('GET','/api/v1/auth/csrf')
        self.assertEqual(code,200)
        code,res=self.call('POST','/api/v1/auth/login',
            {'username':'pilot-admin','password':PASSWORD},res['csrf_token'])
        self.assertEqual(code,200,res)
        return res['csrf_token']
    def test_end_to_end(self):
        code,_=self.call('GET',BASE+'/capabilities')
        self.assertEqual(code,401)
        csrf=self.auth()
        code,info=self.call('GET',BASE+'/capabilities')
        self.assertEqual(code,200,info)
        self.assertEqual(len(info['collections']),12)
        self.assertFalse(info['real_ocr'])
        code,spec=self.call('GET',BASE+'/schemas')
        self.assertEqual(code,200)
        self.assertTrue(spec['schemas']['soil']['private'])
        p=dict(name='Example micronutrient reference',category='micronutrient',
            composition='Example reported composition',crop='Tomato',
            registration_reference='NOT VERIFIED',source_url='https://example.org/label',
            checked_on=today())
        code,_=self.call('POST',BASE+'/records/products',p)
        self.assertEqual(code,419)
        key='inputs-'+secrets.token_hex(13)
        code,res=self.call('POST',BASE+'/records/products',p,csrf,key)
        self.assertEqual(code,201,res)
        product=res['item']['id']
        self.assertEqual(res['item']['status'],'pending-demo')
        self.assertFalse(res['external_publication'])
        code,replay=self.call('POST',BASE+'/records/products',p,csrf,key)
        self.assertEqual(code,200)
        self.assertTrue(replay['replayed'])
        code,_=self.call('POST',BASE+'/records/products',{**p,'source_url':'http://unsafe.test'},csrf,'other-'+secrets.token_hex(12))
        self.assertEqual(code,422)
        code,_=self.call('POST',BASE+'/records/products',{**p,'source_url':'https://admin@unsafe.test/'},csrf,'other-'+secrets.token_hex(12))
        self.assertEqual(code,422)
        code,search=self.call('GET',BASE+'/search?q=micronutrient')
        self.assertEqual(code,200)
        self.assertEqual(search['results'],[])
        code,pending=self.call('GET',BASE+'/admin/products')
        self.assertEqual(code,200)
        self.assertGreaterEqual(len(pending['pending']),1)
        code,_=self.call('POST',f'{BASE}/admin/products/{product}/review',{'decision':'approve','reason':'short'},csrf)
        self.assertEqual(code,422)
        code,review=self.call('POST',f'{BASE}/admin/products/{product}/review',
            {'decision':'approve','reason':'Example source reviewed for staged indexing only.'},csrf)
        self.assertEqual(code,200,review)
        self.assertEqual(review['item']['review']['by'],'pilot-admin')
        self.assertFalse(review['regulatory_certification'])
        code,_=self.call('POST',f'{BASE}/admin/products/{product}/review',
            {'decision':'approve','reason':'Attempt duplicate review.'},csrf)
        self.assertEqual(code,409)
        code,search=self.call('GET',BASE+'/assistant?q=micronutrient')
        self.assertEqual(code,200,search)
        self.assertFalse(search['generative_ai'])
        self.assertEqual(len(search['results']),1)
        self.assertEqual(search['results'][0]['source_url'],p['source_url'])
        soil=dict(crop='Tomato',lab='Sample lab',sample_date=today(),
            measurement='soil pH',value='7.3',unit='pH',note='Field test report to be reviewed')
        code,res=self.call('POST',BASE+'/records/soil',soil,csrf,'soil-'+secrets.token_hex(12))
        self.assertEqual(code,201,res)
        code,_=self.call('GET',BASE+'/records/soil')
        self.assertEqual(code,403)
        code,mine=self.call('GET',BASE+'/records/soil?mine=1')
        self.assertEqual(code,200)
        self.assertEqual(len(mine['items']),1)
        code,_=self.call('GET',BASE+'/admin/soil')
        self.assertEqual(code,403)
        recall=dict(product='Example batch',batch='LOT-TEST-2026',
            source_url='https://example.org/notice',notice_on=today(),
            reason='Illustrative recall review item; not an official recall.')
        code,res=self.call('POST',BASE+'/records/recalls',recall,csrf,'recall-'+secrets.token_hex(12))
        self.assertEqual(code,201)
        rid=res['item']['id']
        code,before=self.call('GET',BASE+'/alerts?batch=LOT-TEST-2026')
        self.assertEqual(code,200)
        self.assertEqual(before['matches'],[])
        code,res=self.call('POST',f'{BASE}/admin/recalls/{rid}/review',
            {'decision':'approve','reason':'Reviewed fictional test notice, not live.'},csrf)
        self.assertEqual(code,200)
        code,after=self.call('GET',BASE+'/alerts?batch=LOT-TEST-2026')
        self.assertEqual(code,200)
        self.assertEqual(len(after['matches']),1)
        self.assertFalse(after['notifications_sent'])

if __name__=='__main__':
    unittest.main()
