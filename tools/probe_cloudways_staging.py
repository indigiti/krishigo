#!/usr/bin/env python3
"""Read-only Cloudways candidate acceptance. Does not authenticate or perform writes."""
import json, statistics, sys, time, urllib.error, urllib.request
from pathlib import Path

ORIGIN = 'https://stage.digiti.in'
ROOT = '/krishigo/'
REPORT = Path('reports/m13-cloudways-probe.json')
HEADERS = {'User-Agent':'KrishiGo-M13-readonly-acceptance/1.0','Accept':'text/html,application/json'}
def get(path):
 start=time.perf_counter()
 req=urllib.request.Request(ORIGIN+path,headers=HEADERS,method='GET')
 try:
  with urllib.request.urlopen(req,timeout=8) as response:
   status=response.status
   body=response.read(4096)
   content=response.headers.get('Content-Type','')
 except urllib.error.HTTPError as e:
  status=e.code;body=e.read(4096);content=e.headers.get('Content-Type','')
 return {'status':status,'ttfb_proxy_ms':round((time.perf_counter()-start)*1000,2),
         'content_type':content.split(';')[0],'sample_length':len(body)}
def main():
 results={'target':ORIGIN+ROOT,'measurement':'external_GitHub_runner_not_RUM',
          'timestamp_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
 problems=[]
 try:
  main=get(ROOT)
  results['homepage']=main
  if main['status']!=200:problems.append('Public staging page inaccessible; browser RUM not measurable')
  api=get(ROOT+'api/v1/staging/workflows/health')
  results['anonymous_workflow_health']=api
  if api['status']==200:problems.append('Critical: protected workflow health exposed anonymously')
  elif api['status']==404:problems.append('Protected PHP route absent on Cloudways; cannot accept JSON service')
  elif api['status'] not in (401,403):problems.append('Protected API response unexpected: '+str(api['status']))
  times=[]
  for _ in range(16):
   outcome=get(ROOT)
   if outcome['status']!=200:break
   times.append(outcome['ttfb_proxy_ms'])
  if times:
   ordered=sorted(times)
   results['http_samples']={'requests':len(times),'p50_roundtrip_ms':round(statistics.median(ordered),2),
       'p95_roundtrip_ms':ordered[int((len(ordered)-1)*.95)]}
 except Exception as err:
  problems.append('Probe error: '+type(err).__name__)
 results['issues']=problems
 results['accepted']=not problems
 REPORT.parent.mkdir(exist_ok=True)
 REPORT.write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps(results,indent=2))
 return 0 if not problems else 1
if __name__=='__main__':sys.exit(main())
