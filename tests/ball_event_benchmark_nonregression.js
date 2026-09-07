const assert=require('assert');
const {evaluateBallEvents,compareBallEvents}=require('../ball_event_benchmark_v1.js');
const truth=[
 {type:'PASS',time:10.0},{type:'TURNOVER',time:22.0},{type:'PASS',time:35.0}
];
const before=[
 {type:'PASS',time:10.4},{type:'PASS',time:14.0},{type:'TURNOVER',time:23.2}
];
const after=[
 {type:'PASS',time:10.2},{type:'TURNOVER',time:22.3},{type:'PASS',time:35.4}
];
const b=evaluateBallEvents(truth,before,{timeToleranceSec:.75});
assert.strictEqual(b.truePositives,1);
assert.strictEqual(b.falsePositives,2);
assert.strictEqual(b.falseNegatives,2);
const a=evaluateBallEvents(truth,after,{timeToleranceSec:.75});
assert.strictEqual(a.truePositives,3);
assert.strictEqual(a.falsePositives,0);
assert.strictEqual(a.falseNegatives,0);
assert.strictEqual(a.precision,1);
assert.strictEqual(a.recall,1);
assert.strictEqual(a.f1,1);
assert.ok(a.meanTimingErrorSec>0&&a.meanTimingErrorSec<.5);
assert.strictEqual(a.byType.PASS.truePositives,2);
assert.strictEqual(a.byType.TURNOVER.truePositives,1);
const cmp=compareBallEvents(truth,before,after,{timeToleranceSec:.75});
assert.ok(cmp.delta.f1>0);
assert.strictEqual(cmp.delta.falsePositives,-2);
assert.strictEqual(cmp.delta.falseNegatives,-2);
assert.strictEqual(evaluateBallEvents([],after).quality,'INDISPONIBLE');

// When the annotated reference contains attribution, a temporally correct event
// credited to the wrong player/team must not count as a true positive.
const attributedTruth=[
 {type:'PASS',time:50,fromPlayerId:'CAY-8',toPlayerId:'CAY-10',fromTeam:'CAY',toTeam:'CAY'},
 {type:'TURNOVER',time:61,fromPlayerId:'CAY-6',fromTeam:'CAY'}
];
const wrongAttribution=[
 {type:'PASS',time:50.1,fromPlayerId:'CAY-7',toPlayerId:'CAY-10',fromTeam:'CAY',toTeam:'CAY'},
 {type:'TURNOVER',time:61.1,fromPlayerId:'CAY-6',fromTeam:'OPP'}
];
const wrong=evaluateBallEvents(attributedTruth,wrongAttribution,{timeToleranceSec:.75});
assert.strictEqual(wrong.truePositives,0);
assert.strictEqual(wrong.falsePositives,2);
assert.strictEqual(wrong.falseNegatives,2);
assert.strictEqual(wrong.identityEvidence.identityRejectedCandidates,2);
assert.strictEqual(wrong.identityEvidence.rejectedByReason.ACTOR_ID_MISMATCH,1);
assert.strictEqual(wrong.identityEvidence.rejectedByReason.TEAM_ID_MISMATCH,1);

const correctAttribution=[
 {type:'PASS',time:50.1,fromPlayerId:'CAY-8',toPlayerId:'CAY-10',fromTeam:'CAY',toTeam:'CAY'},
 {type:'TURNOVER',time:61.1,fromPlayerId:'CAY-6',fromTeam:'CAY'}
];
const correct=evaluateBallEvents(attributedTruth,correctAttribution,{timeToleranceSec:.75});
assert.strictEqual(correct.truePositives,2);
assert.strictEqual(correct.identityEvidence.identityCheckedMatches,2);

// Receiver attribution is also part of a defended PASS when the reference has it.
const wrongReceiver=evaluateBallEvents(
 [{type:'PASS',time:70,fromPlayerId:'CAY-8',toPlayerId:'CAY-10',fromTeam:'CAY',toTeam:'CAY'}],
 [{type:'PASS',time:70.1,fromPlayerId:'CAY-8',toPlayerId:'CAY-9',fromTeam:'CAY',toTeam:'CAY'}]
);
assert.strictEqual(wrongReceiver.truePositives,0);
assert.strictEqual(wrongReceiver.identityEvidence.rejectedByReason.RECEIVER_ID_MISMATCH,1);

// Explicit compatibility escape hatch remains available for old timing-only studies.
const timingOnly=evaluateBallEvents(attributedTruth,wrongAttribution,{identityMode:'off'});
assert.strictEqual(timingOnly.truePositives,2);
console.log('ball_event_benchmark_nonregression: PASS');
