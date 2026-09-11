'use strict';
const assert=require('assert');
const Motion=require('../metric_motion_plausibility_v1.js');

const spike=Motion.splitRawSpikeRuns([
  {time:0,x:0,y:0,segment:1},
  {time:1,x:1,y:0,segment:1},
  {time:2,x:20,y:0,segment:1},
  {time:3,x:3,y:0,segment:1},
  {time:4,x:4,y:0,segment:1}
]);
assert.equal(spike.rejectedPairs,2,'two impossible raw-speed transitions must be rejected');
assert.equal(spike.rejectedTimedIntervals,2,'each rejected transition with a known positive dt must stay auditable');
assert.equal(spike.rejectedSeconds,2,'the full two seconds affected by impossible motion must be attributed');
assert.equal(spike.rejectedByReason['vitesse brute métrique au-dessus du seuil de plausibilité'],2);
assert.deepStrictEqual(spike.runs.map(r=>r.length),[2,1,2]);

const planBoundary=Motion.splitRawSpikeRuns([
  {time:0,x:10,y:10,segment:1},
  {time:1,x:11,y:10,segment:2}
]);
assert.equal(planBoundary.rejectedPairs,1);
assert.equal(planBoundary.rejectedTimedIntervals,1);
assert.equal(planBoundary.rejectedSeconds,1);
assert.equal(planBoundary.rejectedByReason['changement de plan métrique: transition inter-segment interdite'],1);

const missingTime=Motion.splitRawSpikeRuns([
  {time:null,x:0,y:0,segment:1},
  {time:1,x:1,y:0,segment:1}
]);
assert.equal(missingTime.rejectedPairs,1,'missing time must still fail closed');
assert.equal(missingTime.rejectedTimedIntervals,0,'unknown elapsed time must never be invented');
assert.equal(missingTime.rejectedSeconds,0,'unknown elapsed time must contribute zero fabricated seconds');
assert.equal(missingTime.rejectedByReason['transition métrique temporelle invalide'],1);

const clean=Motion.splitRawSpikeRuns([
  {time:0,x:0,y:0,segment:1},
  {time:1,x:1,y:0,segment:1},
  {time:2,x:2,y:0,segment:1}
]);
assert.equal(clean.rejectedPairs,0);
assert.equal(clean.rejectedTimedIntervals,0);
assert.equal(clean.rejectedSeconds,0);
assert.deepStrictEqual(clean.rejectedByReason,{});

console.log('metric_motion_rejection_duration_nonregression: OK');
