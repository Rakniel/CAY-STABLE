'use strict';
const assert=require('node:assert/strict');
const Pipeline=require('../roster_metric_pipeline_v1.js');

const source=(overrides={})=>({
  rows:1,cols:2,pitchLengthM:105,pitchWidthM:68,
  heatmapBasis:'OBSERVATIONS',cells:[[1,3]],quality:'FIABLE',...overrides
});
const time=(overrides={})=>source({
  heatmapBasis:'TIME_SECONDS',timeCells:[[0.5,1.5]],
  startMs:0,endMs:2000,projectedIntervalSeconds:2,...overrides
});

assert.ok(Pipeline.mergeHeatmaps([source({observations:4})]));
assert.equal(Pipeline.mergeHeatmaps([source({observations:3})]),null);
assert.equal(Pipeline.mergeHeatmaps([source({observations:-1})]),null);
assert.equal(Pipeline.mergeHeatmaps([source({observations:4.5})]),null);
assert.equal(Pipeline.mergeHeatmaps([source({observations:Infinity})]),null);
assert.ok(Pipeline.mergeHeatmaps([time()]));
assert.equal(Pipeline.mergeHeatmaps([time({timeCells:[[3,0]]})]),null);
assert.equal(Pipeline.mergeHeatmaps([time({projectedIntervalSeconds:1})]),null);
assert.equal(Pipeline.mergeHeatmaps([time({projectedIntervalSeconds:3})]),null);
assert.equal(Pipeline.mergeHeatmaps([time({projectedIntervalSeconds:Infinity})]),null);
assert.equal(Pipeline.mergeHeatmaps([time({startMs:0,endMs:1000,projectedIntervalSeconds:2})]),null);
assert.ok(Pipeline.mergeHeatmaps([time({projectedIntervalSeconds:2.000001})]),'microsecond rounding tolerance');
assert.ok(Pipeline.mergeHeatmaps([time({startMs:undefined,endMs:undefined,projectedIntervalSeconds:2})]));
assert.ok(Pipeline.mergeHeatmaps([source(),source({cells:[[2,0]]})]),'legacy metadata-free heatmaps remain compatible');

console.log('roster_metric_heatmap_source_evidence_nonregression: PASS (14 assertions)');
