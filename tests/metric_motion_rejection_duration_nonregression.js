'use strict';
const assert=require('assert');
const Motion=require('../metric_motion_plausibility_v1.js');

const spikeReason='vitesse brute métrique au-dessus du seuil de plausibilité';
const boundaryReason='changement de plan métrique: transition inter-segment interdite';
const invalidTimeReason='transition métrique temporelle invalide';

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
assert.equal(spike.rejectedByReason[spikeReason],2);
assert.equal(spike.rejectedTimedIntervalsByReason[spikeReason],2,'timed rejected intervals must be attributable by cause');
assert.equal(spike.rejectedSecondsByReason[spikeReason],2,'rejected elapsed seconds must be attributable by cause');
assert.deepStrictEqual(spike.runs.map(r=>r.length),[2,1,2]);

const mixed=Motion.splitRawSpikeRuns([
  {time:0,x:0,y:0,segment:1},
  {time:1,x:20,y:0,segment:1},
  {time:3,x:21,y:0,segment:2}
]);
assert.equal(mixed.rejectedPairs,2);
assert.equal(mixed.rejectedSeconds,3);
assert.equal(mixed.rejectedTimedIntervalsByReason[spikeReason],1);
assert.equal(mixed.rejectedSecondsByReason[spikeReason],1);
assert.equal(mixed.rejectedTimedIntervalsByReason[boundaryReason],1);
assert.equal(mixed.rejectedSecondsByReason[boundaryReason],2);
assert.equal(Object.values(mixed.rejectedSecondsByReason).reduce((sum,value)=>sum+value,0),mixed.rejectedSeconds,'per-cause seconds must reconcile with total rejected seconds');

const planBoundary=Motion.splitRawSpikeRuns([
  {time:0,x:10,y:10,segment:1},
  {time:1,x:11,y:10,segment:2}
]);
assert.equal(planBoundary.rejectedPairs,1);
assert.equal(planBoundary.rejectedTimedIntervals,1);
assert.equal(planBoundary.rejectedSeconds,1);
assert.equal(planBoundary.rejectedByReason[boundaryReason],1);
assert.equal(planBoundary.rejectedTimedIntervalsByReason[boundaryReason],1);
assert.equal(planBoundary.rejectedSecondsByReason[boundaryReason],1);

const missingTime=Motion.splitRawSpikeRuns([
  {time:null,x:0,y:0,segment:1},
  {time:1,x:1,y:0,segment:1}
]);
assert.equal(missingTime.rejectedPairs,1,'missing time must still fail closed');
assert.equal(missingTime.rejectedTimedIntervals,0,'unknown elapsed time must never be invented');
assert.equal(missingTime.rejectedSeconds,0,'unknown elapsed time must contribute zero fabricated seconds');
assert.equal(missingTime.rejectedByReason[invalidTimeReason],1);
assert.equal(missingTime.rejectedTimedIntervalsByReason[invalidTimeReason],undefined,'unknown elapsed time must not create a timed interval attribution');
assert.equal(missingTime.rejectedSecondsByReason[invalidTimeReason],undefined,'unknown elapsed time must not fabricate per-cause seconds');

const clean=Motion.splitRawSpikeRuns([
  {time:0,x:0,y:0,segment:1},
  {time:1,x:1,y:0,segment:1},
  {time:2,x:2,y:0,segment:1}
]);
assert.equal(clean.rejectedPairs,0);
assert.equal(clean.rejectedTimedIntervals,0);
assert.equal(clean.rejectedSeconds,0);
assert.deepStrictEqual(clean.rejectedByReason,{});
assert.deepStrictEqual(clean.rejectedTimedIntervalsByReason,{});
assert.deepStrictEqual(clean.rejectedSecondsByReason,{});

console.log('metric_motion_rejection_duration_nonregression: OK');
