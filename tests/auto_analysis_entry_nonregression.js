'use strict';

const fs=require('fs');
const assert=require('assert');
const {execFileSync}=require('child_process');

// The shipped STABLE HTML is produced by the canonical integrator. Every CI that
// validates this UX contract must first build that same artifact, otherwise it
// tests the stale source HTML instead of the file users actually receive.
execFileSync('python3',['tools/integrate_tracking_v2.py'],{stdio:'inherit'});
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
assert(
  !html.includes('Calibrage incomplet : ${calibrated}/3 image(s). Termine d’abord les 3 références.'),
  'runFullValidation55 must not block analysis when manual pitch calibration is incomplete'
);
assert(
  html.includes('Calibration manuelle optionnelle : conserver le compteur comme preuve de couverture'),
  'generated runtime must explicitly retain optional calibration as evidence rather than a gate'
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

const validationPos=html.indexOf('async function runFullValidation55(){');
assert(validationPos>=0,'runFullValidation55 must exist');
const validationBlock=html.slice(validationPos,validationPos+1800);
assert(
  validationBlock.includes('const calibrated=guidedCalibrationRefs.filter(r=>r.poly&&r.poly.length>=3).length;'),
  'manual calibration count must remain observable for coverage reporting'
);
assert(
  !validationBlock.includes('if(calibrated<3)'),
  'manual pitch calibration count must never be an analysis entry gate'
);

console.log('auto-analysis entry non-regression: PASS');
