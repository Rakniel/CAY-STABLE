#!/usr/bin/env python3
"""Non-regression tests for deterministic CAY-STABLE release packaging."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'tools'))
from build_stable_release import build

class ReleaseTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'repo'
        self.root.mkdir()
        self.html = b'<html><title>CAY</title><script src="./a.js"></script><script src="./first_results_runtime_guard_bridge_v1.js"></script><img src="data:image/png;base64,OFFICIALLOGO"></html>'
        (self.root / 'CAY_ANALYZER_STABLE.html').write_bytes(self.html)
        (self.root / 'a.js').write_text('const a=1;\n')
        (self.root / 'first_results_runtime_guard_bridge_v1.js').write_text('const guard=true;\n')
        (self.root / 'dynamic.js').write_text('const dynamic=true;\n')
        self.output = Path(self.tmp.name) / 'out' / 'test.zip'

    def test_deterministic_and_logo_unchanged(self):
        first = build(self.root, self.output)
        blob = self.output.read_bytes()
        second = build(self.root, self.output)
        self.assertEqual(blob, self.output.read_bytes())
        self.assertEqual(first['sha256'], second['sha256'])
        with zipfile.ZipFile(self.output) as z:
            self.assertEqual(z.read('index.html'), self.html)
            self.assertEqual(z.read('CAY_ANALYZER_STABLE.html'), self.html)
            self.assertIn('dynamic.js', z.namelist())
            manifest = json.loads(z.read('RELEASE_MANIFEST.json'))
            self.assertEqual(manifest['files']['index.html']['sha256'], hashlib.sha256(self.html).hexdigest())
            self.assertIn(b'OFFICIALLOGO', z.read('index.html'))
            self.assertEqual(manifest['build_type'], 'TESTABLE_NOT_VIDEO_VALIDATED')

    def test_missing_script_fails_closed_without_overwriting(self):
        build(self.root, self.output)
        old = self.output.read_bytes()
        (self.root / 'a.js').unlink()
        with self.assertRaisesRegex(ValueError, 'missing/unsafe'):
            build(self.root, self.output)
        self.assertEqual(self.output.read_bytes(), old)

    def test_traversal_ref_rejected(self):
        (self.root / 'CAY_ANALYZER_STABLE.html').write_text('<html>CAY<script src="../secret.js"></script></html>')
        with self.assertRaisesRegex(ValueError, 'unsafe local'):
            build(self.root, self.output)

    def test_guard_absent_rejected(self):
        (self.root / 'CAY_ANALYZER_STABLE.html').write_text('<html>CAY<script src="./a.js"></script></html>')
        with self.assertRaisesRegex(ValueError, 'guard missing'):
            build(self.root, self.output)

    def test_bad_js_syntax_rejected(self):
        (self.root / 'a.js').write_text('const = ;\n')
        with self.assertRaisesRegex(ValueError, 'syntax failed'):
            build(self.root, self.output)

if __name__ == '__main__':
    unittest.main()
