'use strict';
const assert=require('assert');
const B=require('../calibration_runtime_benchmark_v1.js');

const before=B.summarize([
  {attempted:true,valid:true,confidence:.90},
  {attempted:true,valid:true,confidence:.80},
  {attempted:true,valid:false},
  {attempted:true,valid:false},
  {attempted:false,valid:false}
]);
assert.equal(before.frames,5);
assert.equal(before.attemptedFrames,4);
assert.equal(before.validProjectionFrames,2);
assert.equal(before.directValidFrames,2);
assert.equal(before.fallbackValidFrames,0);
assert.equal(before.invalidProjectionFrames,2);
assert.equal(before.notAttemptedFrames,1);
assert.equal(before.attemptedFrameRate,.8);
assert.equal(before.validFrameRate,.4);
assert.equal(before.validProjectionRate,.5);
assert.equal(before.directValidRate,.5);
assert.equal(before.fallbackProjectionRate,0);
assert.equal(before.meanValidConfidence,.85);

const after=B.summarize([
  {attempted:true,valid:true,confidence:.92},
  {attempted:true,valid:true,confidence:.88},
  {attempted:true,valid:true,fallback:true,confidence:.75},
  {attempted:true,valid:false},
  {attempted:false,valid:false}
]);
assert.equal(after.attemptedFrameRate,.8);
assert.equal(after.validFrameRate,.6);
assert.equal(after.validProjectionRate,.75);
assert.equal(after.directValidRate,.5);
assert.equal(after.fallbackProjectionRate,.25);
assert.equal(after.fallbackShareOfValid,.3333);
assert.equal(after.meanValidConfidence,.85);

const cmp=B.compare(before,after);
assert.equal(cmp.deltaAttemptedFrameRate,0);
assert.equal(cmp.deltaValidFrameRate,.2);
assert.equal(cmp.deltaValidProjectionRate,.25);
assert.equal(cmp.deltaDirectValidRate,0);
assert.equal(cmp.deltaFallbackProjectionRate,.25);
assert.equal(cmp.deltaMeanValidConfidence,0);
assert.equal(cmp.improved,true);
assert(cmp.policy.includes('MESURE_AVANT_APRES_EXPLICITE'));

const skippedHardFramesBefore=B.summarize([
  {attempted:true,valid:true},{attempted:true,valid:true},{attempted:true,valid:true},{attempted:true,valid:true},
  {attempted:true,valid:false},{attempted:true,valid:false},{attempted:true,valid:false},{attempted:true,valid:false}
]);
const skippedHardFramesAfter=B.summarize([
  {attempted:true,valid:true},{attempted:true,valid:true},{attempted:true,valid:true},{attempted:true,valid:true},
  {attempted:false},{attempted:false},{attempted:false},{attempted:false}
]);
assert.equal(skippedHardFramesBefore.validProjectionRate,.5);
assert.equal(skippedHardFramesAfter.validProjectionRate,1,'le taux conditionnel peut sembler meilleur en ignorant les frames difficiles');
assert.equal(skippedHardFramesBefore.validFrameRate,.5);
assert.equal(skippedHardFramesAfter.validFrameRate,.5,'le taux global révèle qu aucun gain réel de frames valides n existe');
const skippedCmp=B.compare(skippedHardFramesBefore,skippedHardFramesAfter);
assert.equal(skippedCmp.deltaAttemptedFrameRate,-.5);
assert.equal(skippedCmp.deltaValidFrameRate,0);
assert.equal(skippedCmp.deltaValidProjectionRate,.5);
assert.equal(skippedCmp.improved,false,'une baisse de couverture des tentatives ne doit jamais être promue comme amélioration');

const empty=B.summarize([]);
assert.equal(empty.attemptedFrameRate,0);
assert.equal(empty.validFrameRate,0);
assert.equal(empty.validProjectionRate,0);
assert.equal(empty.meanValidConfidence,null);
assert.equal(B.compare([],[]).improved,false);

console.log('calibration runtime benchmark non-regression: PASS');
