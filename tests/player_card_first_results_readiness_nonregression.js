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
assert.equal(trackedReadiness.pitchVisualCore,false);
assert.equal(trackedReadiness.metricReady,false);

const trajectoryOnly={
  ...trackedOnly,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:null}
};
const trajectoryReadiness=VM.firstResultsReadiness(trajectoryOnly);
assert.equal(trajectoryReadiness.status,'TRACKING_DISPONIBLE','trajectory alone must not promote a raw player card to pitch-ready');
assert.equal(trajectoryReadiness.trajectory,true);
assert.equal(trajectoryReadiness.heatmap,false,'trajectory evidence must not imply a heatmap');
assert.equal(trajectoryReadiness.pitchVisualCore,false);
assert.equal(trajectoryReadiness.pitchResults,false);
assert.equal(trajectoryReadiness.physicalMetrics,false,'terrain visuals must not imply physical metrics');

const heatmapOnly={
  ...trackedOnly,
  pitchVisuals:{status:'DISPONIBLE',trajectory:null,heatmap:{status:'DISPONIBLE'}}
};
const heatmapReadiness=VM.firstResultsReadiness(heatmapOnly);
assert.equal(heatmapReadiness.status,'TRACKING_DISPONIBLE','heatmap alone must not promote a raw player card to pitch-ready');
assert.equal(heatmapReadiness.pitchVisualCore,false);
assert.equal(heatmapReadiness.pitchResults,false);

const physicalWithoutCore={
  ...trackedOnly,
  metrics:{
    distanceM:{status:'FIABLE',value:1234.5},
    avgSpeedKmh:{status:'FIABLE',value:7.2},
    maxSpeedKmh:{status:'FIABLE',value:28.1},
    sprintCount:{status:'FIABLE',value:0}
  }
};
const physicalWithoutCoreReadiness=VM.firstResultsReadiness(physicalWithoutCore);
assert.equal(physicalWithoutCoreReadiness.physicalMetricsComplete,true,'raw physical evidence remains visible diagnostically');
assert.equal(physicalWithoutCoreReadiness.metricReady,false,'physical evidence cannot become a player result without tracking+trajectory+heatmap');
assert.equal(physicalWithoutCoreReadiness.status,'TRACKING_DISPONIBLE');

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
assert.equal(defendedReadiness.status,'TERRAIN_DISPONIBLE');
assert.equal(defendedReadiness.heatmap,true);
assert.equal(defendedReadiness.pitchVisualCore,true);
assert.equal(defendedReadiness.pitchResults,true);
assert.equal(defendedReadiness.distance,true);
assert.equal(defendedReadiness.sprints,true,'a measured zero sprint count is still an available result');
assert.equal(defendedReadiness.physicalMetrics,true);
assert.equal(defendedReadiness.metricReady,true);

const summary=VM.readinessSummary([trackedOnly,trajectoryOnly,heatmapOnly,physicalWithoutCore,defended]);
assert.equal(summary.status,'TERRAIN_DISPONIBLE');
assert.equal(summary.players,5);
assert.equal(summary.withTracking,5);
assert.equal(summary.withPitchTrajectory,2);
assert.equal(summary.withPitchHeatmap,2);
assert.equal(summary.withMetricDistance,2);
assert.equal(summary.withMetricAvgSpeed,2);
assert.equal(summary.withMetricMaxSpeed,2);
assert.equal(summary.withMetricSprints,2);
assert.equal(summary.withPhysicalMetrics,2);
assert.equal(summary.withCompletePhysicalMetrics,2);
assert.equal(summary.withPitchResults,1,'summary must count only complete tracking+trajectory+heatmap cores');
assert.equal(summary.metricReadyPlayers,1,'complete physical metrics without the pitch core stay diagnostic only');
assert.match(summary.policy,/TERRAIN_DISPONIBLE_EXIGE_TRACKING_ET_TRAJECTOIRE_ET_HEATMAP/);

const empty=VM.readinessSummary([]);
assert.equal(empty.status,'INDISPONIBLE');
assert.equal(empty.players,0);

console.log('player card first-results readiness non-regression: PASS');
