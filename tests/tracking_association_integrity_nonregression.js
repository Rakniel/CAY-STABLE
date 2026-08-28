const assert=require('assert');
const {evaluate,compare}=require('../tracking_benchmark_v1.js');

const clean=[
  {frame:1,gtId:'7',trackId:'A'},{frame:2,gtId:'7',trackId:'A'},
  {frame:1,gtId:'9',trackId:'B'},{frame:2,gtId:'9',trackId:'B'}
];
const merged=[
  {frame:1,gtId:'7',trackId:'A'},{frame:2,gtId:'7',trackId:'A'},
  {frame:1,gtId:'9',trackId:'A'},{frame:2,gtId:'9',trackId:'A'}
];
const split=[
  {frame:1,gtId:'7',trackId:'A'},{frame:2,gtId:'7',trackId:'B'},
  {frame:1,gtId:'9',trackId:'C'},{frame:2,gtId:'9',trackId:'C'}
];

const good=evaluate(clean);
assert.strictEqual(good.observedCoverage,1);
assert.strictEqual(good.identityContinuity,1);
assert.strictEqual(good.gtAssociationPurity,1);
assert.strictEqual(good.trackAssociationPurity,1);
assert.strictEqual(good.associationIntegrity,1);
assert.strictEqual(good.mergedTrackIds,0);
assert.strictEqual(good.splitGroundTruthIds,0);

const collision=evaluate(merged);
assert.strictEqual(collision.observedCoverage,1);
assert.strictEqual(collision.identityContinuity,1,'legacy continuity alone misses cross-player ID collisions');
assert.strictEqual(collision.gtAssociationPurity,1);
assert.strictEqual(collision.trackAssociationPurity,0.5);
assert.ok(collision.associationIntegrity<1);
assert.strictEqual(collision.mergedTrackIds,1);
assert.strictEqual(collision.splitGroundTruthIds,0);

const fragmentedIdentity=evaluate(split);
assert.strictEqual(fragmentedIdentity.trackAssociationPurity,1);
assert.strictEqual(fragmentedIdentity.gtAssociationPurity,0.75);
assert.ok(fragmentedIdentity.associationIntegrity<1);
assert.strictEqual(fragmentedIdentity.splitGroundTruthIds,1);
assert.strictEqual(fragmentedIdentity.idSwitches,1);

const improvement=compare(merged,clean);
assert.ok(improvement.delta.trackAssociationPurity>0);
assert.ok(improvement.delta.associationIntegrity>0);
assert.strictEqual(improvement.delta.mergedTrackIds,-1);

console.log('tracking association integrity non-regression: PASS');
