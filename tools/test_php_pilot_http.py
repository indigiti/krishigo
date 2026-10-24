"""Exercise the *packaged* public PHP entrypoint with private PHP payload via localhost."""
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request
from package_php_pilot import package

PWD='staging-pilot-'+secrets.token_hex(10)
PWD_HASH=subprocess.check_output(
 ['php','-r','echo password_hash($argv[1],PASSWORD_DEFAULT);',PWD],text=True).strip()

class PilotHTTP(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory()
  cls.folder=Path(cls.temp.name)/'pilot'
  package(cls.folder)
  cls.storage=cls.folder/'private'/'runtime'
  cls.storage.mkdir()
  sock=socket.socket();sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1];sock.close()
  cls.base='http://127.0.0.1:'+str(cls.port)
  env=dict(os.environ,
   KRISHIGO_API_MODE='staging',
   KRISHIGO_STAGE_AUTH='enabled',
   KRISHIGO_JSON_WORKFLOWS='enabled',
   KRISHIGO_STAGE_USERNAME='pilot-admin',
   KRISHIGO_STAGE_PASSWORD_HASH=PWD_HASH,
   KRISHIGO_STAGE_ROLE='admin',
   KRISHIGO_ALLOW_HTTP_LOCAL='1',
   KRISHIGO_PRIVATE_APP_ROOT=str(cls.folder/'private'),
   KRISHIGO_JSON_STORE_DIR=str(cls.storage))
  cls.process=subprocess.Popen(
   ['php','-S',f'127.0.0.1:{cls.port}','-t',str(cls.folder/'public'),
    str(cls.folder/'public/api/v1/index.php')],
   env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  for _ in range(80):
   try:
    with urllib.request.urlopen(cls.base+'/krishigo/api/v1/auth/csrf',timeout=.25):
     break
   except Exception:time.sleep(.05)
 @classmethod
 def tearDownClass(cls):
  cls.process.terminate();cls.process.wait(timeout=5);cls.temp.cleanup()
 def setUp(self):
  self.client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def request(self,method,path,payload=None,csrf=None):
  headers={'Content-Type':'application/json','Accept':'application/json'}
  if csrf:headers['X-CSRF-Token']=csrf
  req=urllib.request.Request(self.base+'/krishigo/api/v1'+path,method=method,headers=headers,
     data=None if payload is None else json.dumps(payload).encode())
  try:
   with self.client.open(req,timeout=6) as reply:return reply.status,json.load(reply)
  except urllib.error.HTTPError as err:
   with err:return err.code,json.load(err)
 def test_real_bootstrap_and_protected_doctor(self):
  code,csrf=self.request('GET','/auth/csrf')
  self.assertEqual(code,200)
  token=csrf['csrf_token']
  code,_=self.request('GET','/staging/operations/doctor')
  self.assertEqual(code,401)
  code,_=self.request('POST','/auth/login',{'username':'pilot-admin','password':PWD})
  self.assertEqual(code,419)
  code,login=self.request('POST','/auth/login',{'username':'pilot-admin','password':PWD},token)
  self.assertEqual(code,200)
  code,doctor=self.request('GET','/staging/operations/doctor')
  self.assertEqual(code,200)
  self.assertEqual(doctor['status'],'healthy')
  self.assertEqual(doctor['database'],'none')
  self.assertEqual(doctor['summary']['diagnostic_domains'],6)
  code,modules=self.request('GET','/admin/module-controls')
  self.assertEqual(code,200)
  self.assertEqual(len(modules['modules']),25)
  code,unknown=self.request('GET','/not-a-real-endpoint')
  self.assertEqual(code,404)
  self.assertEqual(unknown['error'],'not_found')
if __name__=='__main__':unittest.main()
