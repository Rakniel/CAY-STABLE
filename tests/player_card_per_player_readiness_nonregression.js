'use strict';
const assert=require('assert');
const VM=require('../player_card_view_model_v1.js');
const Renderer=require('../player_card_renderer_v1.js');

const unavailable={status:'INDISPONIBLE',value:null,reason:'preuve insuffisante'};
const base={
  presence:{observations:12},
  observedVisuals:{status:'DISPONIBLE'},
  pitchVisuals:{status:'INDISPONIBLE',trajectory:null,heatmap:null},
  metrics:{distanceM:unavailable,avgSpeedKmh:unavailable,maxSpeedKmh:unavailable,sprintCount:unavailable}
};

const trackedOnly={...base,firstResults:VM.firstResultsReadiness(base)};
const trackedHtml=Renderer.playerReadinessHtml(trackedOnly);
assert.match(trackedHtml,/TRACKING PRÊT — TERRAIN EN COURS/);
assert.match(trackedHtml,/✓ tracking/);
assert.match(trackedHtml,/— trajectoire/);
assert.match(trackedHtml,/— heatmap/);
assert.match(trackedHtml,/— stats/);
assert.doesNotMatch(trackedHtml,/TERRAIN PRÊT/,'tracking alone must never claim pitch readiness');

const trajectorySource={
  ...base,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:null}
};
const trajectoryOnly={...trajectorySource,firstResults:VM.firstResultsReadiness(trajectorySource)};
const trajectoryHtml=Renderer.playerReadinessHtml(trajectoryOnly);
assert.match(trajectoryHtml,/TERRAIN PRÊT/);
assert.match(trajectoryHtml,/✓ trajectoire/);
assert.match(trajectoryHtml,/— heatmap/);
assert.match(trajectoryHtml,/— stats/,'terrain visuals must not imply physical metrics');

const defendedSource={
  ...trajectorySource,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:{status:'DISPONIBLE'}},
  metrics:{
    distanceM:{status:'FIABLE',value:1234.5},
    avgSpeedKmh:{status:'FIABLE',value:7.2},
    maxSpeedKmh:{status:'FIABLE',value:28.1},
    sprintCount:{status:'FIABLE',value:0}
  }
};
const defended={...defendedSource,firstResults:VM.firstResultsReadiness(defendedSource)};
const defendedHtml=Renderer.playerReadinessHtml(defended);
assert.match(defendedHtml,/TERRAIN PRÊT/);
assert.match(defendedHtml,/✓ tracking/);
assert.match(defendedHtml,/✓ trajectoire/);
assert.match(defendedHtml,/✓ heatmap/);
assert.match(defendedHtml,/✓ stats/,'zero measured sprints still belongs to an available physical result set');

const unavailableHtml=Renderer.playerReadinessHtml({firstResults:{status:'INDISPONIBLE'}});
assert.match(unavailableHtml,/PREUVES INSUFFISANTES/);
assert.doesNotMatch(unavailableHtml,/✓ /);

console.log('player card per-player readiness non-regression: PASS');
