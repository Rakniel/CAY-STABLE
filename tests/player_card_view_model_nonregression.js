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

const rosterMetric={status:'FIABLE',spatial:{
  status:'FIABLE',participationWindowCount:2,availableWindowCount:2,coherentWindowCount:2,renderedWindowCount:2,excludedGeometryWindowCount:0,coverageNote:null,
  geometry:{coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,sourceWindowIndexes:[0,1]},
  trajectory:{status:'FIABLE',coordinateSystem:'PITCH_METERS',sourceWindowIndexes:[0,1],runs:[
    {windowIndex:0,startMs:0,endMs:30000,points:[{x:10,y:20,time:29}]},
    {windowIndex:1,startMs:40000,endMs:50000,points:[{x:40,y:30,time:40}]}
  ],policy:'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION_ET_AUCUN_MELANGE_DE_GEOMETRIES_TERRAIN'},
  heatmap:{status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[1,0],[0,2]],normalizedCells:[[.5,0],[0,1]],windowCount:2,sourceWindowIndexes:[0,1],heatmapBasis:'TIME_WEIGHTED_CONFIRMED_PARTICIPATION'},
  heatmaps:[
    {windowIndex:0,pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[1,0],[0,0]],timeCells:[[1,0],[0,0]]},
    {windowIndex:1,pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[0,0],[0,1]],timeCells:[[0,0],[0,2]]}
  ]
}};
const metricCard=VM.buildCard({...report.players[0],metricVisuals:{status:'DISPONIBLE',pitchLengthM:999,pitchWidthM:999,metricCoverage:1,trajectory:{status:'DISPONIBLE',runs:[[{x:999,y:999}]]},pitchHeatmap:{status:'DISPONIBLE',cells:[[99]]}},metric:{metricCoverage:.8,distanceM:1234.5,avgSpeedKmh:7.2,maxSpeedKmh:28.1,sprintCount:2,quality:'FIABLE',rosterBound:true,source:'ROSTER_METRIC_PIPELINE_V1'},rosterMetric});
assert.equal(metricCard.metrics.distanceM.status,'FIABLE');
assert.equal(metricCard.metrics.distanceM.value,1234.5);
assert.equal(metricCard.metrics.sprintCount.value,2);
assert.equal(metricCard.pitchVisuals.status,'DISPONIBLE');
assert.equal(metricCard.pitchVisuals.source,'ROSTER_METRIC_PIPELINE_V1');
assert.equal(metricCard.pitchVisuals.coordinateSystem,'PITCH_METERS');
assert.equal(metricCard.pitchVisuals.metricCoverage,100,'terrain visual coverage follows rendered participation windows, not physical metric coverage');
assert.equal(metricCard.pitchVisuals.spatialCoverage,100);
assert.equal(metricCard.pitchVisuals.physicalMetricCoverage,80,'physical metric coverage remains separately auditable');
assert.equal(metricCard.pitchVisuals.pitchLengthM,105,'pitch geometry comes from the centralized roster spatial contract');
assert.equal(metricCard.pitchVisuals.pitchWidthM,68);
assert.equal(metricCard.pitchVisuals.quality,'FIABLE');
assert.equal(metricCard.pitchVisuals.renderedWindowCount,2);
assert.equal(metricCard.pitchVisuals.excludedGeometryWindowCount,0);
assert.equal(metricCard.pitchVisuals.trajectory.runs.length,2,'participation windows remain separate');
assert.equal(metricCard.pitchVisuals.trajectory.runs[0][0].x,10);
assert.equal(metricCard.pitchVisuals.trajectory.runs[1][0].x,40);
assert.deepEqual(metricCard.pitchVisuals.heatmap.cells,[[1,0],[0,2]],'player card consumes the already validated centralized heatmap');
assert.deepEqual(metricCard.pitchVisuals.heatmap.normalizedCells,[[.5,0],[0,1]]);
assert.deepEqual(metricCard.pitchVisuals.heatmap.sourceWindowIndexes,[0,1]);
assert.equal(metricCard.pitchVisuals.heatmap.heatmapBasis,'TIME_WEIGHTED_CONFIRMED_PARTICIPATION');

const partial=VM.buildCard({...report.players[0],metric:{metricCoverage:.5,distanceM:10,avgSpeedKmh:4,maxSpeedKmh:8,sprintCount:0,quality:'PARTIEL',rosterBound:true},rosterMetric:{...rosterMetric,spatial:{...rosterMetric.spatial,status:'PARTIEL',coverageNote:'couverture spatiale partielle'}}});
assert.equal(partial.pitchVisuals.status,'DISPONIBLE','partial but defensible roster spatial evidence remains publishable');
assert.equal(partial.pitchVisuals.quality,'PARTIEL');
assert.equal(partial.pitchVisuals.coverageNote,'couverture spatiale partielle');

const centralizedMixedMetric={status:'FIABLE',spatial:{
  status:'PARTIEL',participationWindowCount:3,availableWindowCount:3,coherentWindowCount:2,renderedWindowCount:2,excludedGeometryWindowCount:1,
  coverageNote:'certaines fenêtres terrain ont été exclues car leur géométrie est incompatible avec le référentiel dominant',
  geometry:{coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,sourceWindowIndexes:[1,2]},
  trajectory:{status:'PARTIEL',coordinateSystem:'PITCH_METERS',sourceWindowIndexes:[1,2],runs:[
    {windowIndex:1,startMs:20000,endMs:30000,points:[{x:11,y:21,time:25}]},
    {windowIndex:2,startMs:40000,endMs:50000,points:[{x:41,y:31,time:45}]}
  ]},
  heatmap:{status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[1,0],[0,2]],normalizedCells:[[.5,0],[0,1]],windowCount:2,sourceWindowIndexes:[1,2],heatmapBasis:'TIME_WEIGHTED_CONFIRMED_PARTICIPATION'},
  // Poisoned diagnostic windows are intentionally retained. UI must never re-evaluate them.
  heatmaps:[
    {windowIndex:0,pitchLengthM:100,pitchWidthM:64,rows:2,cols:2,cells:[[999,0],[0,0]],timeCells:[[999,0],[0,0]]},
    {windowIndex:1,pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[7,0],[0,0]],timeCells:[[7,0],[0,0]]},
    {windowIndex:2,pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,cells:[[0,0],[0,8]],timeCells:[[0,0],[0,8]]}
  ]
}};
const mixed=VM.buildCard({...report.players[0],metric:{metricCoverage:.8,distanceM:100,avgSpeedKmh:8,maxSpeedKmh:20,sprintCount:1,quality:'FIABLE',rosterBound:true},rosterMetric:centralizedMixedMetric});
assert.equal(mixed.pitchVisuals.status,'DISPONIBLE','centralized partial spatial evidence remains usable');
assert.equal(mixed.pitchVisuals.quality,'PARTIEL');
assert.equal(mixed.pitchVisuals.metricCoverage,67,'2 of 3 rendered windows must expose 67% terrain visual coverage');
assert.equal(mixed.pitchVisuals.spatialCoverage,67);
assert.equal(mixed.pitchVisuals.physicalMetricCoverage,80);
assert.equal(mixed.pitchVisuals.pitchLengthM,105);
assert.equal(mixed.pitchVisuals.pitchWidthM,68);
assert.equal(mixed.pitchVisuals.renderedWindowCount,2);
assert.equal(mixed.pitchVisuals.excludedGeometryWindowCount,1);
assert.deepEqual(mixed.pitchVisuals.heatmap.sourceWindowIndexes,[1,2]);
assert.deepEqual(mixed.pitchVisuals.heatmap.cells,[[1,0],[0,2]],'player card must not recompute from poisoned diagnostic heatmap windows');
assert.equal(mixed.pitchVisuals.trajectory.runs.length,2);
assert.equal(mixed.pitchVisuals.trajectory.runs[0][0].x,11);
assert.equal(mixed.pitchVisuals.trajectory.runs[1][0].x,41);
assert(!mixed.pitchVisuals.trajectory.runs.flat().some(p=>p.x===90),'card must consume the already filtered centralized trajectory');
assert.match(mixed.pitchVisuals.coverageNote,/géométrie est incompatible/i);
assert.match(mixed.pitchVisuals.policy,/CONTRAT_SPATIAL_CENTRALISE/);

const missingCentralHeatmap=VM.buildCard({...report.players[0],metric:{metricCoverage:.8,distanceM:100,avgSpeedKmh:8,maxSpeedKmh:20,sprintCount:1,quality:'FIABLE',rosterBound:true},rosterMetric:{status:'FIABLE',spatial:{status:'PARTIEL',participationWindowCount:1,availableWindowCount:1,renderedWindowCount:0,excludedGeometryWindowCount:0,heatmap:null,trajectory:{runs:[]},heatmaps:[{windowIndex:0,pitchLengthM:105,pitchWidthM:68,rows:1,cols:1,cells:[[999]],timeCells:[[999]]}]}}});
assert.equal(missingCentralHeatmap.pitchVisuals.status,'INDISPONIBLE','diagnostic heatmap windows cannot bypass a missing centralized spatial publication');

const zeroValue=VM.metricValue({metricCoverage:.5,sprintCount:0,quality:'PARTIEL',rosterBound:true},'sprintCount','Sprints');
assert.equal(zeroValue.status,'PARTIEL');
assert.equal(zeroValue.value,0,'zero is a valid measured metric and must not be treated as missing');

console.log('player card view model non-regression: PASS');
