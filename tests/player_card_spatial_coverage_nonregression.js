'use strict';
const assert=require('assert');
const VM=require('../player_card_view_model_v1.js');
const Renderer=require('../player_card_renderer_v1.js');

const basePlayer={
  id:'t7',cat:'CAY',identityQuality:'FIABLE',identityConfidence:.97,
  metric:{metricCoverage:1,distanceM:120,avgSpeedKmh:7,maxSpeedKmh:21,sprintCount:2,quality:'FIABLE',rosterBound:true,publication:{fieldStatus:{distanceM:{status:'FIABLE'},avgSpeedKmh:{status:'FIABLE'},maxSpeedKmh:{status:'FIABLE'},sprintCount:{status:'FIABLE'}}}},
  rosterMetric:{status:'FIABLE',spatial:{
    status:'PARTIEL',participationWindowCount:4,availableWindowCount:3,coherentWindowCount:2,renderedWindowCount:2,excludedGeometryWindowCount:1,
    coverageNote:'deux fenêtres seulement sont rendues sur la géométrie terrain cohérente',
    geometry:{coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:1,cols:2,sourceWindowIndexes:[1,2]},
    trajectory:{status:'PARTIEL',coordinateSystem:'PITCH_METERS',sourceWindowIndexes:[1,2],runs:[
      {windowIndex:1,points:[{x:10,y:20,time:10},{x:11,y:20,time:11}]},
      {windowIndex:2,points:[{x:20,y:30,time:30},{x:21,y:30,time:31}]}
    ]},
    heatmap:{status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:1,cols:2,cells:[[1,2]],normalizedCells:[[.5,1]],windowCount:2,sourceWindowIndexes:[1,2],heatmapBasis:'TIME_WEIGHTED_CONFIRMED_PARTICIPATION'}
  }}
};

const card=VM.buildCard(basePlayer);
assert.strictEqual(card.pitchVisuals.status,'DISPONIBLE');
assert.strictEqual(card.pitchVisuals.spatialCoverage,50,'2 rendered spatial windows out of 4 participation windows must display 50% terrain coverage');
assert.strictEqual(card.pitchVisuals.metricCoverage,50,'legacy renderer-facing field must now mean terrain visual coverage, never physical metric coverage');
assert.strictEqual(card.pitchVisuals.physicalMetricCoverage,100,'physical metric evidence stays separately auditable');
assert.strictEqual(card.metrics.distanceM.coverage,100,'physical metric cards retain their own evidence coverage');
assert.match(card.pitchVisuals.coveragePolicy,/FENETRES_SPATIALES/i);

const html=Renderer.cardHtml(card);
assert.match(html,/TERRAIN • 50 %/,'headline terrain coverage must reflect spatially rendered evidence');
assert.doesNotMatch(html,/TERRAIN • 100 %/,'physical metric coverage must not masquerade as terrain visual coverage');
assert.match(html,/FENÊTRES 2\/4/,'explicit rendered/participation window count remains visible');

assert.strictEqual(VM.spatialCoveragePct({participationWindowCount:3,renderedWindowCount:3}),100);
assert.strictEqual(VM.spatialCoveragePct({participationWindowCount:3,renderedWindowCount:1}),33);
assert.strictEqual(VM.spatialCoveragePct({participationWindowCount:0,renderedWindowCount:0}),0);
assert.strictEqual(VM.spatialCoveragePct({participationWindowCount:2,renderedWindowCount:9}),100,'coverage is clamped and cannot exceed 100%');

console.log('player card spatial coverage non-regression: PASS');
