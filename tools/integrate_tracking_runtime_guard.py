from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'CAY_ANALYZER_STABLE.html'
text = path.read_text(encoding='utf-8')
guard_tag = '<script src="./stable_tracking_runtime_guard_v1.js"></script>'
first_results_guard_tag = '<script src="./first_results_runtime_guard_bridge_v1.js"></script>'
tags = (guard_tag, first_results_guard_tag)

for tag in tags:
    text = re.sub(rf'^[ \t]*{re.escape(tag)}[ \t]*(?:\r?\n)?', '', text, flags=re.MULTILINE)
# `integrate_tracking_v2.py` rebuilds its canonical block on every pass. If the
# guards were previously placed just before that block, removing them can leave
# extra blank lines behind. Normalize that seam so the whole bundle reaches a
# true fixed point after one execution.
text = re.sub(r'\n{3,}(<!-- STABLE_LONG_TERM_TRACKING_V2 -->)', r'\n\n\1', text)
needle = '</body>'
if needle not in text:
    raise SystemExit('ERROR: </body> not found')
text = text.replace(needle, guard_tag + '\n' + first_results_guard_tag + '\n' + needle, 1)
for tag in tags:
    if text.count(tag) != 1:
        raise SystemExit(f'ERROR: stable runtime guard script is not unique: {tag}')

# Tracking guard must execute after the tracker core/adapter/bridge/runtime
# scripts have installed or registered their DOMContentLoaded hooks. The
# first-results publication guard runs after both the canonical readiness gate
# and the runtime guard so stale player cards can never bypass runtime proof.
for dependency in (
    '<script src="./tracking_core_v1.js"></script>',
    '<script src="./tracking_two_stage_adapter_v1.js"></script>',
    '<script src="./tracking_two_stage_runtime_patch_v1.js"></script>',
    '<script src="./stable_tracking_bridge_v1.js"></script>',
    '<script src="./first_results_testability_gate_v1.js"></script>',
    '<script src="./stable_runtime_tracking_v2.js"></script>',
):
    if dependency not in text:
        raise SystemExit(f'ERROR: expected tracking dependency missing before runtime guards: {dependency}')
    if text.index(dependency) > text.index(guard_tag):
        raise SystemExit(f'ERROR: tracking runtime guard ordered before dependency: {dependency}')
if text.index(guard_tag) > text.index(first_results_guard_tag):
    raise SystemExit('ERROR: first-results runtime guard must execute after tracking runtime guard')

path.write_text(text, encoding='utf-8')
print('integrated fail-closed STABLE tracking and first-results runtime guards')
