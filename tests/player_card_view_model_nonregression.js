'use strict';
const assert=require('assert');
const VM=require('../player_card_view_model_v1.js');

const report={players:[{
  id:7,cat:'CAY',identityQuality:'FIABLE',identityConfidence:.92,reidentifications:1,observedDuration:12.5,observations:5,segments:[0],presenceIntervals:[{start:0,end:12.5}],
  observedVisuals:{status:'DISPONIBLE',observationCoverage:1,trajectory:{status:'DISPONIBLE',coordinateSystem:'IMAGE_NORMALIZED',runs:[[{x:.2,y:.3,time:0,segment:0},{x:.3,y:.4,time:1,segment:0}]]},heatmap:{status:'DISPONIBLE',coordinateSystem:'IMAGE_NORMALIZED',normalizedCells:[[.5,.5]]}},
  metricVisuals:{status:'INDISPONIBLE',reason:'calibration absente'},
  metric:{metricCoverage:0,distanceM:null,avgSpeedKmh:null,maxSpeedKmh:null,sprintCount:null,quality:'INDISPONIBLE'},
  rosterState:{visibility:'ACTIF_TRACKING'}
}]};
const built=VM.build(report);
assert.equal(built.players.length,1);
const card=built.players[0];
assert.equal(card.observedVisuals.status,'DISPONIBLE');
assert.equal(card.observedVisuals.physicalMetricsAllowed,false);
assert.equal(card.observedVisuals.trajectory.coordinateSystem,'IMAGE_NORMALIZED');
assert.equal(card.pitchVisuals.status,'INDISPONIBLE');
assert.equal(card.metrics.distanceM.status,'INDISPONIBLE');
assert.equal(card.metrics.avgSpeedKmh.status,'INDISPONIBLE');
assert.equal(card.metrics.maxSpeedKmh.status,'INDISPONIBLE');
assert.equal(card.metrics.sprintCount.status,'INDISPONIBLE');
assert.equal(card.presence.trackingCoverage,100);

const metricCard=VM.buildCard({...report.players[0],metricVisuals:{status:'DISPONIBLE',metricCoverage:.8,trajectory:{status:'DISPONIBLE'},pitchHeatmap:{status:'DISPONIBLE'}},metric:{metricCoverage:.8,distanceM:1234.5,avgSpeedKmh:7.2,maxSpeedKmh:28.1,sprintCount:2,quality:'FIABLE'}});
assert.equal(metricCard.metrics.distanceM.status,'FIABLE');
assert.equal(metricCard.metrics.distanceM.value,1234.5);
assert.equal(metricCard.metrics.sprintCount.value,2);
assert.equal(metricCard.pitchVisuals.coordinateSystem,'PITCH_METERS');
assert.equal(metricCard.pitchVisuals.metricCoverage,80);

const zeroValue=VM.metricValue({metricCoverage:.5,sprintCount:0,quality:'PARTIEL'},'sprintCount','Sprints');
assert.equal(zeroValue.status,'PARTIEL');
assert.equal(zeroValue.value,0,'zero is a valid measured metric and must not be treated as missing');

console.log('player card view model non-regression: PASS');
