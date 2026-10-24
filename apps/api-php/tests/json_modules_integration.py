"""Live HTTP checks of JSON modules; no SQL or database service."""
import http.cookiejar,json,os,secrets,socket,subprocess,tempfile,time,unittest,urllib.error,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PASSWORD='Test-'+secrets.token_hex(10)
HASH=subprocess.check_output(['php','-r','echo password_hash($argv[1], PASSWORD_DEFAULT);',PASSWORD],text=True).strip()
class ModuleTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();s=socket.socket();s.bind(('127.0.0.1',0));cls.port=s.getsockname()[1];s.close()
  cls.url='http://127.0.0.1:'+str(cls.port)
  env=dict(os.environ,KRISHIGO_ALLOW_HTTP_LOCAL='1',KRISHIGO_STAGE_AUTH='enabled',KRISHIGO_STAGE_USERNAME='administrator',KRISHIGO_STAGE_ROLE='admin',KRISHIGO_STAGE_PASSWORD_HASH=HASH,KRISHIGO_JSON_STORE_DIR=cls.tmp.name,KRISHIGO_API_MODE='staging')
  cls.server=subprocess.Popen(['php','-S','127.0.0.1:'+str(cls.port),'-t',str(ROOT/'public'),str(ROOT/'public/index.php')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  for _ in range(70):
   try:urllib.request.urlopen(cls.url+'/healthz',timeout=.1).close();break
   except Exception:time.sleep(.07)
 @classmethod
 def tearDownClass(cls):cls.server.terminate();cls.server.wait(timeout=5);cls.tmp.cleanup()
 def setUp(self):self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def request(self,method,path,data=None,token=''):
  headers={'Content-Type':'application/json'}
  if token:headers['X-CSRF-Token']=token
  req=urllib.request.Request(self.url+path,method=method,data=None if data is None else json.dumps(data).encode(),headers=headers)
  try:
   with self.opener.open(req,timeout=4) as r:return r.status,json.load(r)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
 def auth(self):
  code,r=self.request('GET','/api/v1/auth/csrf');self.assertEqual(code,200)
  code,r=self.request('POST','/api/v1/auth/login',{'username':'administrator','password':PASSWORD},r['csrf_token']);self.assertEqual(code,200)
  return r['csrf_token']
 def test_auth_cascade_and_repair(self):
  code,r=self.request('GET','/api/v1/modules/registry');self.assertEqual(code,200);self.assertEqual(len(r['modules']),25)
  code,_=self.request('GET','/api/v1/admin/module-controls');self.assertEqual(code,401)
  token=self.auth()
  code,_=self.request('POST','/api/v1/admin/module-controls/2',{'enabled':False});self.assertEqual(code,419)
  code,r=self.request('POST','/api/v1/admin/module-controls/2',{'enabled':False},token);self.assertEqual(code,200)
  self.assertFalse(r['flags']['2']);self.assertFalse(r['flags']['3']);self.assertFalse(r['flags']['24'])
  code,_=self.request('GET','/api/v1/marketplace/listings');self.assertEqual(code,404)
  code,_=self.request('POST','/api/v1/admin/module-controls/3',{'enabled':True},token);self.assertEqual(code,409)
  (Path(self.tmp.name)/'modules-state.json').write_text('{damaged')
  code,r=self.request('GET','/api/v1/modules/registry');self.assertEqual(code,200);self.assertTrue(r['recovered'])
  code,r=self.request('POST','/api/v1/admin/module-controls/reset',{},token);self.assertEqual(code,200)
  code,_=self.request('GET','/api/v1/marketplace/listings');self.assertEqual(code,200)
  (Path(self.tmp.name)/'modules-state.json').write_text('{bad')
  (Path(self.tmp.name)/'modules-last-good.json').write_text('{bad')
  code,_=self.request('GET','/api/v1/modules/registry');self.assertEqual(code,503)
if __name__=='__main__':unittest.main()
