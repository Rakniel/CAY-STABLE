'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const row=(seconds,coverage=80)=>({
  tracking:true,
  pitchVisualCore:false,
  physicalComplete:false,
  coverage:{trackingPct:coverage,participationSeconds:seconds}
});
const invalid=[true,false,[],[42],{},new Number(42),-3,Infinity,NaN,'',null,undefined];
for(const seconds of invalid){
  const summary=Gate.summarizeCoverage([row(100),row(seconds,60)],'trackingPct','tracking');
  assert.strictEqual(summary.eligiblePlayers,2);
  assert.strictEqual(summary.durationKnownPlayers,1,'invalid duration must not count as temporal evidence');
  assert.strictEqual(summary.durationUnknownPlayers,1);
  assert.strictEqual(summary.temporalWeightingComplete,false);
  assert.strictEqual(summary.eligibleParticipationSeconds,100);
  assert.strictEqual(summary.knownParticipationSeconds,100);
  assert.strictEqual(summary.knownParticipationSharePct,null,'incomplete time evidence must not imply 100%');
  assert.strictEqual(summary.weightedAvgPct,80,'invalid duration must not bias weighted coverage');
}
for(const seconds of [25,'25','0.5']){
  const summary=Gate.summarizeCoverage([row(100),row(seconds,60)],'trackingPct','tracking');
  assert.strictEqual(summary.durationKnownPlayers,2,'positive numeric durations remain valid');
  assert.strictEqual(summary.temporalWeightingComplete,true);
  assert.strictEqual(summary.eligibleParticipationSeconds,100+Number(seconds));
  assert.strictEqual(summary.knownParticipationSharePct,100);
}
const grouped=Gate.coverageSummary([row(100),row(true,60)]);
assert.strictEqual(grouped.tracking.temporalWeightingComplete,false);
assert.strictEqual(grouped.tracking.knownParticipationSharePct,null);
const evidence=Gate.coverageEvidence({
  presence:{trackingCoverage:80},
  pitchVisuals:{participationSeconds:true,renderedSeconds:[12]}
});
assert.strictEqual(evidence.participationSeconds,null);
assert.strictEqual(evidence.renderedSeconds,null);
const testability=Gate.evaluate({players:[{
  id:'CAY-11',firstResults:{tracking:true,trajectory:false,heatmap:false},
  presence:{trackingCoverage:80},pitchVisuals:{participationSeconds:true}
}]});
assert.strictEqual(testability.status,'TRACKING_TESTABLE');
assert.strictEqual(testability.coverageSummary.tracking.durationKnownPlayers,0);
assert.strictEqual(testability.coverageSummary.tracking.knownParticipationSharePct,null);
console.log('OK strict temporal duration evidence non-regression');
