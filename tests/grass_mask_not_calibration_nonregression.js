'use strict';

const fs=require('fs');
const assert=require('assert');
const {execFileSync}=require('child_process');

execFileSync('python3',['tools/integrate_tracking_v2.py'],{stdio:'inherit'});
const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

assert(
  html.includes("s.autoRole='COARSE_GRASS_MASK_ONLY'"),
  'autoField output must be explicitly classified as a coarse grass mask only'
);
assert(
  html.includes("s.review=false;"),
  'bad grass segmentation must not automatically create a calibration correction queue'
);
assert(
  html.includes("points=s.manual?[...s.manual]:[];"),
  'manual calibration editor must start empty unless the user already created a manual polygon'
);
assert(
  !html.includes("points=s.manual?[...s.manual]:(s.auto?[...s.auto]:[]);"),
  'legacy grass polygon must never pre-fill the red calibration boundary'
);
assert(
  html.includes('La segmentation de pelouse sert uniquement de masque spatial ; elle n’est jamais utilisée comme calibration terrain.'),
  'shipped UI must describe the grass segmentation role truthfully'
);

const scanMarker="renderReviews();$('reviewSection').classList.add('hidden');";
const scanPos=html.indexOf(scanMarker);
assert(scanPos>=0,'scan completion block must exist');
const scanBlock=html.slice(scanPos,scanPos+1200);
assert(
  scanBlock.includes("$('guidedCalibSection').classList.add('hidden');"),
  'primary scan flow must keep legacy guided calibration hidden'
);
assert(
  scanBlock.includes("$('validation55Section').classList.remove('hidden');"),
  'primary scan flow must expose analysis immediately'
);
assert(
  scanBlock.includes("$('validation55Section').scrollIntoView({behavior:'smooth',block:'start'});"),
  'primary scan flow must navigate to analysis, not calibration'
);
assert(
  !scanBlock.includes("$('guidedCalibSection').scrollIntoView"),
  'primary scan flow must not send coaches into calibration'
);

console.log('grass mask vs calibration non-regression: PASS');
