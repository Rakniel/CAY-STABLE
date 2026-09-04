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
assert.equal(card.pitchVisuals.pitchLengthM,null);
assert.equal(card.pitchVisuals.pitchWidthM,null);
assert.equal(card.metrics.distanceM.status,'INDISPONIBLE');
assert.equal(card.metrics.avgSpeedKmh.status,'INDISPONIBLE');
assert.equal(card.metrics.maxSpeedKmh.status,'INDISPONIBLE');
assert.equal(card.metrics.sprintCount.status,'INDISPONIBLE');
assert.equal(card.presence.trackingCoverage,100);

const unsafeRawMetric=VM.buildCard({...report.players[0],metricVisuals:{status:'DISPONIBLE',pitchLengthM:999,pitchWidthM:999,metricCoverage:1,trajectory:{status:'DISPONIBLE',runs:[[{x:999,y:999}]]},pitchHeatmap:{status:'DISPONIBLE',cells:[[99]]}},metric:{metricCoverage:.8,distanceM:9999,avgSpeedKmh:99,maxSpeedKmh:99,sprintCount:99,quality:'FIABLE'}});
assert.equal(unsafeRawMetric.metrics.distanceM.status,'INDISPONIBLE','raw track metric must never be published as a roster player metric');
assert.match(unsafeRawMetric.metrics.distanceM.reason,/liaison roster/i);
assert.equal(unsafeRawMetric.pitchVisuals.status,'INDISPONIBLE','raw track pitch visuals must never bypass roster participation filtering');
assert.equal(unsafeRawMetric.pitchVisuals.pitchLengthM,null,'unsafe legacy pitch dimensions must not leak into roster card');

const rosterMetric={status:'FIABLE',spatial:{status:'FIABLE',participationWindowCount:2,availableWindowCount:2,trajectory:{status:'FIABLE',coordinateSystem:'PITCH_METERS',runs:[
  {windowIndex:0,startMs:0,endMs:30000,points:[{x:10,y:20,time:29}]},
  {windowIndex:1,startMs:40000,endMs:50000,points:[{x:40,y:30,time:40}]}
]},heatmaps:[
  {windowIndex:0,pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[1,0],[0,0]],timeCells:[[1,0],[0,0]]},
  {windowIndex:1,pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[0,0],[0,1]],timeCells:[[0,0],[0,2]]}
]}};
const metricCard=VM.buildCard({...report.players[0],metricVisuals:{status:'DISPONIBLE',pitchLengthM:999,pitchWidthM:999,metricCoverage:1,trajectory:{status:'DISPONIBLE',runs:[[{x:999,y:999}]]},pitchHeatmap:{status:'DISPONIBLE',cells:[[99]]}},metric:{metricCoverage:.8,distanceM:1234.5,avgSpeedKmh:7.2,maxSpeedKmh:28.1,sprintCount:2,quality:'FIABLE',rosterBound:true,source:'ROSTER_METRIC_PIPELINE_V1'},rosterMetric});
assert.equal(metricCard.metrics.distanceM.status,'FIABLE');
assert.equal(metricCard.metrics.distanceM.value,1234.5);
assert.equal(metricCard.metrics.sprintCount.value,2);
assert.equal(metricCard.pitchVisuals.status,'DISPONIBLE');
assert.equal(metricCard.pitchVisuals.source,'ROSTER_METRIC_PIPELINE_V1');
assert.equal(metricCard.pitchVisuals.coordinateSystem,'PITCH_METERS');
assert.equal(metricCard.pitchVisuals.metricCoverage,80);
assert.equal(metricCard.pitchVisuals.pitchLengthM,105,'pitch geometry comes from roster-bound spatial evidence, not legacy raw visuals');
assert.equal(metricCard.pitchVisuals.pitchWidthM,68);
assert.equal(metricCard.pitchVisuals.trajectory.runs.length,2,'participation windows remain separate');
assert.equal(metricCard.pitchVisuals.trajectory.runs[0][0].x,10);
assert.equal(metricCard.pitchVisuals.trajectory.runs[1][0].x,40);
assert.deepEqual(metricCard.pitchVisuals.heatmap.cells,[[1,0],[0,2]],'heatmaps aggregate only confirmed participation windows');
assert.deepEqual(metricCard.pitchVisuals.heatmap.normalizedCells,[[.5,0],[0,1]]);
assert.equal(metricCard.pitchVisuals.heatmap.heatmapBasis,'TIME_WEIGHTED_CONFIRMED_PARTICIPATION');

const partial=VM.buildCard({...report.players[0],metric:{metricCoverage:.5,distanceM:10,avgSpeedKmh:4,maxSpeedKmh:8,sprintCount:0,quality:'PARTIEL',rosterBound:true},rosterMetric:{...rosterMetric,spatial:{...rosterMetric.spatial,status:'PARTIEL'}}});
assert.equal(partial.pitchVisuals.status,'DISPONIBLE','partial but defensible roster spatial evidence remains publishable');
assert.equal(partial.pitchVisuals.quality,'PARTIEL');

const zeroValue=VM.metricValue({metricCoverage:.5,sprintCount:0,quality:'PARTIEL',rosterBound:true},'sprintCount','Sprints');
assert.equal(zeroValue.status,'PARTIEL');
assert.equal(zeroValue.value,0,'zero is a valid measured metric and must not be treated as missing');

console.log('player card view model non-regression: PASS');
