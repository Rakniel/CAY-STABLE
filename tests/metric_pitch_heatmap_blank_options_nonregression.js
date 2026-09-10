'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

function projector(confidence=1){
  return {validated:true,confidence,project:p=>({x:p.x*105,y:p.y*68})};
}

const weakCalibrationTrack={fullPath:[
  {time:0,segment:1,x:.2,y:.2},
  {time:.5,segment:1,x:.21,y:.2},
  {time:1,segment:1,x:.22,y:.2}
]};

const blankConfidenceThreshold=Heat.build(
  weakCalibrationTrack,
  {1:projector(.2)},
  {minCalibrationConfidence:'   ',maxRawSpeedKmh:1000}
);
assert.equal(blankConfidenceThreshold.status,'INDISPONIBLE');
assert(/confiance calibration insuffisante/.test(blankConfidenceThreshold.reason));

const longGapTrack={fullPath:[
  {time:0,segment:1,x:.2,y:.2},
  {time:5,segment:1,x:.2,y:.2}
]};
const blankGapThreshold=Heat.build(
  longGapTrack,
  {1:projector(1)},
  {maxDwellGapSec:'\t  ',maxRawSpeedKmh:1000}
);
assert.equal(blankGapThreshold.maxDwellGapSec,1);
assert.equal(blankGapThreshold.projectedIntervalSeconds,0);
assert.equal(blankGapThreshold.unobservedGapSeconds,5);
assert.equal(blankGapThreshold.gapBreaks,1);
assert.equal(blankGapThreshold.status,'INDISPONIBLE');

const blankCoverageThreshold=Heat.build(
  weakCalibrationTrack,
  {1:projector(1)},
  {minMetricCoverage:'',maxRawSpeedKmh:1000}
);
assert.equal(blankCoverageThreshold.minMetricCoverage,.35);
assert.equal(blankCoverageThreshold.minTemporalCoverage,.35);
assert.equal(blankCoverageThreshold.status,'DISPONIBLE');

const explicitZerosRemainExplicit=Heat.build(
  longGapTrack,
  {1:projector(.2)},
  {minMetricCoverage:0,minTemporalCoverage:0,minCalibrationConfidence:0,maxDwellGapSec:0,maxRawSpeedKmh:1000}
);
assert.equal(explicitZerosRemainExplicit.minMetricCoverage,0);
assert.equal(explicitZerosRemainExplicit.minTemporalCoverage,0);
assert.equal(explicitZerosRemainExplicit.maxDwellGapSec,0);
assert.equal(explicitZerosRemainExplicit.status,'DISPONIBLE');

console.log('metric_pitch_heatmap_blank_options_nonregression: OK');
