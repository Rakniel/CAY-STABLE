from pathlib import Path

path=Path('CAY_ANALYZER_STABLE.html')
text=path.read_text(encoding='utf-8')
marker='<!-- STABLE_LONG_TERM_TRACKING_V2 -->'
tag='<script src="./pitch_keypoint_artifact_provider_v1.js"></script>'

if marker not in text:
    raise SystemExit('ERROR: STABLE tracking integration marker missing')

# Keep this adapter outside the main tracking manifest while it is an optional
# input source. It must load before stable_runtime_tracking_v2.js so a native,
# mobile or offline bridge can install CAYPitchKeypointProvider before tracking.
text=text.replace(tag+'\n','').replace(tag,'')
text=text.replace(marker,tag+'\n'+marker,1)

if text.count(tag)!=1:
    raise SystemExit('ERROR: pitch keypoint artifact provider tag must be unique')
if text.index(tag)>text.index('<script src="./stable_runtime_tracking_v2.js"></script>'):
    raise SystemExit('ERROR: pitch keypoint artifact provider must load before stable runtime')

path.write_text(text,encoding='utf-8')
print('integrated optional validated pitch-keypoint artifact provider')
