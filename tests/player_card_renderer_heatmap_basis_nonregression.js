'use strict';
const assert=require('assert');
const Renderer=require('../player_card_renderer_v1.js');

const timed={
  heatmapBasis:'TIME_WEIGHTED_CONFIRMED_PARTICIPATION',
  cells:[[8,1],[0,0]],
  timeCells:[[.5,1.5],[0,0]],
  normalizedCells:[[1/3,1],[0,0]]
};
assert.strictEqual(Renderer.heatmapCells(timed),timed.timeCells,'time-weighted pitch heatmaps must render dwell seconds, not observation counts');

const observations={
  heatmapBasis:'OBSERVATION_COUNT_CONFIRMED_PARTICIPATION',
  cells:[[8,1],[0,0]],
  timeCells:[[.5,1.5],[0,0]],
  normalizedCells:[[1,.125],[0,0]]
};
assert.strictEqual(Renderer.heatmapCells(observations),observations.cells,'observation heatmaps must render observation counts');

const legacy={cells:[[2]],normalizedCells:[[1]]};
assert.strictEqual(Renderer.heatmapCells(legacy),legacy.normalizedCells,'legacy untyped heatmaps keep the normalized rendering fallback to avoid inventing a unit');

const normalizedOnly={heatmapBasis:'TIME_SECONDS',normalizedCells:[[.25,.75]]};
assert.strictEqual(Renderer.heatmapCells(normalizedOnly),normalizedOnly.normalizedCells,'missing declared-unit matrix falls back to already normalized evidence instead of another raw unit');

console.log('player_card_renderer_heatmap_basis_nonregression: PASS');
