'use strict';
const assert=require('assert');
const Motion=require('../metric_motion_plausibility_v1.js');
const Heat=require('../metric_pitch_heatmap_v1.js');
const Quality=require('../metric_quality_guard_v1.js');

assert.equal(Motion.RAW_SPIKE_THRESHOLD_KMH,55);
const split=Motion.splitRawSpikeRuns([
  {time:0,x:0,y:0},
  {time:1,x:1,y:0},
  {time:2,x:20,y:0},
  {time:3,x:3,y:0},
  {time:4,x:4,y:0}
]);
assert.equal(split.rejectedPairs,2);
assert.deepStrictEqual(split.runs.map(r=>r.length),[2,1,2]);
assert.equal(Quality.splitRawSpikeRuns([
  {time:0,x:0,y:0},{time:1,x:20,y:0}
]).rejectedPairs,1,'quality guard must reuse the shared raw-motion veto');

const projector={validated:true,confidence:1,project:p=>({x:p.x,y:p.y})};
const teleport=Heat.build({fullPath:[
  {time:0,segment:1,x:0,y:10},
  {time:1,segment:1,x:1,y:10},
  {time:2,segment:1,x:20,y:10},
  {time:3,segment:1,x:3,y:10},
  {time:4,segment:1,x:4,y:10}
]},{1:projector},{pitchLengthM:105,pitchWidthM:68,cols:6,rows:4,maxDwellGapSec:1,minMetricCoverage:.35,minTemporalCoverage:.35});
assert.equal(teleport.rejectedRawSpikePairs,2);
assert.equal(teleport.rejectedRawSpikeSeconds,2);
assert.equal(teleport.eligibleIntervalSeconds,4);
assert.equal(teleport.projectedIntervalSeconds,2);
assert.equal(teleport.temporalCoverage,.5);
assert.equal(teleport.trajectory.rejectedRawSpikePairs,2);
assert.equal(teleport.trajectory.runs.length,2);
assert.deepStrictEqual(teleport.trajectory.runs.map(r=>r.length),[2,2]);
assert.equal(teleport.rawSpikeThresholdKmh,55);
assert.equal(teleport.rawMotionPolicy,'VETO_PARTAGE_AVEC_METRIC_QUALITY_GUARD_AVANT_TRAJECTOIRE_ET_REPARTITION_TEMPORELLE_HEATMAP');

const pureTeleport=Heat.build({fullPath:[
  {time:0,segment:1,x:0,y:10},
  {time:1,segment:1,x:20,y:10}
]},{1:projector},{maxDwellGapSec:1,minMetricCoverage:0,minTemporalCoverage:.35});
assert.equal(pureTeleport.rejectedRawSpikePairs,1);
assert.equal(pureTeleport.projectedIntervalSeconds,0);
assert.equal(pureTeleport.temporalCoverage,0);
assert.equal(pureTeleport.status,'INDISPONIBLE');
assert.equal(pureTeleport.trajectory.status,'INDISPONIBLE');
assert.equal(pureTeleport.trajectory.points.length,0);

const clean=Heat.build({fullPath:[
  {time:0,segment:1,x:0,y:10},
  {time:1,segment:1,x:1,y:10},
  {time:2,segment:1,x:2,y:10}
]},{1:projector},{maxDwellGapSec:1});
assert.equal(clean.rejectedRawSpikePairs,0);
assert.equal(clean.projectedIntervalSeconds,2);
assert.equal(clean.temporalCoverage,1);
assert.equal(clean.trajectory.rejectedRawSpikePairs,0);
assert.equal(clean.trajectory.status,'DISPONIBLE');

console.log('metric_motion_plausibility_heatmap_nonregression: OK');
