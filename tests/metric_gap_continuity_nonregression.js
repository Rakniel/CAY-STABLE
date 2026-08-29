const assert=require('assert');
const stats=require('../player_stats_v1.js');

const projectors={0:{validated:true,confidence:1,source:'synthetic',project:p=>({x:p.x,y:p.y})}};

const contiguous={fullPath:[
  {time:0,segment:0,x:0,y:0},
  {time:.5,segment:0,x:2,y:0},
  {time:1,segment:0,x:4,y:0}
]};
const contiguousMetric=stats.metricForTrack(contiguous,projectors);
assert.strictEqual(contiguousMetric.distanceM,4);
assert.strictEqual(contiguousMetric.metricCoveredSeconds,1);
assert.strictEqual(contiguousMetric.gapBreaks,0);
assert.strictEqual(contiguousMetric.metricCoverage,1);

const longGap={fullPath:[
  {time:0,segment:0,x:0,y:0},
  {time:.5,segment:0,x:2,y:0},
  {time:2.5,segment:0,x:10,y:0},
  {time:3,segment:0,x:12,y:0}
]};
const gapMetric=stats.metricForTrack(longGap,projectors);
assert.strictEqual(stats.MAX_METRIC_GAP_SEC,1);
assert.strictEqual(gapMetric.distanceM,4,'distance across a 2s unseen gap must not be credited');
assert.strictEqual(gapMetric.metricCoveredSeconds,1);
assert.strictEqual(gapMetric.eligibleSeconds,3);
assert.strictEqual(gapMetric.rejectedGapSeconds,2);
assert.strictEqual(gapMetric.gapBreaks,1);
assert.strictEqual(gapMetric.metricCoverage,.3333);
assert.strictEqual(gapMetric.quality,'PARTIEL');
assert.strictEqual(gapMetric.speedSamples.length,2);

const oldBehaviorDistance=12; // prior <=3s rule credited 8m across the unseen 2s gap.
assert.ok(gapMetric.distanceM<oldBehaviorDistance);
assert.strictEqual(oldBehaviorDistance-gapMetric.distanceM,8);

const sprintGap={fullPath:[
  {time:0,segment:0,x:0,y:0},
  {time:.5,segment:0,x:4,y:0},
  {time:2.5,segment:0,x:20,y:0},
  {time:3,segment:0,x:24,y:0}
]};
const sprintMetric=stats.metricForTrack(sprintGap,projectors);
assert.strictEqual(sprintMetric.sprintCount,0,'two sub-second fast bursts separated by a long gap must not form one sprint');
assert.strictEqual(sprintMetric.gapBreaks,1);

console.log(JSON.stringify({
  ok:true,
  maxMetricGapSec:stats.MAX_METRIC_GAP_SEC,
  beforeDistanceM:oldBehaviorDistance,
  afterDistanceM:gapMetric.distanceM,
  avoidedPhantomDistanceM:oldBehaviorDistance-gapMetric.distanceM,
  coverageAfter:gapMetric.metricCoverage,
  gapBreaks:gapMetric.gapBreaks
},null,2));
