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
assert.doesNotMatch(trackedHtml,/TERRAIN PRÊT À TESTER/,'tracking alone must never claim pitch readiness');

const trajectorySource={
  ...base,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:null}
};
const trajectoryOnly={...trajectorySource,firstResults:VM.firstResultsReadiness(trajectorySource)};
const trajectoryHtml=Renderer.playerReadinessHtml(trajectoryOnly);
assert.match(trajectoryHtml,/TRACKING PRÊT — TERRAIN EN COURS/,'trajectory alone must remain below the strict pitch-visual testability gate');
assert.doesNotMatch(trajectoryHtml,/TERRAIN PRÊT À TESTER/,'trajectory without heatmap must never be advertised as pitch-testable');
assert.match(trajectoryHtml,/✓ trajectoire/);
assert.match(trajectoryHtml,/— heatmap/);
assert.match(trajectoryHtml,/— stats/,'terrain visuals must not imply physical metrics');

const visualReadySource={
  ...trajectorySource,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:{status:'DISPONIBLE'}},
};
const visualReady={...visualReadySource,firstResults:VM.firstResultsReadiness(visualReadySource)};
const visualReadyHtml=Renderer.playerReadinessHtml(visualReady);
assert.match(visualReadyHtml,/TERRAIN PRÊT À TESTER/,'tracking + trajectory + heatmap is the minimum pitch-testable player core');
assert.match(visualReadyHtml,/✓ tracking/);
assert.match(visualReadyHtml,/✓ trajectoire/);
assert.match(visualReadyHtml,/✓ heatmap/);
assert.match(visualReadyHtml,/— stats 0\/4/);

const defendedSource={
  ...visualReadySource,
  metrics:{
    distanceM:{status:'FIABLE',value:1234.5},
    avgSpeedKmh:{status:'FIABLE',value:7.2},
    maxSpeedKmh:{status:'FIABLE',value:28.1},
    sprintCount:{status:'FIABLE',value:0}
  }
};
const defended={...defendedSource,firstResults:VM.firstResultsReadiness(defendedSource)};
const defendedHtml=Renderer.playerReadinessHtml(defended);
assert.match(defendedHtml,/TERRAIN PRÊT À TESTER/);
assert.match(defendedHtml,/✓ tracking/);
assert.match(defendedHtml,/✓ trajectoire/);
assert.match(defendedHtml,/✓ heatmap/);
assert.match(defendedHtml,/✓ stats 4\/4/,'zero measured sprints still belongs to an available physical result set');

const contradictory=Renderer.playerReadinessHtml({firstResults:{tracking:false,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true}});
assert.match(contradictory,/PREUVES INSUFFISANTES/,'physical fields cannot bypass missing tracking evidence');
assert.match(contradictory,/— stats 4\/4/,'complete physical values remain visible as evidence but not ready without the pitch visual core');
assert.doesNotMatch(contradictory,/✓ stats 4\/4/);

const unavailableHtml=Renderer.playerReadinessHtml({firstResults:{status:'INDISPONIBLE'}});
assert.match(unavailableHtml,/PREUVES INSUFFISANTES/);
assert.doesNotMatch(unavailableHtml,/✓ /);

console.log('player card per-player readiness non-regression: PASS');
