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
assert.equal(physicalWithoutCoreReadiness.physicalMetricsComplete,true,'raw reliable physical evidence remains visible diagnostically');
assert.equal(physicalWithoutCoreReadiness.metricReady,false,'physical evidence cannot become a player result without tracking+trajectory+heatmap');
assert.equal(physicalWithoutCoreReadiness.status,'TRACKING_DISPONIBLE');

const partialPhysical={
  ...trajectoryOnly,
  pitchVisuals:{status:'DISPONIBLE',trajectory:{status:'DISPONIBLE'},heatmap:{status:'DISPONIBLE'}},
  metrics:{
    distanceM:{status:'PARTIEL',value:1234.5},
    avgSpeedKmh:{status:'PARTIEL',value:7.2},
    maxSpeedKmh:{status:'PARTIEL',value:28.1},
    sprintCount:{status:'PARTIEL',value:2}
  }
};
const partialPhysicalReadiness=VM.firstResultsReadiness(partialPhysical);
assert.equal(partialPhysicalReadiness.pitchVisualCore,true);
assert.equal(partialPhysicalReadiness.physicalMetricsAvailable,true,'partial values stay visible for diagnosis');
assert.equal(partialPhysicalReadiness.distanceAvailable,true);
assert.equal(partialPhysicalReadiness.distance,false,'partial distance must not count as a reliable first result');
assert.equal(partialPhysicalReadiness.physicalMetrics,false,'partial-only metrics must not count as reliable physical results');
assert.equal(partialPhysicalReadiness.physicalMetricsComplete,false);
assert.equal(partialPhysicalReadiness.metricReady,false,'four partial metrics must never unlock physical testability');

const mixedPhysical={
  ...partialPhysical,
  metrics:{...partialPhysical.metrics,distanceM:{status:'FIABLE',value:1234.5}}
};
const mixedPhysicalReadiness=VM.firstResultsReadiness(mixedPhysical);
assert.equal(mixedPhysicalReadiness.distance,true);
assert.equal(mixedPhysicalReadiness.physicalMetrics,true,'reliable evidence may remain visible even if the complete set is not ready');
assert.equal(mixedPhysicalReadiness.physicalMetricsComplete,false);
assert.equal(mixedPhysicalReadiness.metricReady,false);

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
assert.equal(defendedReadiness.sprints,true,'a measured zero sprint count is still an available reliable result');
assert.equal(defendedReadiness.physicalMetrics,true);
assert.equal(defendedReadiness.metricReady,true);

const summary=VM.readinessSummary([trackedOnly,trajectoryOnly,heatmapOnly,physicalWithoutCore,partialPhysical,mixedPhysical,defended]);
assert.equal(summary.status,'TERRAIN_DISPONIBLE');
assert.equal(summary.players,7);
assert.equal(summary.withTracking,7);
assert.equal(summary.withPitchTrajectory,4);
assert.equal(summary.withPitchHeatmap,4);
assert.equal(summary.withMetricDistance,3,'only FIABLE distance values count as ready');
assert.equal(summary.withMetricAvgSpeed,2);
assert.equal(summary.withMetricMaxSpeed,2);
assert.equal(summary.withMetricSprints,2);
assert.equal(summary.withPhysicalMetrics,3);
assert.equal(summary.withPhysicalMetricsAvailable,4,'available partial evidence remains explicitly countable without promotion');
assert.equal(summary.withCompletePhysicalMetrics,2);
assert.equal(summary.withPitchResults,3,'summary must count only complete tracking+trajectory+heatmap cores');
assert.equal(summary.metricReadyPlayers,1,'only a complete pitch core plus four FIABLE physical metrics is ready');
assert.match(summary.policy,/TOUS_FIABLES/);

const empty=VM.readinessSummary([]);
assert.equal(empty.status,'INDISPONIBLE');
assert.equal(empty.players,0);

console.log('player card first-results readiness non-regression: PASS');
