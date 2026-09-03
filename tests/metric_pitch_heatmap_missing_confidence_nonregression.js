'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

const track={fullPath:[
  {time:0,segment:1,x:.2,y:.2},
  {time:.5,segment:1,x:.3,y:.3}
]};
const project=p=>({x:p.x*105,y:p.y*68});

for(const confidence of [undefined,null,'','   ','not-a-number']){
  const projector={validated:true,project};
  if(confidence!==undefined)projector.confidence=confidence;
  const info=Heat.projectorInfo(projector);
  assert.equal(info.validated,true);
  assert.equal(info.confidence,null,'missing/blank/invalid confidence must stay unavailable, never become perfect confidence');
  const result=Heat.build(track,{1:projector},{minMetricCoverage:.5,minCalibrationConfidence:.5});
  assert.equal(result.status,'INDISPONIBLE');
  assert.equal(result.avgCalibrationConfidence,null);
  assert.equal(result.defendableScore,null);
  assert.equal(result.calibrationConfidenceCoverage,0);
  assert(/confiance calibration indisponible/.test(result.reason));
  assert.equal(result.projectedPoints.length,0,'unpublishable heatmap must not expose pitch points as publishable evidence');
  assert.equal(result.trajectory.avgCalibrationConfidence,null);
  assert.equal(result.trajectory.quality,'INDISPONIBLE');
}

const explicitZero=Heat.build(track,{1:{validated:true,confidence:0,project}},{minMetricCoverage:.5,minCalibrationConfidence:.5});
assert.equal(explicitZero.status,'INDISPONIBLE');
assert.equal(explicitZero.avgCalibrationConfidence,0);
assert.equal(explicitZero.calibrationConfidenceCoverage,1);
assert(/confiance calibration insuffisante/.test(explicitZero.reason));

const explicitStringZero=Heat.projectorInfo({validated:true,confidence:'0',project});
assert.equal(explicitStringZero.confidence,0);

const explicitGood=Heat.build(track,{1:{validated:true,confidence:.8,project}},{minMetricCoverage:.5,minCalibrationConfidence:.5});
assert.equal(explicitGood.status,'DISPONIBLE');
assert.equal(explicitGood.avgCalibrationConfidence,.8);
assert.equal(explicitGood.calibrationConfidenceCoverage,1);
assert.equal(explicitGood.defendableScore,.8);

console.log('metric_pitch_heatmap_missing_confidence_nonregression: OK');
