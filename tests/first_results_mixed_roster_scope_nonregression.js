'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

function ready(id,roster,includeRoster=true){
  const card={
    id,
    firstResults:{
      tracking:true,trajectory:true,heatmap:true,
      distance:true,avgSpeed:true,maxSpeed:true,sprints:true,
      distanceAvailable:true,avgSpeedAvailable:true,maxSpeedAvailable:true,sprintsAvailable:true
    },
    presence:{trackingCoverage:90},
    pitchVisuals:{spatialCoverage:80,physicalMetricCoverage:75,participationSeconds:60,renderedSeconds:48}
  };
  if(includeRoster)card.roster=roster;
  return card;
}
const linked=ready('cay-8',{status:'LIÉ',playerId:'P8'});
const explicitUnlinked=ready('opponent',{status:'NON_LIÉ'});
const missingRoster=ready('missing-roster',null,false);
const cards={players:[linked,explicitUnlinked,missingRoster],summary:{players:3}};
const evaluated=Gate.evaluate(cards);
assert.strictEqual(evaluated.eligibleClubPlayers,1,'missing roster must not be a CAY player when another card is roster-scoped');
assert.strictEqual(evaluated.excludedNonClubPlayers,2);
assert.strictEqual(evaluated.metricReadyPlayers,1);
assert.strictEqual(evaluated.coverageSummary.tracking.eligiblePlayers,1);
assert.strictEqual(evaluated.evidence[2].clubEligible,false);
assert.strictEqual(evaluated.evidence[2].rosterScoped,false);
assert.strictEqual(evaluated.evidence[2].exclusionReason,'ROSTER_NON_LIE');
assert.strictEqual(evaluated.evidence[2].diagnosticStatus,'PHYSICAL_TESTABLE','diagnostic evidence must be retained');
const aligned=Gate.alignPlayerCards(cards,evaluated);
assert.strictEqual(aligned.summary.players,1);
assert.strictEqual(aligned.summary.excludedNonClubPlayers,2);
assert.strictEqual(aligned.players[2].firstResults.status,'INDISPONIBLE');
assert.strictEqual(aligned.players[2].firstResults.metricReady,false);
assert.strictEqual(aligned.players[2].firstResults.clubEligible,false);
for(const key of ['tracking','trajectory','heatmap','distance','avgSpeed','maxSpeed','sprints','distanceAvailable','avgSpeedAvailable','maxSpeedAvailable','sprintsAvailable']){
  assert.strictEqual(aligned.players[2].firstResults[key],false,key+' must be blocked');
}
assert.strictEqual(Gate.alignPlayerCards(cards).players[2].firstResults.status,'INDISPONIBLE','fallback alignment must use report-wide roster context');
const legacy=Gate.evaluate({players:[missingRoster]});
assert.strictEqual(legacy.eligibleClubPlayers,1,'fully legacy reports retain compatibility');
assert.strictEqual(legacy.status,'PHYSICAL_TESTABLE');
const scoped=Gate.evaluate({players:[linked,explicitUnlinked]});
assert.strictEqual(scoped.eligibleClubPlayers,1,'fully roster-scoped behavior remains unchanged');
for(let i=0;i<1000;i++){
  const rows=Array.from({length:1+i%17},(_,j)=>{
    const card=ready('t'+j,j%4===0?{status:'LIÉ',playerId:'P'+j}:{status:'NON_LIÉ'},j%3!==0);
    if(j%7===0)card.firstResults.heatmap=false;
    return card;
  });
  const result=Gate.evaluate({players:rows});
  const hasRoster=rows.some(card=>Object.prototype.hasOwnProperty.call(card,'roster'));
  const expected=rows.filter(card=>!hasRoster||card.roster?.status==='LIÉ').length;
  assert.strictEqual(result.eligibleClubPlayers,expected,'mixed roster fixture '+i);
  assert.strictEqual(result.eligibleClubPlayers+result.excludedNonClubPlayers,rows.length);
}
console.log('mixed roster first-results fail-closed non-regression: PASS (1000 property cases)');
