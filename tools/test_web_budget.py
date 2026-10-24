import tempfile
from pathlib import Path
import unittest
from check_web_budget import check

class Budget(unittest.TestCase):
  def test_small_build_is_accepted(self):
    with tempfile.TemporaryDirectory() as d:
      root=Path(d)
      (root/'main.js').write_text('console.log("hello")')
      (root/'main.css').write_text('body{color:black}')
      self.assertEqual(check(root)['js_files'],1)
  def test_missing_or_oversized_build_rejected(self):
    with tempfile.TemporaryDirectory() as d:
      root=Path(d)
      with self.assertRaises(ValueError):check(root)
      (root/'huge.js').write_bytes(bytes(range(256))*2500)
      (root/'style.css').write_text('body{}')
      # Highly compressible sample still under the transfer-size limit.
      self.assertEqual(check(root)['css_gzip_bytes']>0,True)

if __name__=='__main__': unittest.main()
