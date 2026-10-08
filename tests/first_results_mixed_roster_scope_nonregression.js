'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');
const card=(id,roster,hasRoster=true)=>({
  id,
  ...(hasRoster?{roster}:{}),
  firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true},
  presence:{trackingCoverage:100},
  pitchVisuals:{spatialCoverage:100,physicalMetricCoverage:100,participationSeconds:20}
});
const linked=card('CAY-8',{status:'LIÉ',playerId:'P8'});
const missing=card('unknown',undefined,false);
const unlinked=card('opponent',{status:'NON_LIÉ'});
for(const [cards,eligible,excluded] of [
  [[linked,missing],1,1],
  [[unlinked,missing],0,2],
  [[linked,unlinked,missing],1,2],
  [[missing],1,0]
]){
  const result=Gate.evaluate({players:cards});
  assert.strictEqual(result.eligibleClubPlayers,eligible);
  assert.strictEqual(result.excludedNonClubPlayers,excluded);
  assert.strictEqual(result.metricReadyPlayers,eligible);
  assert.strictEqual(result.coverageSummary.tracking.eligiblePlayers,eligible);
  const aligned=Gate.alignPlayerCards({players:cards,summary:{players:cards.length}},result);
  assert.strictEqual(aligned.summary.players,eligible);
  assert.strictEqual(aligned.summary.excludedNonClubPlayers,excluded);
  assert.strictEqual(aligned.players.filter(p=>p.firstResults.clubEligible).length,eligible);
}
const mixed=Gate.evaluate({players:[linked,missing]});
assert.strictEqual(mixed.evidence[1].rosterScoped,true);
assert.strictEqual(mixed.evidence[1].exclusionReason,'ROSTER_NON_LIE');
assert.strictEqual(mixed.evidence[1].status,'INDISPONIBLE');
assert.strictEqual(mixed.evidence[1].diagnosticStatus,'PHYSICAL_TESTABLE');
assert.strictEqual(Gate.cardEvidence(missing).clubEligible,true,'standalone legacy card keeps legacy behavior');
assert.strictEqual(Gate.cardEvidence(missing,true).clubEligible,false,'roster context excludes unbound cards');
const fallback=Gate.alignPlayerCards({players:[linked,missing]});
assert.strictEqual(fallback.summary.players,1,'fallback alignment must apply the same roster context');
assert.strictEqual(fallback.players[1].firstResults.clubEligible,false);
console.log('mixed roster scope non-regression: PASS');
