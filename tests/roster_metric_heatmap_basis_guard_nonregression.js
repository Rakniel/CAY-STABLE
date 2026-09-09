'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

function source({basis,time=0,observations=3,index=0}={}){
  return {
    windowIndex:index,
    pitchLengthM:105,
    pitchWidthM:68,
    rows:2,
    cols:2,
    heatmapBasis:basis,
    cells:[[observations,0],[0,0]],
    timeCells:[[time,0],[0,0]]
  };
}

const observationOnly=Pipeline.mergeHeatmaps([
  source({basis:'OBSERVATIONS',time:0,observations:3,index:0}),
  source({basis:'OBSERVATIONS',time:0,observations:2,index:1})
]);
assert.ok(observationOnly,'declared observation-count heatmaps should remain mergeable even when zero-filled timeCells exist');
assert.strictEqual(observationOnly.heatmapBasis,'OBSERVATION_COUNT_CONFIRMED_PARTICIPATION');
assert.deepStrictEqual(observationOnly.cells,[[5,0],[0,0]],'observation counts must be aggregated instead of silently switching to zero timeCells');

const timed=Pipeline.mergeHeatmaps([
  source({basis:'TIME_SECONDS',time:.4,observations:3,index:0}),
  source({basis:'TIME_SECONDS',time:.6,observations:2,index:1})
]);
assert.ok(timed);
assert.strictEqual(timed.heatmapBasis,'TIME_WEIGHTED_CONFIRMED_PARTICIPATION');
assert.deepStrictEqual(timed.cells,[[1,0],[0,0]]);

const mixed=Pipeline.mergeHeatmaps([
  source({basis:'TIME_SECONDS',time:.4,observations:3,index:0}),
  source({basis:'OBSERVATIONS',time:0,observations:2,index:1})
]);
assert.strictEqual(mixed,null,'seconds and observation counts must fail closed instead of being merged under one label');

const legacyTimed=Pipeline.mergeHeatmaps([
  source({basis:null,time:.25,observations:1,index:0})
]);
assert.ok(legacyTimed,'legacy fixtures without explicit basis keep the prior timeCells inference path');
assert.strictEqual(legacyTimed.heatmapBasis,'TIME_WEIGHTED_CONFIRMED_PARTICIPATION');

console.log('roster_metric_heatmap_basis_guard_nonregression: PASS');
