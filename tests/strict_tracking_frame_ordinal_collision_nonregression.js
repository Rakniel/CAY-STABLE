'use strict';
const assert=require('assert');
const Bridge=require('../strict_tracking_frame_guard_v1.js');
const context={maxPlayers:11,width:1000,height:600};
const detection={cat:'team',x:.5,y:.5,score:.95,feature:[1,.2,.3],isCAY:true,onField:true,teamEvidenceValid:true};

function inspect(label,steps,expectedReasons){
  const bridge=Bridge.create({maxPlayers:11,lostAfter:8});
  for(const step of steps){
    if(step.invalid)bridge.processUnavailableFrame(step.time,{...context,reason:step.invalid,...(step.cut?{segmentBreak:true,segmentReason:'camera_cut'}:{})});
    else bridge.processFrame([detection],step.time,{...context,...(step.cut?{segmentBreak:true,segmentReason:'camera_cut'}:{})});
  }
  const report=bridge.report({});
  const frames=report.bridge.timeline.filter(event=>event.type==='FRAME');
  assert.strictEqual(frames.length,steps.length,label+' must retain every attempted frame');
  assert.deepStrictEqual(frames.map(frame=>frame.invalidReason||null),expectedReasons,label+' must attribute each rejection to exactly one frame');
  assert.strictEqual(report.bridge.unavailableObservationFrames,expectedReasons.filter(Boolean).length,label+' unavailable count');
  assert.strictEqual(report.bridge.usableObservationFrames,steps.length-expectedReasons.filter(Boolean).length,label+' usable count');
  assert.strictEqual(report.bridge.attemptedObservationFrames,steps.length,label+' attempted count');
  assert.strictEqual(report.bridge.invalidFrameLookup,'INDEXED_FRAME_ORDINAL');
  assert.deepStrictEqual(bridge.snapshot().invalidFrames.map(frame=>frame.frameOrdinal),steps.flatMap((step,index)=>step.invalid?[index]:[]),label+' ordinal provenance');
  assert.deepStrictEqual(bridge.report({}).bridge.timeline.filter(event=>event.type==='FRAME').map(frame=>frame.invalidReason||null),expectedReasons,label+' repeated reports must be stable');
  return report;
}

const unavailable='FIELD_POLYGON_UNAVAILABLE';
let report=inspect('valid then invalid, identical timestamp',[
  {time:0},{time:0,invalid:unavailable}
],[null,unavailable]);
assert.strictEqual(report.bridge.observationCoverage,.5);
assert.strictEqual(report.bridge.observationQuality,'PARTIEL');
inspect('invalid then valid, identical timestamp',[
  {time:0,invalid:unavailable},{time:0}
],[unavailable,null]);
inspect('different failures at identical timestamp',[
  {time:1,invalid:'DETECTOR_INFERENCE_FAILED'},{time:1,invalid:unavailable},{time:1}
],['DETECTOR_INFERENCE_FAILED',unavailable,null]);
inspect('microsecond rounding collision',[
  {time:1},{time:1.0000004,invalid:unavailable}
],[null,unavailable]);
report=inspect('camera cut and duplicate timestamp',[
  {time:2},{time:2,cut:true,invalid:unavailable},{time:2,invalid:'DETECTOR_INFERENCE_FAILED'}
],[null,unavailable,'DETECTOR_INFERENCE_FAILED']);
assert.strictEqual(report.bridge.timeline.filter(event=>event.type==='FRAME')[1].segment,2);

const steps=[];
for(let i=0;i<120;i++){
  steps.push({time:i*.5},{time:i*.5,invalid:unavailable});
}
report=inspect('120 duplicate timestamp pairs',steps,steps.map(step=>step.invalid||null));
assert.strictEqual(report.bridge.attemptedObservationFrames,240);
assert.strictEqual(report.bridge.usableObservationFrames,120);
assert.strictEqual(report.bridge.unavailableObservationFrames,120);
assert.strictEqual(report.bridge.observationCoverage,.5);
console.log('strict tracking frame ordinal collision non-regression: PASS');
