const assert=require('assert');
const {analyze}=require('../shot_temporal_evidence_v1.js');

function row(time,x,kickEvidenceScore=0.9,segment='A'){
  return {time,segment,kickEvidenceScore,ball:{pitchX:x,pitchY:20,confidence:.95,visible:true,valid:true}};
}

const positive=analyze([
  row(0.00,0),
  row(0.10,0.8),
  row(0.20,2.4),
  row(0.30,4.8)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(positive.candidateCount,1);
assert.strictEqual(positive.candidates[0].type,'SHOT_CANDIDATE');
assert.strictEqual(positive.candidates[0].publishable,false);
assert.strictEqual(positive.publicationPolicy,'NEVER_AUTO_PUBLISH');

const singleFrame=analyze([
  row(0.00,0),row(0.10,0.2),row(0.20,2.0),row(0.30,2.2)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(singleFrame.candidateCount,0,'one strong frame must never define a shot');

const weakKick=analyze([
  row(0.00,0,.2),row(0.10,.8,.2),row(0.20,2.4,.2),row(0.30,4.8,.2)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(weakKick.candidateCount,0,'ball motion alone must not define a shot');

const planBreak=analyze([
  row(0.00,0,.9,'A'),row(0.10,.8,.9,'A'),row(0.20,2.4,.9,'B'),row(0.30,4.8,.9,'B')
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(planBreak.candidateCount,0,'evidence must not cross plan/segment boundaries');

const lowBallConfidence=[row(0,0),row(.1,.8),row(.2,2.4),row(.3,4.8)];
lowBallConfidence[2].ball.confidence=.3;
assert.strictEqual(analyze(lowBallConfidence,{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2}).candidateCount,0);

console.log('shot_temporal_evidence_nonregression: ok');
