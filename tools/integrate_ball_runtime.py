from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'CAY_ANALYZER_STABLE.html'
text = path.read_text(encoding='utf-8')

marker = '<!-- STABLE_BALL_ROSTER_OWNERSHIP_V1 -->'
tags = (
    '<script src="./ball_event_state_v1.js"></script>',
    '<script src="./ball_kick_evidence_v1.js"></script>',
    '<script src="./ball_event_evidence_bridge_v1.js"></script>',
    '<script src="./track_roster_binding_v1.js"></script>',
    '<script src="./ball_roster_ownership_bridge_v1.js"></script>',
)

# Rebuild one canonical block on every run. This makes the integrator safe to
# execute repeatedly from CI without accumulating duplicate runtime scripts.
text = re.sub(
    rf'^[ \t]*{re.escape(marker)}[ \t]*\r?\n(?:^[ \t]*<script src="\./(?:ball_event_state_v1|ball_kick_evidence_v1|ball_event_evidence_bridge_v1|track_roster_binding_v1|ball_roster_ownership_bridge_v1)\.js"></script>[ \t]*\r?\n?){{0,5}}',
    '',
    text,
    flags=re.MULTILINE,
)
for tag in tags:
    text = re.sub(rf'^[ \t]*{re.escape(tag)}[ \t]*(?:\r?\n)?', '', text, flags=re.MULTILINE)

needle = '</body>'
if needle not in text:
    raise SystemExit('ERROR: </body> not found')

block = marker + '\n' + '\n'.join(tags) + '\n'
text = text.replace(needle, block + needle, 1)

for tag in tags:
    if text.count(tag) != 1:
        raise SystemExit(f'ERROR: ball runtime script is not unique: {tag}')

# The roster bridge must execute only after the raw event engine, kick evidence,
# evidence policy bridge and roster-binding contract are available.
if not all(text.index(tag) < text.index(tags[-1]) for tag in tags[:-1]):
    raise SystemExit('ERROR: ball roster ownership bridge ordered before dependency')
if not (text.index(tags[0]) < text.index(tags[1]) < text.index(tags[2])):
    raise SystemExit('ERROR: ball event evidence chain ordered incorrectly')

path.write_text(text, encoding='utf-8')
print('integrated roster-guarded STABLE ball evidence runtime')
