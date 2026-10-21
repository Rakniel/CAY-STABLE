#!/usr/bin/env python3
"""Build a deterministic, self-contained static CAY-STABLE test artifact.

No downloaded models, dependencies, credentials, third-party source or logo changes.
The shipped HTML is byte-identical to the canonical integrated HTML.
"""
from __future__ import annotations
import argparse
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import tempfile
import zipfile

SOURCE_HTML = 'CAY_ANALYZER_STABLE.html'
FIXED_ZIP_TIME = (2020, 1, 1, 0, 0, 0)
README = """# C.A. Yenne — STABLE testable (rouge et noir)

1. Extraire l'archive dans un dossier local.
2. Depuis ce dossier : python3 -m http.server 8000
3. Ouvrir http://localhost:8000/ dans un navigateur récent.
4. Configurer l'équipe et le roster, puis charger une vidéo du club.
5. Vérifier la couverture et les fiches joueurs avant toute utilisation de métriques.

Ce paquet ne contient ni serveur d'authentification, ni modèle de détection téléchargé, ni données de joueurs, ni vidéo.
Les métriques insuffisamment étayées doivent rester INDISPONIBLE.
Le logo intégré au HTML est conservé sans modification.
Ce paquet est un BUILD DE TEST, pas une validation vidéo terrain ni une certification du délai de 20 minutes.
La provenance des bibliothèques candidates reste dans OPEN_SOURCE_COMPONENTS.md (dépôt source).
"""

class Assets(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'script' and d.get('src'):
            self.refs.append(d['src'])
        elif tag == 'link' and d.get('href') and d.get('rel') in ('stylesheet', 'icon'):
            self.refs.append(d['href'])

def local_path(ref):
    if ref.startswith(('https:', 'http:', 'data:', '#', '//', 'blob:')):
        return None
    if '$'+'{' in ref or '{{' in ref:
        return None
    if '?' in ref or '#' in ref:
        ref = re.split(r'[?#]', ref, 1)[0]
    name = ref.removeprefix('./')
    p = PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name:
        raise ValueError(f'unsafe local asset reference: {ref!r}')
    return str(p)

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def build(root: Path, output: Path, *, syntax=True):
    root = root.resolve()
    canonical = root / SOURCE_HTML
    if not canonical.is_file():
        raise FileNotFoundError(f'canonical HTML missing: {SOURCE_HTML}')
    html = canonical.read_bytes()
    if b'CAY' not in html or b'<html' not in html.lower():
        raise ValueError('canonical HTML does not look like CAY-STABLE')
    parser = Assets()
    parser.feed(html.decode('utf-8'))
    refs = sorted({p for ref in parser.refs if (p := local_path(ref)) is not None})
    if not any(p.endswith('.js') for p in refs):
        raise ValueError('no local JS runtime referenced by canonical HTML')
    if 'first_results_runtime_guard_bridge_v1.js' not in refs:
        raise ValueError('first-results publication guard missing from canonical HTML')
    files = {'index.html': html, SOURCE_HTML: html}
    for path in refs:
        target = root / path
        if not target.is_file() or target.is_symlink() or not target.resolve().is_relative_to(root):
            raise ValueError(f'missing/unsafe canonical asset: {path}')
        files[path] = target.read_bytes()
    for path in sorted(root.glob('*.js')):
        if path.is_symlink():
            raise ValueError(f'symlink JS not allowed: {path.name}')
        files[path.name] = path.read_bytes()
    for name in ('staff_tactics.html', 'CAY_CALIBRATION_TEST.html'):
        if (root / name).is_file():
            files[name] = (root / name).read_bytes()
    if syntax:
        for name in sorted(p for p in files if p.endswith('.js')):
            proc = subprocess.run(['node', '--check', '-'], input=files[name], capture_output=True)
            if proc.returncode:
                raise ValueError(f'JS syntax failed for {name}: {proc.stderr.decode(errors="replace")[-400:]}')
    try:
        commit = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], stderr=subprocess.DEVNULL, text=True).strip()
    except (OSError, subprocess.CalledProcessError):
        commit = None
    manifest = {
        'schema': 'CAY_STABLE_RELEASE_V1',
        'source_commit': commit,
        'canonical_html_sha256': sha256(html),
        'build_type': 'TESTABLE_NOT_VIDEO_VALIDATED',
        'file_count': len(files),
        'files': {name: {'sha256': sha256(data), 'bytes': len(data)} for name, data in sorted(files.items())},
        'license_note': 'CAY repository license NOASSERTION; no external code or model weights added by packager',
    }
    files['RELEASE_MANIFEST.json'] = (json.dumps(manifest, indent=2, ensure_ascii=False, sort_keys=True) + '\n').encode()
    files['README_TEST.md'] = README.encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.cay-stable-', suffix='.zip', dir=output.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(tmp, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for name, data in sorted(files.items()):
                info = zipfile.ZipInfo(name, FIXED_ZIP_TIME)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                z.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        os.replace(tmp, output)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    return {'output': str(output), 'files': len(files), 'js_files': sum(x.endswith('.js') for x in files), 'sha256': sha256(output.read_bytes()), 'canonical_html_sha256': sha256(html)}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path('.'))
    parser.add_argument('--output', type=Path, default=Path('dist/CAY_STABLE_TESTABLE.zip'))
    args = parser.parse_args()
    print(json.dumps(build(args.root, args.output), indent=2))
