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
assert.strictEqual(clean.fragments,0);
assert.strictEqual(clean.comparableTransitions,4);
assert.strictEqual(clean.identityConsistency,1);
assert.strictEqual(clean.coverage,1);
assert.strictEqual(clean.labelledCoverage,1);
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
assert.strictEqual(segmented.fragments,0,'camera-cut / multi-plan segment boundary must not invent a fragmentation');
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
assert.strictEqual(partial.labelledCoverage,2/3);
assert.strictEqual(partial.idSwitches,0);
assert.strictEqual(partial.fragments,1,'tracked -> missed -> reacquired inside one continuous segment must count as one fragmentation');
assert.strictEqual(partial.fragmentEvents.length,1);

const boundaryMiss=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:null,segment:1},
  {frame:2,gtId:'A',trackId:9,segment:2}
]);
assert.strictEqual(boundaryMiss.fragments,0,'a reacquisition after a declared plan boundary is not a within-plan tracking fragmentation');

const before=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:null,segment:1},
  {frame:2,gtId:'A',trackId:2,segment:1},
  {frame:3,gtId:'A',trackId:2,segment:1}
]);
const after=B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:1,segment:1},
  {frame:1,gtId:'A',trackId:1,segment:1},
  {frame:2,gtId:'A',trackId:1,segment:1},
  {frame:3,gtId:'A',trackId:1,segment:1}
]);
const improvement=B.compareIdentityStability(before,after);
assert.strictEqual(improvement.improved,true);
assert.ok(improvement.deltaLabelledCoverage>0);
assert.strictEqual(improvement.deltaFragments,-1);

const coverageTradeoff=B.compareIdentityStability(after,B.evaluateIdentityStability([
  {frame:0,gtId:'A',trackId:7,segment:1},
  {frame:1,gtId:'A',trackId:null,segment:1},
  {frame:2,gtId:'A',trackId:null,segment:1},
  {frame:3,gtId:'A',trackId:7,segment:1}
]));
assert.strictEqual(coverageTradeoff.improved,false,'a tracker cannot be promoted by reducing IDs switches if labelled coverage regresses');

const unavailable=B.evaluateIdentityStability([{frame:0,gtId:'A',trackId:1,segment:1}]);
assert.strictEqual(unavailable.status,'INDISPONIBLE');
assert.strictEqual(unavailable.identityConsistency,null);

console.log('tracking identity benchmark: PASS');
