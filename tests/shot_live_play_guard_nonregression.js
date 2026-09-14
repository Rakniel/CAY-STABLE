const assert=require('assert');
const ShotTemporalEvidence=require('../shot_temporal_evidence_v1.js');
const BallEventEvidence=require('../ball_event_evidence_bridge_v1.js');

function row(time,x,extra={}){
  return {
    time,
    segment:'A',
    kickEvidenceScore:.9,
    ball:{pitchX:x,pitchY:20,confidence:.95,visible:true,valid:true},
    ...extra
  };
}

const options={minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2};
const live=[row(0,0),row(.1,.8),row(.2,2.4),row(.3,4.8)];
const liveResult=BallEventEvidence.analyzeShots(live,options);
assert.strictEqual(liveResult.candidateCount,1,'the known live temporal shot fixture must remain detectable');
assert.strictEqual(liveResult.candidates[0].publishable,false,'shot candidates are diagnostic only');
assert.strictEqual(liveResult.publicationPolicy,'NEVER_AUTO_PUBLISH');
assert.strictEqual(liveResult.nonLiveExcludedFrames,0);

const replay=live.map(sample=>({...sample,isReplay:true,ball:{...sample.ball}}));
const rawReplayResult=ShotTemporalEvidence.analyze(replay,options);
assert.strictEqual(rawReplayResult.candidateCount,1,'before the live-play guard, replay motion is sufficient to create the same raw diagnostic candidate');
const guardedReplayResult=BallEventEvidence.analyzeShots(replay,options);
assert.strictEqual(guardedReplayResult.candidateCount,0,'explicit replay footage must never create a shot candidate in the canonical evidence bridge');
assert.strictEqual(guardedReplayResult.nonLiveExcludedFrames,4);
assert.strictEqual(guardedReplayResult.nonLiveRuns,1);
assert.strictEqual(guardedReplayResult.publicationPolicy,'NEVER_AUTO_PUBLISH');

const crossedReplayBoundary=[
  row(0,0),
  row(.1,.8),
  row(.2,2.4,{frameClass:'REPLAY'}),
  row(.3,4.8)
];
const crossedResult=BallEventEvidence.analyzeShots(crossedReplayBoundary,options);
assert.strictEqual(crossedResult.candidateCount,0,'shot evidence must not bridge across an explicit non-live frame');
assert.strictEqual(crossedResult.nonLiveExcludedFrames,1);

console.log('shot_live_play_guard_nonregression: ok');
