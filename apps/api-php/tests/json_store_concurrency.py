"""Concurrent JSON store regression: filesystem locks without MySQL."""
import concurrent.futures, json, subprocess, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PHP=ROOT/'src/Json/Store.php'
SCRIPT=r'''
require $argv[1];
$store=new \KrishiGo\Json\Store($argv[2]);
$result=$store->create('marketplace','fixture-tester',['crop'=>'tomato'],$argv[3]);
echo json_encode($result,JSON_THROW_ON_ERROR);
'''
def run(root,key):
 p=subprocess.run(['php','-r',SCRIPT,str(PHP),str(root),key],
    capture_output=True,text=True,timeout=15)
 if p.returncode:raise RuntimeError(p.stderr)
 return json.loads(p.stdout)
class Concurrency(unittest.TestCase):
 def test_atomic_writers_and_duplicate_keys(self):
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory)
   keys=[f'request-key-fixture-{i:03}' for i in range(18)]
   with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    outputs=list(pool.map(lambda key:run(root,key),keys))
   self.assertEqual(sorted(o['item']['id'] for o in outputs),list(range(1,19)))
   self.assertTrue(all(o['created'] for o in outputs))
   with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    replay=list(pool.map(lambda _:run(root,keys[0]),range(4)))
   self.assertEqual({o['item']['id'] for o in replay},{1})
   self.assertTrue(all(not o['created'] for o in replay))
   data=json.loads((root/'workflow-marketplace-state.json').read_text())
   self.assertEqual(data['next_id'],19)
   self.assertEqual(len(data['records']),18)
   self.assertEqual(len({r['request_hash'] for r in data['records']}),18)
if __name__=='__main__':unittest.main()
