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
  assert.equal(info.confidence,1,'missing/blank/invalid confidence must use the legacy neutral default, not coerce to zero');
  const result=Heat.build(track,{1:projector},{minMetricCoverage:.5,minCalibrationConfidence:.5});
  assert.equal(result.status,'DISPONIBLE');
  assert.equal(result.avgCalibrationConfidence,1);
}

const explicitZero=Heat.build(track,{1:{validated:true,confidence:0,project}},{minMetricCoverage:.5,minCalibrationConfidence:.5});
assert.equal(explicitZero.status,'INDISPONIBLE');
assert.equal(explicitZero.avgCalibrationConfidence,0);
assert(/confiance calibration insuffisante/.test(explicitZero.reason));

const explicitStringZero=Heat.projectorInfo({validated:true,confidence:'0',project});
assert.equal(explicitStringZero.confidence,0);

console.log('metric_pitch_heatmap_missing_confidence_nonregression: OK');
