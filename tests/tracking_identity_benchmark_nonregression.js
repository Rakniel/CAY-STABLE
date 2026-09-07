'use strict';

const assert=require('assert');
const B=require('../tracking_identity_benchmark_v1.js');

const clean=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:1,segment:1},
  {frame:2,gtId:'A',trackId:1,segment:1},
  {frame:0,gtId:'B',trackId:2,segment:1},
  {frame:1,gtId:'B',trackId:2,segment:1},
  {frame:2,gtId:'B',trackId:2,segment:1}
]);
assert.strictEqual(clean.idSwitches,0);
assert.strictEqual(clean.comparableTransitions,4);
assert.strictEqual(clean.identityConsistency,1);
assert.strictEqual(clean.coverage,1);
assert.strictEqual(clean.status,'DISPONIBLE');

const crossed=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:1,segment:1},
  {frame:2,gtId:'A',trackId:2,segment:1},
  {frame:0,gtId:'B',trackId:2,segment:1},
  {frame:1,gtId:'B',trackId:2,segment:1},
  {frame:2,gtId:'B',trackId:1,segment:1}
]);
assert.strictEqual(crossed.idSwitches,2);
assert.strictEqual(crossed.comparableTransitions,4);
assert.strictEqual(crossed.identityConsistency,.5);
assert.deepStrictEqual(crossed.switches.map(s=>s.gtId).sort(),['A','B']);

const segmented=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:1,segment:1},
  {frame:2,gtId:'A',trackId:8,segment:2},
  {frame:3,gtId:'A',trackId:8,segment:2}
]);
assert.strictEqual(segmented.idSwitches,0,'camera-cut / multi-plan segment boundary must not invent an ID switch');
assert.strictEqual(segmented.comparableTransitions,2);

const partial=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:null,segment:1},
  {frame:2,gtId:'A',trackId:1,segment:1},
  {frame:3,gtId:null,trackId:1,segment:1}
]);
assert.strictEqual(partial.validSamples,2);
assert.strictEqual(partial.rejectedSamples,2);
assert.strictEqual(partial.coverage,.5);
assert.strictEqual(partial.idSwitches,0);

const unavailable=B.evaluateIdentityStability([{frame:0,gtId:'A',trackId:1,segment:1}]);
assert.strictEqual(unavailable.status,'INDISPONIBLE');
assert.strictEqual(unavailable.identityConsistency,null);

console.log('tracking identity benchmark: PASS');
