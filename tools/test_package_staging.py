import tempfile
from pathlib import Path
import unittest
import zipfile
from package_staging import package, ROOT

class TestStaticPackage(unittest.TestCase):
    def test_deploy_zip_is_mock_only_and_has_headers(self):
        # Works against Vite-produced dist. CI runs only after npm build.
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/'staging.zip'
            package(dest)
            with zipfile.ZipFile(dest) as z:
                files=z.namelist()
                self.assertIn('index.html',files)
                self.assertIn('.htaccess',files)
                self.assertIn('robots.txt',files)
                self.assertNotIn('.env',files)
                self.assertIn('X-Robots-Tag',z.read('.htaccess').decode())
                self.assertIn('Disallow: /',z.read('robots.txt').decode())
                self.assertFalse(any(item.endswith('.php') for item in files))

if __name__=='__main__':unittest.main()
