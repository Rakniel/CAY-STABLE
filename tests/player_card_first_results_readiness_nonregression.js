'use strict';
const assert=require('assert');
const VM=require('../player_card_view_model_v1.js');

const unavailable={status:'INDISPONIBLE',value:null,reason:'preuve insuffisante'};
const trackedOnly={
  presence:{observations:12},
  observedVisuals:{status:'DISPONIBLE'},
  pitchVisuals:{status:'INDISPONIBLE',trajectory:null,heatmap:null},
  metrics:{distanceM:unavailable,avgSpeedKmh:unavailable,maxSpeedKmh:unavailable,sprintCount:unavailable}
};
const trackedReadiness=VM.firstResultsReadiness(trackedOnly);
assert.equal(trackedReadiness.status,'TRACKING_DISPONIBLE');
assert.equal(trackedReadiness.tracking,true);
assert.equal(trackedReadiness.pitchResults,false);
assert.equal(trackedReadiness.distance,false);

const trajectoryOnly={
  ...trackedOnly,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:null}
};
const trajectoryReadiness=VM.firstResultsReadiness(trajectoryOnly);
assert.equal(trajectoryReadiness.status,'TERRAIN_DISPONIBLE');
assert.equal(trajectoryReadiness.trajectory,true);
assert.equal(trajectoryReadiness.heatmap,false,'trajectory evidence must not imply a heatmap');
assert.equal(trajectoryReadiness.physicalMetrics,false,'terrain visuals must not imply physical metrics');

const defended={
  ...trajectoryOnly,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:{status:'DISPONIBLE'}},
  metrics:{
    distanceM:{status:'FIABLE',value:1234.5},
    avgSpeedKmh:{status:'FIABLE',value:7.2},
    maxSpeedKmh:{status:'FIABLE',value:28.1},
    sprintCount:{status:'FIABLE',value:0}
  }
};
const defendedReadiness=VM.firstResultsReadiness(defended);
assert.equal(defendedReadiness.heatmap,true);
assert.equal(defendedReadiness.distance,true);
assert.equal(defendedReadiness.sprints,true,'a measured zero sprint count is still an available result');
assert.equal(defendedReadiness.physicalMetrics,true);

const summary=VM.readinessSummary([trackedOnly,trajectoryOnly,defended]);
assert.equal(summary.status,'TERRAIN_DISPONIBLE');
assert.equal(summary.players,3);
assert.equal(summary.withTracking,3);
assert.equal(summary.withPitchTrajectory,2);
assert.equal(summary.withPitchHeatmap,1);
assert.equal(summary.withMetricDistance,1);
assert.equal(summary.withMetricAvgSpeed,1);
assert.equal(summary.withMetricMaxSpeed,1);
assert.equal(summary.withMetricSprints,1);
assert.equal(summary.withPhysicalMetrics,1);
assert.equal(summary.withPitchResults,2);
assert.match(summary.policy,/AUCUNE_DISPONIBILITE_DEDUITE_SANS_PREUVE_PUBLIEE/);

const empty=VM.readinessSummary([]);
assert.equal(empty.status,'INDISPONIBLE');
assert.equal(empty.players,0);

console.log('player card first-results readiness non-regression: PASS');
