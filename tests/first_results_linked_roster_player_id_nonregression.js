'use strict';
const assert=require('node:assert/strict');
const Gate=require('../first_results_testability_gate_v1.js');
const ready={tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true};
const card=(id,roster)=>({id,roster,firstResults:{...ready}});
const invalidIds=[undefined,null,'','   ',[],{},0,false];
for(let repetition=0;repetition<5;repetition++){
  for(const playerId of invalidIds){
    const candidate=card('track-unknown',{status:'LIÉ',playerId});
    const result=Gate.evaluate({players:[candidate]});
    assert.equal(result.status,'INDISPONIBLE');
    assert.equal(result.eligibleClubPlayers,0);
    assert.equal(result.excludedNonClubPlayers,1);
    assert.equal(result.withTracking,0);
    assert.equal(result.metricReadyPlayers,0);
    assert.equal(result.evidence[0].exclusionReason,'ROSTER_PLAYER_ID_MISSING');
    const aligned=Gate.alignPlayerCards({players:[candidate]},result);
    assert.equal(aligned.summary.players,0);
    assert.equal(aligned.players[0].firstResults.clubEligible,false);
    assert.equal(aligned.players[0].firstResults.metricReady,false);
  }
  const linked=card('track-cay',{status:'LIÉ',playerId:'CAY-P8'});
  const rejected=card('track-unknown',{status:'LIÉ',playerId:'  '});
  const result=Gate.evaluate({players:[linked,rejected]});
  assert.equal(result.eligibleClubPlayers,1);
  assert.equal(result.status,'PHYSICAL_TESTABLE');
  assert.equal(result.evidence[0].clubEligible,true);
  assert.equal(result.evidence[1].clubEligible,false);
  assert.equal(Gate.alignPlayerCards({players:[linked,rejected]},result).summary.players,1);
  assert.equal(Gate.rosterEligibility({roster:{status:'NON_LIÉ',playerId:'P1'}},true).reason,'ROSTER_NON_LIE');
  assert.equal(Gate.evaluate({players:[{id:'legacy',firstResults:ready}]}).status,'PHYSICAL_TESTABLE');
}
console.log('first results linked roster player ID: PASS (5 repetitions)');
