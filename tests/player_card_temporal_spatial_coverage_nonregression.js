'use strict';
const assert=require('assert');
const VM=require('../player_card_view_model_v1.js');

function spatial(overrides={}){
  return {
    status:'PARTIEL',participationWindowCount:2,availableWindowCount:1,coherentWindowCount:1,renderedWindowCount:1,excludedGeometryWindowCount:0,
    geometry:{coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:1,cols:1,sourceWindowIndexes:[0]},
    trajectory:{status:'PARTIEL',coordinateSystem:'PITCH_METERS',sourceWindowIndexes:[0],runs:[{windowIndex:0,points:[{x:10,y:20,time:1},{x:11,y:20,time:2}]}]},
    heatmap:{status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:1,cols:1,cells:[[1]],normalizedCells:[[1]],windowCount:1,sourceWindowIndexes:[0],heatmapBasis:'TIME_WEIGHTED_CONFIRMED_PARTICIPATION'},
    ...overrides
  };
}

const base={id:'p7',cat:'CAY',identityQuality:'FIABLE',identityConfidence:.98,metric:null};

const unequalWindows={
  ...base,
  rosterMetric:{status:'PARTIEL',spatial:spatial(),windows:[
    {index:0,startMs:0,endMs:9000,spatial:{status:'DISPONIBLE',temporalCoverage:1,trajectory:{status:'DISPONIBLE'}}},
    {index:1,startMs:9000,endMs:10000,spatial:{status:'INDISPONIBLE'}}
  ]}
};
const card=VM.buildCard(unequalWindows);
assert.strictEqual(card.pitchVisuals.spatialCoverage,90,'9 defendable seconds out of 10 participation seconds must display 90%, not 1/2 windows = 50%');
assert.strictEqual(card.pitchVisuals.metricCoverage,90,'renderer-facing terrain coverage must follow temporal evidence');
assert.strictEqual(card.pitchVisuals.spatialCoverageBasis,'TEMPORAL_SECONDS');
assert.strictEqual(card.pitchVisuals.participationSeconds,10);
assert.strictEqual(card.pitchVisuals.renderedSeconds,9);

const partialWindow={
  ...base,
  rosterMetric:{status:'PARTIEL',spatial:spatial(),windows:[
    {index:0,startMs:0,endMs:8000,spatial:{status:'DISPONIBLE',temporalCoverage:.5,trajectory:{status:'DISPONIBLE'}}},
    {index:1,startMs:8000,endMs:10000,spatial:{status:'INDISPONIBLE'}}
  ]}
};
const partialCard=VM.buildCard(partialWindow);
assert.strictEqual(partialCard.pitchVisuals.spatialCoverage,40,'50% evidence on an 8s coherent window means 4 defendable seconds out of 10');
assert.strictEqual(partialCard.pitchVisuals.renderedSeconds,4);

const legacy=VM.spatialCoverageEvidence({participationWindowCount:2,renderedWindowCount:1,geometry:{sourceWindowIndexes:[0]}},[
  {index:0,startMs:null,endMs:null},{index:1,startMs:null,endMs:null}
]);
assert.strictEqual(legacy.pct,50,'missing temporal bounds keep the explicit legacy window-equivalent fallback');
assert.strictEqual(legacy.basis,'WINDOW_EQUIVALENT');
assert.strictEqual(legacy.participationSeconds,null);
assert.strictEqual(legacy.renderedSeconds,null);

const partialMissingBound=VM.spatialCoverageEvidence({participationWindowCount:2,renderedWindowCount:1,geometry:{sourceWindowIndexes:[0]}},[
  {index:0,startMs:null,endMs:9000,spatial:{status:'DISPONIBLE',temporalCoverage:1,trajectory:{status:'DISPONIBLE'}}},
  {index:1,startMs:9000,endMs:10000,spatial:{status:'INDISPONIBLE'}}
]);
assert.strictEqual(partialMissingBound.pct,50,'one missing temporal bound must never be coerced to zero and must force the explicit window-equivalent fallback');
assert.strictEqual(partialMissingBound.basis,'WINDOW_EQUIVALENT');
assert.strictEqual(partialMissingBound.participationSeconds,null);
assert.strictEqual(partialMissingBound.renderedSeconds,null);

const emptyMissingBound=VM.spatialCoverageEvidence({participationWindowCount:2,renderedWindowCount:1,geometry:{sourceWindowIndexes:[0]}},[
  {index:0,startMs:'',endMs:9000,spatial:{status:'DISPONIBLE',temporalCoverage:1,trajectory:{status:'DISPONIBLE'}}},
  {index:1,startMs:9000,endMs:10000,spatial:{status:'INDISPONIBLE'}}
]);
assert.strictEqual(emptyMissingBound.basis,'WINDOW_EQUIVALENT','empty temporal bounds must be treated as missing evidence, not numeric zero');

console.log('player card temporal spatial coverage non-regression: PASS');