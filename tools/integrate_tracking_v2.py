from pathlib import Path

path = Path('CAY_ANALYZER_STABLE.html')
text = path.read_text(encoding='utf-8')
marker = '<!-- STABLE_LONG_TERM_TRACKING_V2 -->'
canonical_tags = [
    '<script src="./tracking_core_v1.js"></script>',
    '<script src="./player_stats_v1.js"></script>',
    '<script src="./stable_tracking_bridge_v1.js"></script>',
    '<script src="./manual_identity_merge_guard_v1.js"></script>',
    '<script src="./segment_reid_guard_v1.js"></script>',
    '<script src="./observed_presence_v1.js"></script>',
    '<script src="./observed_presence_report_v1.js"></script>',
    '<script src="./observed_presence_runtime_bridge_v1.js"></script>',
    '<script src="./stable_runtime_tracking_v2.js"></script>',
]

# Always rebuild the integration block in one canonical order. This makes upgrades
# safe when a new dependency is inserted between modules that were already present.
for tag in canonical_tags:
    text = text.replace(tag, '')
text = text.replace(marker, '')

payload = '\n' + marker + '\n' + '\n'.join(canonical_tags) + '\n'
needle = '</body>'
if needle not in text:
    raise SystemExit('ERROR: </body> not found')
text = text.replace(needle, payload + needle, 1)

# Fail fast if integration is not unique or dependency order is not canonical.
if text.count(marker) != 1:
    raise SystemExit('ERROR: integration marker is not unique')
positions = [text.index(tag) for tag in canonical_tags]
if positions != sorted(positions):
    raise SystemExit('ERROR: tracking runtime scripts are not in canonical order')
if any(text.count(tag) != 1 for tag in canonical_tags):
    raise SystemExit('ERROR: tracking runtime script duplicated')

path.write_text(text, encoding='utf-8')
print('integrated long-term tracking runtime in canonical dependency order')
