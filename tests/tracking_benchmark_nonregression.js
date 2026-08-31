const assert=require('assert');
const {evaluate,compare}=require('../tracking_benchmark_v1.js');

const perfect=[
  {frame:1,gtId:'7',trackId:'A'},
  {frame:2,gtId:'7',trackId:'A'},
  {frame:3,gtId:'7',trackId:'A'},
  {frame:4,gtId:'7',trackId:'A'}
];
const p=evaluate(perfect);
assert.strictEqual(p.observedCoverage,1);
assert.strictEqual(p.idSwitches,0);
assert.strictEqual(p.fragmentations,0);
assert.strictEqual(p.identityContinuity,1);

const broken=[
  {frame:1,gtId:'7',trackId:'A'},
  {frame:2,gtId:'7',trackId:null,matched:false},
  {frame:3,gtId:'7',trackId:'B'},
  {frame:4,gtId:'7',trackId:'B'}
];
const b=evaluate(broken);
assert.strictEqual(b.missedObservations,1);
assert.strictEqual(b.fragmentations,1);
assert.strictEqual(b.idSwitches,1);
assert.ok(b.observedCoverage<1);
assert.ok(b.identityContinuity<1);

const cmp=compare(broken,perfect);
assert.ok(cmp.delta.observedCoverage>0);
assert.ok(cmp.delta.identityContinuity>0);
assert.ok(cmp.delta.idSwitches<0);
assert.ok(cmp.delta.fragmentations<0);

assert.throws(()=>compare(
  broken,
  perfect.filter(row=>row.frame!==2)
),/identical ground-truth evidence/);
assert.throws(()=>compare(
  broken,
  perfect.map(row=>row.frame===4?{...row,gtId:'8'}:row)
),/identical ground-truth evidence/);

assert.throws(()=>evaluate([
  {frame:1,gtId:'7',trackId:'A'},
  {frame:1,gtId:'7',trackId:'B'}
]),/duplicate ground-truth observation/);

const missingEvidence=evaluate([
  {frame:null,gtId:'7',trackId:'A'},
  {frame:'',gtId:'7',trackId:'A'},
  {frame:'   ',gtId:'7',trackId:'A'},
  {frame:1,gtId:null,trackId:'A'},
  {frame:2,gtId:'',trackId:'A'},
  {frame:3,gtId:'   ',trackId:'A'},
  {frame:4,gtId:'7',trackId:''},
  {frame:5,gtId:'7',trackId:'   '},
  {frame:6,gtId:' 7 ',trackId:' A '}
]);
assert.strictEqual(missingEvidence.groundTruthObservations,3);
assert.strictEqual(missingEvidence.matchedObservations,1);
assert.strictEqual(missingEvidence.missedObservations,2);
assert.strictEqual(missingEvidence.groundTruthPlayers,1);
assert.strictEqual(missingEvidence.producedTrackIds,1);
assert.strictEqual(missingEvidence.observedCoverage,1/3);

const explicitZero=evaluate([{frame:0,gtId:0,trackId:0}]);
assert.strictEqual(explicitZero.groundTruthObservations,1);
assert.strictEqual(explicitZero.matchedObservations,1);
assert.strictEqual(explicitZero.observedCoverage,1);

console.log('tracking benchmark non-regression: PASS');
