'use strict';
const assert=require('assert');
const Contract=require('../football_event_contract_v1.js');

const reliable={
  quality:'FIABLE',
  coverage:.82,
  events:[
    {type:'PASS',time:12.4,fromPlayerId:'7',toPlayerId:'9',fromTeam:'CAY',toTeam:'CAY',travelM:11.2,transitionSec:.8,meanBallSpeedMps:14,detachedBallObserved:true,detachedBallObservations:3,detachedBallSpanSec:.12,source:'validated_ball_flight_motion_and_ownership_transition'},
    {type:'TURNOVER',time:18.1,fromPlayerId:'9',toPlayerId:'4',fromTeam:'CAY',toTeam:'ADV',travelM:1.4,transitionSec:.7,transitionBallObservations:4,receiverStableSec:.5,source:'validated_ball_motion_and_ownership_transition'},
    {type:'UNSUPPORTED',time:19}
  ]
};

const artifact=Contract.fromBallAnalysis(reliable,{matchId:'match-1',periodId:1});
assert.strictEqual(artifact.contractVersion,Contract.VERSION);
assert.strictEqual(artifact.quality,'FIABLE');
assert.strictEqual(artifact.actionCount,2);
assert.strictEqual(artifact.unsupportedEvents,1);
assert.strictEqual(artifact.actions[0].actionType,'pass');
assert.strictEqual(artifact.actions[0].result,'complete');
assert.strictEqual(artifact.actions[0].recipientPlayerId,'9');
assert.strictEqual(artifact.actions[0].distanceM,11.2);
assert.strictEqual(artifact.actions[0].start.status,'INDISPONIBLE');
assert.strictEqual(artifact.actions[1].actionType,'turnover');
assert.strictEqual(artifact.actions[1].result,'lost');
assert.strictEqual(artifact.actions[1].recipientTeamId,'ADV');
assert.strictEqual(artifact.reference.license,'MIT');
assert.strictEqual(artifact.reference.version,'1.5.3');

const noContext=Contract.fromBallAnalysis({quality:'FIABLE',coverage:.7,events:[reliable.events[0]]});
assert.strictEqual(noContext.matchId,null,'match id must never be invented');
assert.strictEqual(noContext.periodId,null,'period must never be invented');

const unavailable=Contract.fromBallAnalysis({quality:'INDISPONIBLE',reason:'BALL_COVERAGE_TOO_LOW',events:reliable.events});
assert.strictEqual(unavailable.quality,'INDISPONIBLE');
assert.deepStrictEqual(unavailable.actions,[],'unreliable source events must never be republished as actions');
assert.strictEqual(unavailable.reason,'BALL_COVERAGE_TOO_LOW');

console.log('football_event_contract_nonregression: ok');
