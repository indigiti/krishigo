#!/usr/bin/env python3
"""Acceptance checks for the DigiOps release artifact directory."""
import json
import tempfile
import unittest
from pathlib import Path
from package_digiops import package, BASE
from package_staging import assert_safe_dist, DIST

class DigiOpsReleaseTests(unittest.TestCase):
    def test_exact_digiops_public_payload(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp) / 'release'
            package(folder)
            meta = json.loads((folder / 'RELEASE.json').read_text())
            self.assertEqual(meta['public'], 'public')
            self.assertEqual(meta['dataMode'], 'mock')
            self.assertEqual(meta['path'], BASE)
            self.assertTrue((folder / 'public/index.html').is_file())
            self.assertTrue((folder / 'public/assets').is_dir())
            self.assertTrue((folder / 'public/.htaccess').is_file())
            self.assertTrue((folder / 'public/robots.txt').is_file())
            self.assertFalse((folder / 'private').exists())
            public = folder / 'public'
            self.assertFalse(any(p.suffix in ('.php','.sql','.py','.pem','.key','.map')
                                 for p in public.rglob('*') if p.is_file()))
            html = (public / 'index.html').read_text()
            self.assertIn('/krishigo/assets/', html)
            self.assertNotIn('src="/assets/', html)
            self.assertIn('RewriteBase /krishigo/', (public / '.htaccess').read_text())
            self.assertIn('noindex', (public / '.htaccess').read_text())

    def test_root_relative_build_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp)
            (d / 'assets').mkdir()
            (d / 'assets/demo.js').write_text('/* demo */')
            (d / 'index.html').write_text(
                '<meta name="robots" content="noindex,nofollow,noarchive">'
                '<script type="module" src="/assets/demo.js"></script>')
            with self.assertRaisesRegex(ValueError, 'not built for'):
                assert_safe_dist(d)

if __name__ == '__main__':
    unittest.main()
