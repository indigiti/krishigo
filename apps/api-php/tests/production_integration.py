"""Production-mode HTTP tests, requiring an isolated ephemeral MySQL _test database.
Runs separately from the database-free mock staging suite.
"""
from __future__ import annotations
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import time
import unittest
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
ADMIN_PASS = 'CI-admin-' + secrets.token_hex(12)

class Client:
    def __init__(self,base):
        self.base=base
        self.cookies=http.cookiejar.CookieJar()
        self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.csrf=None
    def call(self,method,path,body=None,csrf=True,extra=None):
        headers={'Content-Type':'application/json', **(extra or {})}
        if csrf and self.csrf and method not in ('GET','HEAD'):
            headers['X-CSRF-Token']=self.csrf
        req=urllib.request.Request(self.base+path,method=method,data=json.dumps(body or {}).encode('utf8') if method not in ('GET','HEAD') else None,headers=headers)
        try:
            with self.http.open(req,timeout=6) as res:
                data=json.load(res)
                return res.status,data
        except urllib.error.HTTPError as e:
            return e.code,json.load(e)
    def prepare(self):
        st,data=self.call('GET','/api/v1/auth/csrf')
        assert st==200,(st,data)
        self.csrf=data['csrf_token']
    def register(self,email,role):
        return self.call('POST','/api/v1/auth/register',{'display_name':'Example User','email':email,'password':'A-strong-test-password-2026!','role':role})
    def login(self,email,password='A-strong-test-password-2026!'):
        st,data=self.call('POST','/api/v1/auth/login',{'email':email,'password':password})
        if st==200:self.csrf=data['csrf_token']
        return st,data

class ProductionFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if '_test' not in os.environ.get('KRISHIGO_DB_DSN',''):
            raise unittest.SkipTest('Production integration requires a configured _test database')
        cls.env=os.environ.copy()
        cls.env.update(KRISHIGO_API_MODE='production',KRISHIGO_ALLOW_HTTP_LOCAL='1',KRISHIGO_TEST_ADMIN_PASSWORD=ADMIN_PASS)
        subprocess.run(['php',str(ROOT/'tests/init_production_database.php')],env=cls.env,check=True,stdout=subprocess.DEVNULL)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1]
        cls.base=f'http://127.0.0.1:{cls.port}'
        cls.server=subprocess.Popen(['php','-S',f'127.0.0.1:{cls.port}','-t',str(ROOT/'public'),str(ROOT/'public/index.php')],env=cls.env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        for _ in range(75):
            try:
                urllib.request.urlopen(cls.base+'/healthz',timeout=.3).close();break
            except Exception:time.sleep(.1)
        else:raise RuntimeError('Production API did not start')
    @classmethod
    def tearDownClass(cls):
        if hasattr(cls,'server'):
            cls.server.terminate();cls.server.wait(timeout=5)
    def test_secure_multiactor_end_to_end(self):
        anonymous=Client(self.base)
        st,info=anonymous.call('GET','/api/v1/status')
        self.assertEqual(st,200);self.assertFalse(info['plant_diagnosis']);self.assertEqual(info['mode'],'production')
        st,_=anonymous.call('POST','/api/v1/auth/register',{'role':'admin'},csrf=False)
        self.assertEqual(st,419)
        anonymous.prepare()
        st,_=anonymous.register('grower@krishigo.test','farmer')
        self.assertEqual(st,201)
        buyer=Client(self.base);buyer.prepare()
        st,_=buyer.register('buyer@krishigo.test','buyer');self.assertEqual(st,201)
        st,_=buyer.login('buyer@krishigo.test');self.assertEqual(st,200)
        farmer=Client(self.base);farmer.prepare()
        st,_=farmer.login('grower@krishigo.test');self.assertEqual(st,200)
        admin=Client(self.base);admin.prepare()
        st,_=admin.login('admin@krishigo.test',ADMIN_PASS);self.assertEqual(st,200)
        st,_=buyer.call('POST','/api/v1/marketplace/listings',{'crop':'Onion'});self.assertEqual(st,403)
        st,listing=farmer.call('POST','/api/v1/marketplace/listings',{'crop':'Tomato','district':'Pune','quantity_kg':900,'price_per_kg':31.50,'description':'Fresh Grade A produce'});self.assertEqual(st,201)
        lid=listing['id'];self.assertEqual(listing['status'],'pending_review')
        st,requirements=buyer.call('POST','/api/v1/buyers/requirements',{'crop':'Tomato','district':'Pune','quantity_kg':600,'target_price_per_kg':32});self.assertEqual(st,201)
        st,post=farmer.call('POST','/api/v1/community/posts',{'topic':'Tomato farming','body':'Example post waiting for editorial review'});self.assertEqual(st,201)
        st,crop=farmer.call('POST','/api/v1/plant-cases',{'crop':'Tomato','growth_stage':'fruiting','symptoms':'Example leaf colour change after rainfall'});self.assertEqual(st,201)
        st,own=farmer.call('GET','/api/v1/plant-cases/mine');self.assertEqual(st,200);self.assertEqual(len(own),1)
        st,other=buyer.call('GET','/api/v1/plant-cases/mine');self.assertEqual(st,200);self.assertEqual(len(other),0)
        st,_=anonymous.call('GET','/api/v1/plant-cases');self.assertEqual(st,403)
        st,published=anonymous.call('GET','/api/v1/marketplace/listings');self.assertEqual(st,200);self.assertEqual(published,[])
        st,_=anonymous.call('GET',f'/api/v1/marketplace/listings/{lid}');self.assertEqual(st,404)
        st,_=farmer.call('GET',f'/api/v1/marketplace/listings/{lid}');self.assertEqual(st,200)
        st,_=farmer.call('GET','/api/v1/admin/review-cases');self.assertEqual(st,403)
        st,_=admin.call('POST',f'/api/v1/admin/review-cases/listing/{lid}/decision',{'decision':'approve','reason':'Identity not yet verified'});self.assertEqual(st,409)
        st,queue=admin.call('GET','/api/v1/admin/review-cases');self.assertEqual(st,200);self.assertGreaterEqual(len(queue['items']),3)
        st,who=farmer.call('GET','/api/v1/auth/me');farmer_id=who['identity']['id']
        st,_=admin.call('POST',f'/api/v1/admin/users/{farmer_id}/verify',{'reason':'External identity evidence checked by staff'});self.assertEqual(st,200)
        st,_=admin.call('POST',f'/api/v1/admin/review-cases/listing/{lid}/decision',{'decision':'approve','reason':'Seller and lot reviewed by operations'});self.assertEqual(st,200)
        st,_=admin.call('POST',f'/api/v1/admin/review-cases/listing/{lid}/decision',{'decision':'approve','reason':'Attempt at duplicate approval'});self.assertEqual(st,409)
        st,published=anonymous.call('GET','/api/v1/marketplace/listings');self.assertEqual(st,200);self.assertEqual(len(published),1)
        st,bad=buyer.call('POST','/api/v1/enquiries',{'listing_id':lid,'quantity_kg':2000,'message':'Please quote transport'});self.assertEqual(st,422)
        st,enquiry=buyer.call('POST','/api/v1/enquiries',{'listing_id':lid,'quantity_kg':300,'message':'Please share packing details'});self.assertEqual(st,201);self.assertFalse(enquiry['notifications_sent'])
        st,view=farmer.call('GET','/api/v1/enquiries/mine');self.assertEqual(st,200);self.assertEqual(len(view),1)
        st,_=anonymous.call('GET','/api/v1/enquiries/mine');self.assertEqual(st,401)
        st,post_list=anonymous.call('GET','/api/v1/community/posts');self.assertEqual(st,200);self.assertEqual(post_list,[])
        st,_=admin.call('POST',f"/api/v1/admin/review-cases/post/{post['id']}/decision",{'decision':'approve','reason':'Reviewed community guidance and wording'});self.assertEqual(st,200)
        st,post_list=anonymous.call('GET','/api/v1/community/posts');self.assertEqual(len(post_list),1)
        st,_=farmer.call('POST','/api/v1/community/posts',{'topic':'Test','body':'Blocked CSRF'},csrf=False,extra={'X-CSRF-Token':'wrong'});self.assertEqual(st,419)
        st,_=farmer.call('POST','/api/v1/community/posts',{'topic':'Test','body':'Blocked Origin'},extra={'Origin':'https://other.example'});self.assertEqual(st,403)
        st,_=farmer.call('POST','/api/v1/community/posts',{'topic':'Test','body':'<script>alert(1)</script>'});self.assertEqual(st,201)
        st,_=farmer.call('POST','/api/v1/auth/logout',{});self.assertEqual(st,200)
        st,_=farmer.call('GET','/api/v1/plant-cases/mine');self.assertEqual(st,401)
    def test_production_route_never_exposes_sample_fixture(self):
        c=Client(self.base)
        st,data=c.call('GET','/api/v1/modules');self.assertEqual(st,404)
        st,data=c.call('GET','/api/v1/services');self.assertEqual(st,404)

if __name__=='__main__':unittest.main()
