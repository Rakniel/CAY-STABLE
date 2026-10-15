'use strict';
const assert=require('node:assert/strict');
const Gate=require('../first_results_testability_gate_v1.js');
const ready={tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true};
const card=(id,playerId,status='LIÉ')=>({id,roster:{status,playerId},firstResults:{...ready}});
for(let i=0;i<5;i++){
  const duplicate={players:[card('t1','P1'),card('t2',' P1 ')]};
  const result=Gate.evaluate(duplicate);
  assert.equal(result.eligibleClubPlayers,0);
  assert.equal(result.excludedNonClubPlayers,2);
  assert.equal(result.status,'INDISPONIBLE');
  assert.equal(result.nextAction,'RESOUDRE_CONFLIT_IDENTITE_ROSTER');
  assert.deepEqual(result.evidence.map(e=>e.exclusionReason),['ROSTER_PLAYER_ID_CONFLICT','ROSTER_PLAYER_ID_CONFLICT']);
  const aligned=Gate.alignPlayerCards(duplicate,result);
  assert.equal(aligned.summary.players,0);
  assert.equal(aligned.summary.status,'INDISPONIBLE');
  for(const row of aligned.players){
    assert.equal(row.firstResults.clubEligible,false);
    assert.equal(row.firstResults.distanceAvailable,false);
    assert.equal(row.firstResults.nextAction,'RESOUDRE_CONFLIT_IDENTITE_ROSTER');
  }
  assert.equal(Gate.evaluate({players:[...duplicate.players,card('t3','P2')]}).eligibleClubPlayers,1);
  assert.equal(Gate.evaluate({players:[card('t1','P1'),card('t2','P2')]}).eligibleClubPlayers,2);
  assert.equal(Gate.evaluate({players:[card('t1','P1'),card('t2','P1','NON_LIÉ')]}).eligibleClubPlayers,1);
  assert.equal(Gate.evaluate({players:[{id:'legacy',firstResults:ready}]}).eligibleClubPlayers,1);
  const forged=Gate.alignPlayerCards(duplicate,{status:'PHYSICAL_TESTABLE',evidence:[{clubEligible:true},{clubEligible:true}]});
  assert.equal(forged.summary.players,0);
  assert.equal(forged.summary.status,'INDISPONIBLE');
}
console.log('first-results duplicate roster identity guard: PASS');
