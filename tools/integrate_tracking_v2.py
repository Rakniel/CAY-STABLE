from pathlib import Path

path = Path('CAY_ANALYZER_STABLE.html')
text = path.read_text(encoding='utf-8')
marker = '<!-- STABLE_LONG_TERM_TRACKING_V2 -->'
if marker in text:
    print('integration already present')
    raise SystemExit(0)

payload = '''\n<!-- STABLE_LONG_TERM_TRACKING_V2 -->\n<script src="./tracking_core_v1.js"></script>\n<script src="./player_stats_v1.js"></script>\n<script src="./stable_tracking_bridge_v1.js"></script>\n<script src="./stable_runtime_tracking_v2.js"></script>\n'''

needle = '</body>'
if needle not in text:
    raise SystemExit('ERROR: </body> not found')
text = text.replace(needle, payload + needle, 1)
path.write_text(text, encoding='utf-8')
print('integrated long-term tracking runtime into CAY_ANALYZER_STABLE.html')
