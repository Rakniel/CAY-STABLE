from pathlib import Path

path = Path('CAY_ANALYZER_STABLE.html')
text = path.read_text(encoding='utf-8')
marker = '<!-- STABLE_LONG_TERM_TRACKING_V2 -->'
runtime_tag = '<script src="./stable_runtime_tracking_v2.js"></script>'
required_before_runtime = [
    '<script src="./segment_reid_guard_v1.js"></script>',
    '<script src="./observed_presence_v1.js"></script>',
    '<script src="./observed_presence_report_v1.js"></script>',
    '<script src="./observed_presence_runtime_bridge_v1.js"></script>',
]

if marker not in text:
    payload = '''\n<!-- STABLE_LONG_TERM_TRACKING_V2 -->\n<script src="./tracking_core_v1.js"></script>\n<script src="./player_stats_v1.js"></script>\n<script src="./stable_tracking_bridge_v1.js"></script>\n<script src="./segment_reid_guard_v1.js"></script>\n<script src="./observed_presence_v1.js"></script>\n<script src="./observed_presence_report_v1.js"></script>\n<script src="./observed_presence_runtime_bridge_v1.js"></script>\n<script src="./stable_runtime_tracking_v2.js"></script>\n'''
    needle = '</body>'
    if needle not in text:
        raise SystemExit('ERROR: </body> not found')
    text = text.replace(needle, payload + needle, 1)
else:
    if runtime_tag not in text:
        raise SystemExit('ERROR: runtime tracking tag missing from existing integration')
    missing = [tag for tag in required_before_runtime if tag not in text]
    if missing:
        insertion = '\n'.join(missing) + '\n'
        text = text.replace(runtime_tag, insertion + runtime_tag, 1)

path.write_text(text, encoding='utf-8')
print('integrated long-term tracking runtime, segment reid guard and observed-presence evidence into CAY_ANALYZER_STABLE.html')
