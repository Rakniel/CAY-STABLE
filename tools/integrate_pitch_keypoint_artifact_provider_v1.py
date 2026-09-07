from pathlib import Path
import re

path=Path('CAY_ANALYZER_STABLE.html')
text=path.read_text(encoding='utf-8')
marker='<!-- STABLE_LONG_TERM_TRACKING_V2 -->'
tag='<script src="./pitch_keypoint_artifact_provider_v1.js"></script>'

if marker not in text:
    raise SystemExit('ERROR: STABLE tracking integration marker missing')

# Keep this adapter outside the main tracking manifest while it is an optional
# input source. It must load before stable_runtime_tracking_v2.js so a native,
# mobile or offline bridge can install CAYPitchKeypointProvider before tracking.
# Canonicalise surrounding blank lines so running this after the main integrator
# any number of times produces byte-identical HTML.
text=re.sub(r'\n*[ \t]*'+re.escape(tag)+r'[ \t]*(?:\r?\n)?','\n',text)
text=re.sub(r'\n*[ \t]*'+re.escape(marker),'\n\n'+tag+'\n'+marker,text,count=1)

if text.count(tag)!=1:
    raise SystemExit('ERROR: pitch keypoint artifact provider tag must be unique')
if text.index(tag)>text.index('<script src="./stable_runtime_tracking_v2.js"></script>'):
    raise SystemExit('ERROR: pitch keypoint artifact provider must load before stable runtime')

path.write_text(text,encoding='utf-8')
print('integrated optional validated pitch-keypoint artifact provider')
