#!/usr/bin/env python3
"""Synthetic local PHP baseline, not Cloudways field RUM or production load testing."""
from __future__ import annotations
import concurrent.futures, json, os, socket, statistics, subprocess, tempfile, time, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
API=ROOT/'apps/api-php'
REPORT=ROOT/'reports'/'m12-api-benchmark.json'

def benchmark():
 with tempfile.TemporaryDirectory() as directory:
  sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
  root=f'http://127.0.0.1:{port}'
  env=dict(os.environ,KRISHIGO_ALLOW_HTTP_LOCAL='1',KRISHIGO_API_MODE='staging',KRISHIGO_JSON_STORE_DIR=directory)
  process=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(API/'public'),str(API/'public/index.php')],
   env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  try:
   for _ in range(70):
    try:
     with urllib.request.urlopen(root+'/healthz',timeout=.2):break
    except Exception:time.sleep(.05)
   else:raise RuntimeError('HTTP test server not ready')
   endpoints=['/healthz','/api/v1/modules/registry','/api/v1/marketplace/listings']
   for path in endpoints:
    for _ in range(3):
     with urllib.request.urlopen(root+path,timeout=3) as resp:
      if resp.status!=200:raise RuntimeError('warmup response not 200')
   def request(item:int):
    path=endpoints[item % len(endpoints)]
    start=time.perf_counter()
    with urllib.request.urlopen(root+path,timeout=5) as response:
     body=response.read()
     if response.status!=200 or not body:raise RuntimeError('Unexpected test response')
    return (time.perf_counter()-start)*1000.0
   started=time.perf_counter()
   with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    measurements=list(pool.map(request,range(90)))
   elapsed=time.perf_counter()-started
   values=sorted(measurements)
   return {'measurement':'localhost_php_builtin_server','database':'none',
    'requests':len(values),'concurrency':4,'duration_seconds':round(elapsed,3),
    'p50_ms':round(statistics.median(values),2),
    'p95_ms':round(values[int((len(values)-1)*.95)],2),
    'p99_ms':round(values[int((len(values)-1)*.99)],2),
    'throughput_requests_per_second':round(len(values)/elapsed,1),
    'disclaimer':'Synthetic GitHub runner baseline, not field Core Web Vitals or Cloudways performance'}
  finally:process.terminate();process.wait(timeout=5)

if __name__=='__main__':
 report=benchmark()
 REPORT.parent.mkdir(parents=True,exist_ok=True)
 REPORT.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
 # Loose outage regression guard, not a speed/quality claim.
 if report['p95_ms']>1500:raise SystemExit('Local PHP API latency regressed excessively')
