'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

const source=(overrides={})=>({
  rows:1,cols:2,pitchLengthM:105,pitchWidthM:68,
  heatmapBasis:'OBSERVATIONS',cells:[[1,3]],quality:'FIABLE',...overrides
});
const valid=Pipeline.mergeHeatmaps([source(),source({cells:[[2,0]]})]);
assert.ok(valid,'positive evidence must remain mergeable');
assert.deepStrictEqual(valid.cells,[[3,3]]);
assert.deepStrictEqual(valid.normalizedCells,[[.5,.5]]);
assert.strictEqual(valid.quality,'FIABLE');

assert.strictEqual(Pipeline.matrixOk([[-1,1]],1,2),false,'negative occupancy is not evidence');
assert.strictEqual(Pipeline.matrixOk([[0,1]],1,2),true,'zero occupancy is valid');
assert.strictEqual(Pipeline.mergeHeatmaps([source({cells:[[-1,3]]})]),null,'reject negative observation count');
assert.strictEqual(Pipeline.mergeHeatmaps([source({timeCells:[[-.25,0]]})]),null,'reject negative optional dwell seconds');
assert.strictEqual(Pipeline.mergeHeatmaps([source({cells:[[null,3]]})]),null,'reject null cells');
assert.strictEqual(Pipeline.mergeHeatmaps([source({pitchLengthM:-105})]),null,'reject negative pitch length');
assert.strictEqual(Pipeline.mergeHeatmaps([source({pitchWidthM:0})]),null,'reject zero pitch width');
assert.strictEqual(Pipeline.mergeHeatmaps([source({pitchWidthM:Infinity})]),null,'reject nonfinite geometry');
assert.strictEqual(Pipeline.mergeHeatmaps([source({cells:[[Number.MAX_VALUE,0]]}),source({cells:[[Number.MAX_VALUE,0]]})]),null,'reject overflowing aggregated counts');
assert.deepStrictEqual(Pipeline.normalizeMatrix([[1,-1]]),[],'do not silently clip negative cells to zero');
assert.deepStrictEqual(Pipeline.normalizeMatrix([[Number.MAX_VALUE,Number.MAX_VALUE]]),[],'do not publish a NaN probability distribution');
assert.strictEqual(Pipeline.aggregateMatrix([{cells:[[Number.MAX_VALUE]]},{cells:[[Number.MAX_VALUE]]}],'cells',1,1),null,'reject overflow in aggregation');

const invalidPitch={status:'DISPONIBLE',rows:1,cols:2,pitchLengthM:0,pitchWidthM:68,cells:[[1,0]]};
assert.strictEqual(Pipeline.dominantGeometryGroup([{index:0,spatial:invalidPitch}]),null,'invalid geometry cannot become dominant');
const time=Pipeline.mergeHeatmaps([source({heatmapBasis:'TIME_SECONDS',timeCells:[[1,2]]})]);
assert.ok(time,'valid time-weighted heatmap must remain available');
assert.strictEqual(time.heatmapBasis,'TIME_WEIGHTED_CONFIRMED_PARTICIPATION');
assert.deepStrictEqual(time.normalizedCells,[[.333333,.666667]]);

console.log('roster_metric_heatmap_nonnegative_evidence_nonregression: PASS');
