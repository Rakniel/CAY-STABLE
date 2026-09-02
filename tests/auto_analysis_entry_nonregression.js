'use strict';

const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

assert(
  html.includes('Le terrain est calibré automatiquement ; correction manuelle seulement si nécessaire.'),
  'the primary validation UI must explain automatic calibration with manual fallback'
);
assert(
  html.includes('Tu peux lancer l’analyse immédiatement ; correction terrain manuelle seulement si nécessaire.'),
  'scene scan completion must allow immediate analysis'
);
assert(
  html.includes("label:'calibrage manuel optionnel (max 3)',ok:Number.isFinite(metrics.calibrationImages)&&metrics.calibrationImages>=0&&metrics.calibrationImages<=3"),
  'zero to three manual references must satisfy the optional calibration-count policy'
);
assert(
  !html.includes("label:'3 images maximum',ok:metrics.calibrationImages===3"),
  'the obsolete exactly-three-reference validation gate must not return'
);

const scanMarker="renderReviews();$('reviewSection').classList.add('hidden');";
const scanPos=html.indexOf(scanMarker);
assert(scanPos>=0,'scan completion block must exist');
const nearby=html.slice(scanPos,scanPos+700);
assert(
  nearby.includes("$('validation55Section').classList.remove('hidden');"),
  'analysis controls must be exposed as soon as scene scanning completes'
);
assert(
  nearby.indexOf("$('validation55Section').classList.remove('hidden');") < nearby.indexOf('if(guidedCalibrationRefs.length===3'),
  'analysis controls must be exposed before checking whether three manual references exist'
);

console.log('auto-analysis entry non-regression: PASS');
