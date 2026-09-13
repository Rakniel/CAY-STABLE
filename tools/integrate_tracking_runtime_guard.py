from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'CAY_ANALYZER_STABLE.html'
text = path.read_text(encoding='utf-8')
tag = '<script src="./stable_tracking_runtime_guard_v1.js"></script>'

text = re.sub(rf'^[ \t]*{re.escape(tag)}[ \t]*(?:\r?\n)?', '', text, flags=re.MULTILINE)
needle = '</body>'
if needle not in text:
    raise SystemExit('ERROR: </body> not found')
text = text.replace(needle, tag + '\n' + needle, 1)
if text.count(tag) != 1:
    raise SystemExit('ERROR: stable tracking runtime guard script is not unique')

# Guard must execute after the tracker core/adapter/bridge/runtime scripts have
# installed or registered their DOMContentLoaded hooks.
for dependency in (
    '<script src="./tracking_core_v1.js"></script>',
    '<script src="./tracking_two_stage_adapter_v1.js"></script>',
    '<script src="./tracking_two_stage_runtime_patch_v1.js"></script>',
    '<script src="./stable_tracking_bridge_v1.js"></script>',
    '<script src="./stable_runtime_tracking_v2.js"></script>',
):
    if dependency not in text:
        raise SystemExit(f'ERROR: expected tracking dependency missing before runtime guard: {dependency}')
    if text.index(dependency) > text.index(tag):
        raise SystemExit(f'ERROR: runtime guard ordered before dependency: {dependency}')

path.write_text(text, encoding='utf-8')
print('integrated fail-closed STABLE tracking runtime guard')
