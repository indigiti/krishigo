"""Real PHP HTTP regression for the opt-in JSON service adapters; no SQL dependency."""
import http.cookiejar, json, os, secrets, socket, subprocess, tempfile, time
import unittest, urllib.error, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PASSWORD='Stage-'+secrets.token_hex(12)
HASH=subprocess.check_output(['php','-r','echo password_hash($argv[1],PASSWORD_DEFAULT);',PASSWORD],text=True).strip()
SAMPLES={
 'marketplace': {'crop':'Tomato','district':'Pune','grade':'A','quantity_kg':1000,'price_per_kg':24},
 'buyers': {'crop':'Tomato','district':'Pune','quantity_kg':1200},
 'community': {'topic':'Soil moisture','body':'Example observational discussion only.'},
 'plant': {'crop':'Tomato','symptoms':'Illustrative brown patches. No diagnosis.','district':'Pune'},
 'services': {'service_type':'Tractor hire','district':'Pune','description':'Example rental request, no provider contacted.'},
 'editorial': {'title':'Example agricultural update','summary':'Draft content requiring source verification.','category':'News'}
}
class ServerCase(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory()
  sock=socket.socket();sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1];sock.close()
  cls.base='http://127.0.0.1:'+str(cls.port)
  env=dict(os.environ,KRISHIGO_ALLOW_HTTP_LOCAL='1',KRISHIGO_STAGE_AUTH='enabled',
    KRISHIGO_STAGE_USERNAME='administrator',KRISHIGO_STAGE_ROLE='admin',
    KRISHIGO_STAGE_PASSWORD_HASH=HASH,KRISHIGO_JSON_STORE_DIR=cls.tmp.name,
    KRISHIGO_JSON_WORKFLOWS='enabled',KRISHIGO_API_MODE='staging')
  cls.server=subprocess.Popen(['php','-S',f'127.0.0.1:{cls.port}','-t',str(ROOT/'public'),str(ROOT/'public/index.php')],
    env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  for _ in range(80):
   try:
    with urllib.request.urlopen(cls.base+'/healthz',timeout=.2):break
   except Exception:time.sleep(.06)
 @classmethod
 def tearDownClass(cls):
  cls.server.terminate();cls.server.wait(timeout=5);cls.tmp.cleanup()
 def setUp(self):
  self.browser=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,method,path,body=None,csrf='',request_key=''):
  headers={'Accept':'application/json','Content-Type':'application/json'}
  if csrf:headers['X-CSRF-Token']=csrf
  if request_key:headers['Idempotency-Key']=request_key
  req=urllib.request.Request(self.base+path,method=method,
    data=None if body is None else json.dumps(body).encode(),headers=headers)
  try:
   with self.browser.open(req,timeout=5) as resp:return resp.status,json.load(resp)
  except urllib.error.HTTPError as exc:
   with exc:return exc.code,json.load(exc)
 def auth(self):
  code,body=self.call('GET','/api/v1/auth/csrf');self.assertEqual(code,200)
  code,body=self.call('POST','/api/v1/auth/login',
     {'username':'administrator','password':PASSWORD},body['csrf_token'])
  self.assertEqual(code,200)
  return body['csrf_token']
 def test_json_workflows(self):
  base='/api/v1/staging'
  code,_=self.call('GET',base+'/workflows/health');self.assertEqual(code,401)
  code,data=self.call('GET',base+'/records/marketplace');self.assertEqual(code,200);self.assertEqual(data['items'],[])
  code,_=self.call('POST',base+'/records/marketplace',SAMPLES['marketplace']);self.assertEqual(code,401)
  csrf=self.auth()
  code,_=self.call('POST',base+'/records/marketplace',SAMPLES['marketplace'],request_key='mkt-'+secrets.token_hex(10));self.assertEqual(code,419)
  code,_=self.call('POST',base+'/records/marketplace',SAMPLES['marketplace'],csrf);self.assertEqual(code,422)
  key='market-'+secrets.token_hex(12)
  code,_=self.call('POST',base+'/records/marketplace',{**SAMPLES['marketplace'],'quantity_kg':-4},csrf,key);self.assertEqual(code,422)
  code,created=self.call('POST',base+'/records/marketplace',{**SAMPLES['marketplace'],'owner':'attacker','status':'reviewed-demo'},csrf,key)
  self.assertEqual(code,201);self.assertTrue(created['demo']);self.assertFalse(created['delivered'])
  self.assertEqual(created['item']['owner'],'administrator')
  self.assertEqual(created['item']['status'],'pending-demo')
  code,repeat=self.call('POST',base+'/records/marketplace',{**SAMPLES['marketplace']},csrf,key)
  self.assertEqual(code,200);self.assertTrue(repeat['replayed']);self.assertEqual(repeat['item']['id'],created['item']['id'])
  code,_=self.call('POST',base+'/records/marketplace',{**SAMPLES['marketplace'],'price_per_kg':55},csrf,key)
  self.assertEqual(code,409)
  code,public=self.call('GET',base+'/records/marketplace');self.assertEqual(code,200);self.assertEqual(public['items'],[])
  code,mine=self.call('GET',base+'/records/marketplace?mine=1');self.assertEqual(code,200);self.assertEqual(len(mine['items']),1)
  code,pending=self.call('GET',base+'/admin/records/marketplace');self.assertEqual(code,200);self.assertEqual(len(pending['pending']),1)
  review=f"{base}/admin/records/marketplace/{created['item']['id']}/review"
  code,ok=self.call('POST',review,{'decision':'approve'},csrf)
  self.assertEqual(code,200);self.assertEqual(ok['item']['status'],'reviewed-demo')
  self.assertFalse(ok['published_externally'])
  code,_=self.call('POST',review,{'decision':'approve'},csrf);self.assertEqual(code,409)
  code,public=self.call('GET',base+'/records/marketplace');self.assertEqual(code,200);self.assertEqual(len(public['items']),1)
  for domain,sample in SAMPLES.items():
   if domain=='marketplace':continue
   code,result=self.call('POST',base+'/records/'+domain,sample,csrf,domain+'-'+secrets.token_hex(9))
   self.assertEqual(code,201,domain)
   self.assertEqual(result['item']['status'],'pending-demo')
  code,_=self.call('GET',base+'/records/plant');self.assertEqual(code,403)
  code,plant=self.call('GET',base+'/records/plant?mine=1');self.assertEqual(code,200);self.assertEqual(len(plant['items']),1)
  code,_=self.call('GET',base+'/admin/records/plant');self.assertEqual(code,403)
  code,health=self.call('GET',base+'/workflows/health');self.assertEqual(code,200)
  self.assertEqual(health['database'],'none');self.assertEqual(len(health['domains']),6)
  for domain in SAMPLES:self.assertGreaterEqual(health['domains'][domain]['records'],1)
  # Protected queue: no unauthenticated reads/writes, and only allowlisted no-side-effect jobs.
  code,empty=self.call('GET',base+'/jobs');self.assertEqual(code,200)
  self.assertEqual(empty['health']['database'],'none')
  code,_=self.call('POST',base+'/jobs',{'kind':'execute_shell','domain':'marketplace'},csrf);self.assertEqual(code,422)
  code,_=self.call('POST',base+'/jobs',{'kind':'domain_snapshot','domain':'marketplace'});self.assertEqual(code,419)
  code,enqueued=self.call('POST',base+'/jobs',{'kind':'domain_snapshot','domain':'marketplace'},csrf)
  self.assertEqual(code,202);self.assertFalse(enqueued['deduplicated'])
  code,duplicate=self.call('POST',base+'/jobs',{'kind':'domain_snapshot','domain':'marketplace'},csrf)
  self.assertEqual(code,202);self.assertTrue(duplicate['deduplicated'])
  self.assertEqual(duplicate['job']['id'],enqueued['job']['id'])
  code,processed=self.call('POST',base+'/jobs/process',{},csrf);self.assertEqual(code,200)
  self.assertEqual(processed['processed'],1);self.assertFalse(processed['external_actions'])
  code,queue=self.call('GET',base+'/jobs');self.assertEqual(code,200)
  self.assertEqual(queue['items'][0]['status'],'succeeded')
  self.assertNotIn('token',queue['items'][0])
  code,restored=self.call('POST',base+'/jobs/recover',{},csrf);self.assertEqual(code,200)
  self.assertEqual(restored['recovered_jobs'],0)
  (Path(self.tmp.name)/'safe-jobs-state.json').write_text('{corrupted')
  code,queue=self.call('GET',base+'/jobs');self.assertEqual(code,200)
  self.assertTrue(queue['health']['recovered'])
  # Fixture controls and the public feed remain separate.
  # Recovery is scoped to the affected domain. Never recreate from scratch after corruption.
  store=Path(self.tmp.name)
  (store/'workflow-marketplace-state.json').write_text('{corrupted')
  code,recovered=self.call('GET',base+'/records/marketplace')
  self.assertEqual(code,200);self.assertTrue(recovered['recovered'])
  code,config=self.call('GET','/api/v1/admin/module-controls');self.assertEqual(code,200)
  code,_=self.call('POST','/api/v1/admin/module-controls/2',
   {'enabled':False,'expected_revision':config['revision']},csrf);self.assertEqual(code,200)
  code,_=self.call('GET',base+'/records/marketplace');self.assertEqual(code,404)
  code,_=self.call('POST',base+'/records/marketplace',SAMPLES['marketplace'],csrf,'blocked-'+secrets.token_hex(9));self.assertEqual(code,404)
  code,config=self.call('GET','/api/v1/admin/module-controls');self.assertEqual(code,200)
  code,_=self.call('POST','/api/v1/admin/module-controls/reset',{'expected_revision':config['revision']},csrf);self.assertEqual(code,200)
  (store/'workflow-marketplace-state.json').write_text('{broken')
  (store/'workflow-marketplace-last-good.json').write_text('{broken')
  code,_=self.call('GET',base+'/records/marketplace');self.assertEqual(code,503)

if __name__=='__main__':unittest.main()
