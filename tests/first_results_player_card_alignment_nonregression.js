'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const unavailable={status:'INDISPONIBLE',value:null,reason:'preuve insuffisante'};
const trajectoryOnly={
  id:7,
  presence:{observations:20,trackingCoverage:100},
  observedVisuals:{status:'DISPONIBLE'},
  pitchVisuals:{
    status:'DISPONIBLE',
    trajectory:{status:'DISPONIBLE'},
    heatmap:null,
    spatialCoverage:62,
    physicalMetricCoverage:0,
    participationSeconds:40,
    renderedSeconds:24.8
  },
  metrics:{distanceM:unavailable,avgSpeedKmh:unavailable,maxSpeedKmh:unavailable,sprintCount:unavailable},
  firstResults:{
    status:'TERRAIN_DISPONIBLE',
    tracking:true,
    trajectory:true,
    heatmap:false,
    distance:false,
    avgSpeed:false,
    maxSpeed:false,
    sprints:false,
    physicalMetrics:false,
    physicalMetricsComplete:false,
    pitchResults:true
  }
};
const complete={
  ...trajectoryOnly,
  id:8,
  pitchVisuals:{...trajectoryOnly.pitchVisuals,heatmap:{status:'DISPONIBLE'}},
  firstResults:{...trajectoryOnly.firstResults,heatmap:true,pitchResults:true}
};

const model={
  players:[trajectoryOnly,complete],
  summary:{players:2,status:'TERRAIN_DISPONIBLE',withPitchResults:2,withCompletePhysicalMetrics:0}
};
const testability=Gate.evaluate(model);
assert.equal(testability.version,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8');
assert.equal(testability.status,'PITCH_VISUAL_TESTABLE');
assert.equal(testability.withCorePitchVisuals,1);

const aligned=Gate.alignPlayerCards(model,testability);
assert.equal(aligned.players[0].firstResults.status,'TRACKING_TESTABLE','trajectory without heatmap must stay below pitch-visual testable');
assert.equal(aligned.players[0].firstResults.pitchResults,false,'isolated trajectory must not advertise pitch results as ready');
assert.equal(aligned.players[0].firstResults.pitchVisualCore,false);
assert.equal(aligned.players[0].firstResults.nextAction,'DEBLOQUER_VISUELS_TERRAIN:heatmap');
assert.equal(aligned.players[1].firstResults.status,'PITCH_VISUAL_TESTABLE');
assert.equal(aligned.players[1].firstResults.pitchResults,true);
assert.equal(aligned.summary.status,'PITCH_VISUAL_TESTABLE');
assert.equal(aligned.summary.withPitchResults,1,'summary must count only complete tracking+trajectory+heatmap cores');
assert.equal(aligned.summary.withCorePitchVisuals,1);
assert.equal(aligned.canonicalReadinessVersion,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8');

const physical={
  ...complete,
  id:9,
  firstResults:{...complete.firstResults,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true}
};
const physicalModel={players:[physical],summary:{players:1,status:'TERRAIN_DISPONIBLE',withPitchResults:1,withCompletePhysicalMetrics:1}};
const physicalGate=Gate.evaluate(physicalModel);
const physicalAligned=Gate.alignPlayerCards(physicalModel,physicalGate);
assert.equal(physicalGate.status,'PHYSICAL_TESTABLE');
assert.equal(physicalAligned.players[0].firstResults.status,'PHYSICAL_TESTABLE');
assert.equal(physicalAligned.players[0].firstResults.metricReady,true);
assert.equal(physicalAligned.summary.metricReadyPlayers,1);

console.log('first-results player-card canonical alignment non-regression: PASS');