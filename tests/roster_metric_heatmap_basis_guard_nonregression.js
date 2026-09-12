'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

function source({basis,time=0,observations=3,index=0,cells=null,timeCells=null}={}){
  return {
    windowIndex:index,
    pitchLengthM:105,
    pitchWidthM:68,
    rows:2,
    cols:2,
    heatmapBasis:basis,
    cells:cells||[[observations,0],[0,0]],
    timeCells:timeCells||[[time,0],[0,0]]
  };
}

const observationOnly=Pipeline.mergeHeatmaps([
  source({basis:'OBSERVATIONS',time:0,observations:3,index:0}),
  source({basis:'OBSERVATIONS',time:0,observations:2,index:1})
]);
assert.ok(observationOnly,'declared observation-count heatmaps should remain mergeable even when zero-filled timeCells exist');
assert.strictEqual(observationOnly.heatmapBasis,'OBSERVATION_COUNT_CONFIRMED_PARTICIPATION');
assert.deepStrictEqual(observationOnly.cells,[[5,0],[0,0]],'observation counts must remain observation counts');
assert.deepStrictEqual(observationOnly.timeCells,[[0,0],[0,0]],'timeCells must remain seconds even for an observation-based heatmap');
assert.deepStrictEqual(observationOnly.normalizedCells,[[1,0],[0,0]],'normalizedCells must follow the declared observation basis');

const timed=Pipeline.mergeHeatmaps([
  source({basis:'TIME_SECONDS',time:.4,observations:3,index:0}),
  source({basis:'TIME_SECONDS',time:.6,observations:2,index:1})
]);
assert.ok(timed);
assert.strictEqual(timed.heatmapBasis,'TIME_WEIGHTED_CONFIRMED_PARTICIPATION');
assert.deepStrictEqual(timed.cells,[[5,0],[0,0]],'cells must not silently change unit from observations to seconds');
assert.deepStrictEqual(timed.timeCells,[[1,0],[0,0]],'timeCells must aggregate temporal dwell in seconds');
assert.deepStrictEqual(timed.normalizedCells,[[1,0],[0,0]],'normalizedCells must follow the declared time basis');
assert.deepStrictEqual(timed.normalizedObservationCells,[[1,0],[0,0]]);
assert.deepStrictEqual(timed.normalizedTimeCells,[[1,0],[0,0]]);

const distributed=Pipeline.mergeHeatmaps([
  source({basis:'TIME_SECONDS',index:0,cells:[[3,1],[0,0]],timeCells:[[3,1],[0,0]]}),
  source({basis:'TIME_SECONDS',index:1,cells:[[1,3],[0,0]],timeCells:[[1,3],[0,0]]})
]);
assert.ok(distributed);
assert.deepStrictEqual(distributed.timeCells,[[4,4],[0,0]]);
assert.deepStrictEqual(distributed.normalizedCells,[[.5,.5],[0,0]],'merged heatmaps must preserve occupancy-share semantics instead of max-normalizing each hottest cell to 1');
assert.strictEqual(distributed.normalization,'TOTAL_DISTRIBUTION_SUM_1');
assert.strictEqual(distributed.normalizedCells.flat().reduce((sum,value)=>sum+value,0),1,'merged normalized heatmap must remain a probability distribution');

const asymmetric=Pipeline.mergeHeatmaps([
  source({basis:'OBSERVATIONS',index:0,cells:[[3,1],[0,0]],timeCells:[[0,0],[0,0]]}),
  source({basis:'OBSERVATIONS',index:1,cells:[[3,1],[0,0]],timeCells:[[0,0],[0,0]]})
]);
assert.deepStrictEqual(asymmetric.normalizedCells,[[.75,.25],[0,0]],'relative occupancy shares must be preserved across merged participation windows');

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
assert.deepStrictEqual(legacyTimed.cells,[[1,0],[0,0]],'legacy time inference must not mutate the cells observation unit');
assert.deepStrictEqual(legacyTimed.timeCells,[[.25,0],[0,0]]);

console.log('roster_metric_heatmap_basis_guard_nonregression: PASS');
