'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

function row({coverage=80,seconds=100,eligible=true}={}){
  return {
    tracking:eligible,
    pitchVisualCore:false,
    physicalComplete:false,
    coverage:{
      trackingPct:coverage,
      pitchSpatialPct:null,
      physicalMetricPct:null,
      participationSeconds:seconds
    }
  };
}

const incomplete=Gate.summarizeCoverage([
  row({coverage:80,seconds:100}),
  row({coverage:60,seconds:null})
],'trackingPct','tracking');

assert.strictEqual(incomplete.eligiblePlayers,2);
assert.strictEqual(incomplete.knownPlayers,2);
assert.strictEqual(incomplete.durationKnownPlayers,1);
assert.strictEqual(incomplete.durationUnknownPlayers,1);
assert.strictEqual(incomplete.durationKnownPlayerSharePct,50);
assert.strictEqual(incomplete.temporalWeightingComplete,false);
assert.strictEqual(incomplete.weightedAvgPct,80);
assert.strictEqual(incomplete.knownParticipationSharePct,null,'une durée éligible inconnue ne doit jamais produire une fausse couverture temporelle de 100 %');

const complete=Gate.summarizeCoverage([
  row({coverage:80,seconds:100}),
  row({coverage:60,seconds:50})
],'trackingPct','tracking');

assert.strictEqual(complete.durationKnownPlayers,2);
assert.strictEqual(complete.durationUnknownPlayers,0);
assert.strictEqual(complete.durationKnownPlayerSharePct,100);
assert.strictEqual(complete.temporalWeightingComplete,true);
assert.strictEqual(complete.eligibleParticipationSeconds,150);
assert.strictEqual(complete.knownParticipationSeconds,150);
assert.strictEqual(complete.knownParticipationSharePct,100);
assert.ok(Math.abs(complete.weightedAvgPct-73.33)<1e-9);

const knownDurationMissingCoverage=Gate.summarizeCoverage([
  row({coverage:80,seconds:100}),
  row({coverage:null,seconds:50})
],'trackingPct','tracking');

assert.strictEqual(knownDurationMissingCoverage.temporalWeightingComplete,true);
assert.strictEqual(knownDurationMissingCoverage.knownPlayers,1);
assert.strictEqual(knownDurationMissingCoverage.unknownPlayers,1);
assert.strictEqual(knownDurationMissingCoverage.knownPlayerSharePct,50);
assert.strictEqual(knownDurationMissingCoverage.eligibleParticipationSeconds,150);
assert.strictEqual(knownDurationMissingCoverage.knownParticipationSeconds,100);
assert.ok(Math.abs(knownDurationMissingCoverage.knownParticipationSharePct-66.67)<1e-9);
assert.strictEqual(knownDurationMissingCoverage.weightedAvgPct,80);

const evaluation=Gate.evaluate({players:[{
  id:'CAY-9',
  firstResults:{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false},
  presence:{trackingCoverage:80},
  pitchVisuals:{participationSeconds:null}
}]});
assert.strictEqual(evaluation.version,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8');
assert.strictEqual(evaluation.status,'TRACKING_TESTABLE','la complétude temporelle reste une preuve d’audit et ne change pas le statut métier');
assert.strictEqual(evaluation.coverageSummary.tracking.temporalWeightingComplete,false);
assert.strictEqual(evaluation.coverageSummary.tracking.knownParticipationSharePct,null);

console.log('OK first-results temporal duration completeness non-regression');