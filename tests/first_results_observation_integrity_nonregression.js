'use strict';
const assert=require('assert');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');
const base={attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'};
const good=[
  [base,'FIABLE'],
  [{...base,usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL'},'PARTIEL'],
  [{...base,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE'],
  [{...base,attemptedObservationFrames:3,usableObservationFrames:2,unavailableObservationFrames:1,observationCoverage:.6667,observationQuality:'PARTIEL'},'PARTIEL'],
  [{...base,observationQuality:undefined},'FIABLE']
];
for(const [bridge,quality] of good){
  const result=Guard.observationState({bridge});
  assert.strictEqual(result.quality,quality);
  assert.strictEqual(result.available,true);
  assert.strictEqual(result.coverage,bridge.observationCoverage);
}
const invalid=[
  {...base,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:0},
  {...base,usableObservationFrames:100},
  {...base,usableObservationFrames:undefined},
  {...base,unavailableObservationFrames:-1},
  {...base,observationCoverage:''},
  {...base,observationCoverage:null},
  {...base,observationCoverage:.8},
  {...base,observationCoverage:NaN},
  {...base,observationQuality:'PARTIEL'},
  {...base,attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:0,observationQuality:'INDISPONIBLE'}
];
const env={CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}};
function report(bridge){
  return {
    bridge,
    firstResultsTestability:{status:'PHYSICAL_TESTABLE',coreTestable:true,physicalTestable:true},
    playerCards:{summary:{status:'PHYSICAL_TESTABLE'},players:[{
      firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true}
    }]}
  };
}
for(const bridge of invalid){
  const state=Guard.observationState({bridge});
  assert.strictEqual(state.available,true,'present but malformed evidence must not be treated as absent');
  assert.strictEqual(state.quality,'INDISPONIBLE');
  assert.strictEqual(state.reasons.OBSERVATION_EVIDENCE_INCONSISTENT,1);
  const result=Guard.apply(report(bridge),env);
  assert.strictEqual(result.firstResultsTestability.status,'INDISPONIBLE');
  assert.strictEqual(result.observationCoverageGuard.physicalResultsAllowed,false);
  assert.strictEqual(result.observationCoverageGuard.visualResultsAllowed,false);
  assert.strictEqual(result.playerCards.players[0].firstResults.distance,false);
}
assert.strictEqual(Guard.observationState({}).available,false,'legacy reports with no observation contract remain distinguishable');
const healthy=Guard.apply(report(base),env);
assert.strictEqual(healthy.firstResultsTestability.status,'PHYSICAL_TESTABLE');
assert.strictEqual(healthy.observationCoverageGuard.physicalResultsAllowed,true);
console.log('observation integrity non-regression: PASS');
