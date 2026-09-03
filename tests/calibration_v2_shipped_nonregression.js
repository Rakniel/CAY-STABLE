'use strict';

const fs=require('fs');
const assert=require('assert');
const {execFileSync}=require('child_process');

execFileSync('python3',['tools/integrate_tracking_v2.py'],{stdio:'inherit'});
execFileSync('python3',['tools/integrate_calibration_v2.py'],{stdio:'inherit'});
const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

assert(html.includes('<!-- CALIBRATION_V2_SEMANTIC_PITCH -->'));
assert(html.includes('./pitch_semantic_calibration_v2.js'));
assert(html.includes('./player_candidate_recovery_v1.js'));
assert(html.includes('Calibration terrain V2 — repères football'));
assert(html.includes('Ancien calibrage V1 retiré'));
assert(html.includes('l’ancien polygone libre est retiré'));
assert(html.includes('appearanceRecovered=recovery.recoverFromCanvas'));
assert(!html.includes("$('prepareGuidedCalib').onclick=chooseThreeReferenceImages"));
assert.strictEqual((html.match(/CALIBRATION_V2_SEMANTIC_PITCH/g)||[]).length,1);

console.log('shipped calibration v2 non-regression: PASS');
