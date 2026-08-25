const fs=require('fs');
const src=fs.readFileSync('stable_runtime_tracking_v2.js','utf8');
let pass=0,fail=0;
function check(name,cond){if(cond){console.log('PASS',name);pass++;}else{console.error('FAIL',name);fail++;}}
check('uses long-term bridge',src.includes('CAYStableTrackingBridge.create'));
check('hard cap 11 players',src.includes('maxPlayers:11'));
check('preserves segment breaks',src.includes('segmentBreak'));
check('appearance vector for re-identification',src.includes('appearanceVector(cls.feature)'));
check('no metric projector is invented',src.includes('bridge.report({})'));
check('shows metric unavailable when uncalibrated',src.includes('projection métrique non validée'));
check('exports player stats in tracking report',src.includes('playerStats,unavailable:playerStats.unavailable'));
check('renders individual player cards',src.includes('renderPlayerStats(playerStats)'));
check('labels persistent global player id',src.includes("+' #'+a.trackId"));
check('does not draw path across segments',src.includes('filter(p=>p.segment===seg)'));
console.log(`runtime integration: ${pass} PASS / ${fail} FAIL`);
if(fail)process.exit(1);
