'use strict';
const assert=require('assert');
const PlayerCards=require('../player_card_view_model_v1.js');

const partialRosterMetric={
  status:'PARTIEL',
  reason:'trajectoire terrain publiée sans heatmap : couverture insuffisante',
  spatial:{
    status:'PARTIEL',
    participationWindowCount:1,
    availableWindowCount:1,
    coherentWindowCount:1,
    renderedWindowCount:.07,
    excludedGeometryWindowCount:0,
    coverageNote:'trajectoire terrain publiée sans heatmap : couverture insuffisante',
    geometry:{coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:4,cols:6,sourceWindowIndexes:[0]},
    trajectory:{status:'PARTIEL',coordinateSystem:'PITCH_METERS',runs:[{windowIndex:0,points:[{x:10,y:20,time:0},{x:11,y:20,time:.5}]}],sourceWindowIndexes:[0]},
    heatmap:null
  }
};

const pitch=PlayerCards.rosterPitchVisuals({rosterMetric:partialRosterMetric,metric:{metricCoverage:0}});
assert.strictEqual(pitch.status,'DISPONIBLE','partial defendable trajectory must remain visible in the player card');
assert.strictEqual(pitch.quality,'PARTIEL','partial roster evidence must never be promoted to reliable UI quality');
assert.strictEqual(pitch.trajectory.status,'DISPONIBLE');
assert.strictEqual(pitch.heatmap,null);
assert.strictEqual(pitch.spatialCoverage,7);
assert.match(pitch.coverageNote,/sans heatmap/i);
assert.match(pitch.policy,/PARTIEL/);

const card=PlayerCards.buildCard({
  id:'p1',cat:'SENIOR',identityQuality:'FIABLE',observations:4,rosterMetric:partialRosterMetric,metric:{rosterBound:true,metricCoverage:0,publication:{status:'INDISPONIBLE',fieldStatus:{}}}
});
assert.strictEqual(card.firstResults.status,'TERRAIN_DISPONIBLE','trajectory-only first result must still count as an available pitch result');
assert.strictEqual(card.firstResults.trajectory,true);
assert.strictEqual(card.firstResults.heatmap,false);
assert.strictEqual(card.firstResults.physicalMetrics,false);
assert.strictEqual(card.metrics.distanceM.status,'INDISPONIBLE');
assert.strictEqual(card.metrics.avgSpeedKmh.status,'INDISPONIBLE');
assert.strictEqual(card.metrics.maxSpeedKmh.status,'INDISPONIBLE');
assert.strictEqual(card.metrics.sprintCount.status,'INDISPONIBLE');

console.log('player_card_partial_spatial_status_nonregression: PASS');
