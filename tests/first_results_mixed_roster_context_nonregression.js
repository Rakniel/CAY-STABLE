'use strict';
const assert=require('node:assert/strict');
const Gate=require('../first_results_testability_gate_v1.js');
const ready={tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true};
const linked={id:'CAY-1',roster:{status:'LIÉ',playerId:'P1'},firstResults:ready};
const missing={id:'unknown',firstResults:ready};
const opponent={id:'opponent',roster:{status:'NON_LIÉ'},firstResults:ready};
for(let i=0;i<5;i++){
  const input={players:[linked,missing,opponent]};
  const result=Gate.evaluate(input);
  assert.equal(result.eligibleClubPlayers,1,'a missing roster must not inherit legacy eligibility in a roster-scoped match');
  assert.equal(result.excludedNonClubPlayers,2);
  assert.equal(result.evidence[1].clubEligible,false);
  assert.equal(result.evidence[1].exclusionReason,'ROSTER_ABSENT_EN_CONTEXTE_ROSTER');
  assert.equal(result.evidence[2].exclusionReason,'ROSTER_NON_LIE');
  const aligned=Gate.alignPlayerCards(input,result);
  assert.equal(aligned.summary.players,1);
  assert.equal(aligned.players[1].firstResults.status,'INDISPONIBLE');
  assert.equal(aligned.players[1].firstResults.metricReady,false);
  assert.equal(aligned.players[1].firstResults.distanceAvailable,false);
  assert.equal(Gate.alignPlayerCards(input).players[1].firstResults.clubEligible,false,'fallback must respect roster context');
  assert.equal(Gate.evaluate({players:[missing]}).eligibleClubPlayers,1,'legacy sessions without roster remain compatible');
  assert.equal(Gate.evaluate({players:[linked,opponent]}).eligibleClubPlayers,1);
}
console.log('first-results mixed roster context: PASS (5 repetitions)');
