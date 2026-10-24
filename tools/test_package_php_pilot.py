"""The protected staging pilot package must fail closed and never contain secrets."""
import json, tempfile, unittest
from pathlib import Path
from package_php_pilot import package, BACKEND

class PilotPackage(unittest.TestCase):
 def test_split_payload_and_static_isolation(self):
  with tempfile.TemporaryDirectory() as tmp:
   folder=Path(tmp)/'pilot'
   package(folder)
   metadata=json.loads((folder/'RELEASE.json').read_text())
   self.assertEqual(metadata['private'],'private')
   self.assertEqual(metadata['database'],'none')
   self.assertFalse(metadata['publicWritesEnabledByDefault'])
   self.assertTrue((folder/'public/index.html').is_file())
   self.assertTrue((folder/'public/api/v1/index.php').is_file())
   self.assertIn('KRISHIGO_PRIVATE_APP_ROOT',(folder/'public/api/v1/index.php').read_text())
   self.assertIn('KRISHIGO_JSON_WORKFLOWS',(folder/'public/api/v1/index.php').read_text())
   self.assertIn('^api/v1(/|$)',(folder/'public/.htaccess').read_text())
   self.assertEqual(len([f for f in (folder/'private').rglob('*') if f.is_file()]),len(BACKEND))
   self.assertFalse((folder/'private/api-service/database').exists())
   self.assertFalse((folder/'private/api-service/src/Production').exists())
   self.assertFalse(any(p.suffix in ('.php','.sql','.py','.pem','.key','.map')
                        for p in (folder/'public').rglob('*')
                        if p.is_file() and p.name!='index.php'))
   for name in ['.env','.env.local','passwords.json','.htpasswd']:
    self.assertFalse(any(p.name==name for p in folder.rglob('*')))
 def test_no_self_overwrite(self):
  from package_php_pilot import SRC
  with self.assertRaises(ValueError):
   package(SRC/'generated-pilot')
if __name__=='__main__':unittest.main()
