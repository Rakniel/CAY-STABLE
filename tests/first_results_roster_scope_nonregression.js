'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const ready=(id,roster)=>({
  id,
  roster,
  firstResults:{
    tracking:true,trajectory:true,heatmap:true,
    distance:true,avgSpeed:true,maxSpeed:true,sprints:true,
    physicalMetrics:true,physicalMetricsComplete:true
  },
  presence:{trackingCoverage:90},
  pitchVisuals:{spatialCoverage:80,physicalMetricCoverage:70,participationSeconds:60,renderedSeconds:48}
});

const linked=ready('CAY-8',{status:'LIÉ',playerId:'P8',displayName:'Joueur CAY'});
const unlinked=ready('track-opponent',{status:'NON_LIÉ',playerId:null});

let result=Gate.evaluate({players:[linked,unlinked]});
assert.strictEqual(result.players,2,'all detected cards remain auditable');
assert.strictEqual(result.eligibleClubPlayers,1,'only an explicitly linked roster card is eligible once roster context exists');
assert.strictEqual(result.excludedNonClubPlayers,1);
assert.strictEqual(result.status,'PHYSICAL_TESTABLE','the linked CAY player may still unlock the testability stage');
assert.strictEqual(result.metricReadyPlayers,1,'the unlinked track must never inflate CAY readiness');
assert.deepStrictEqual(result.blockers,{tracking:0,trajectory:0,heatmap:0,distance:0,avgSpeed:0,maxSpeed:0,sprints:0},'unlinked tracks must not become CAY blockers');
assert.strictEqual(result.coverageSummary.tracking.eligiblePlayers,1,'unlinked tracks must not enter CAY coverage denominators');
assert.strictEqual(result.evidence[0].clubEligible,true);
assert.strictEqual(result.evidence[1].clubEligible,false);
assert.strictEqual(result.evidence[1].status,'INDISPONIBLE');
assert.strictEqual(result.evidence[1].diagnosticStatus,'PHYSICAL_TESTABLE','raw diagnostic evidence remains visible without becoming a CAY result');
assert.strictEqual(result.evidence[1].nextAction,'LIER_PISTE_AU_ROSTER_CAY');

const aligned=Gate.alignPlayerCards({players:[linked,unlinked],summary:{players:2}},result);
assert.strictEqual(aligned.summary.players,1,'club-facing denominator must contain only roster-linked CAY players');
assert.strictEqual(aligned.summary.detectedPlayerCards,2,'diagnostic card count remains explicit');
assert.strictEqual(aligned.summary.excludedNonClubPlayers,1);
assert.strictEqual(aligned.summary.withTracking,1);
assert.strictEqual(aligned.summary.withPitchTrajectory,1);
assert.strictEqual(aligned.summary.withPitchHeatmap,1);
assert.strictEqual(aligned.summary.withCompletePhysicalMetrics,1);
assert.strictEqual(aligned.players[1].firstResults.status,'INDISPONIBLE','an unlinked track must not render as a ready CAY player');
assert.strictEqual(aligned.players[1].firstResults.tracking,false);
assert.strictEqual(aligned.players[1].firstResults.metricReady,false);
assert.strictEqual(aligned.players[1].firstResults.clubEligible,false);
assert.strictEqual(aligned.players[1].firstResults.exclusionReason,'ROSTER_NON_LIE');
assert.strictEqual(aligned.players[1].firstResults.nextAction,'LIER_PISTE_AU_ROSTER_CAY');

result=Gate.evaluate({players:[unlinked]});
assert.strictEqual(result.status,'INDISPONIBLE','an unlinked track alone must never unlock first CAY results');
assert.strictEqual(result.eligibleClubPlayers,0);
assert.strictEqual(result.withTracking,0);
assert.strictEqual(result.metricReadyPlayers,0);
assert.strictEqual(result.coverageSummary.tracking.eligiblePlayers,0);

const legacy={...ready('legacy',undefined)};
delete legacy.roster;
result=Gate.evaluate({players:[legacy]});
assert.strictEqual(result.status,'PHYSICAL_TESTABLE','legacy/no-roster workflows remain backward compatible');
assert.strictEqual(result.eligibleClubPlayers,1);
assert.strictEqual(result.excludedNonClubPlayers,0);
assert.strictEqual(result.evidence[0].rosterScoped,false);

console.log('first results roster scope non-regression: PASS');
