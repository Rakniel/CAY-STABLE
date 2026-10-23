'use strict';
const assert=require('assert');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');

const sample=(attempted,usable,coverage,quality)=>({
  attemptedObservationFrames:attempted,
  usableObservationFrames:usable,
  unavailableObservationFrames:attempted-usable,
  observationCoverage:coverage,
  observationQuality:quality
});
const state=bridge=>Guard.observationState({bridge});

assert.strictEqual(state(sample(100,90,.9,'FIABLE')).quality,'FIABLE');
assert.strictEqual(state(sample(100,70,.7,'PARTIEL')).quality,'PARTIEL');
assert.strictEqual(state(sample(100,0,0,'INDISPONIBLE')).quality,'INDISPONIBLE');
assert.strictEqual(state(sample(3,2,.6667,'PARTIEL')).quality,'PARTIEL','four-decimal strict-frame rounding remains valid');
assert.strictEqual(state(sample(100,90,.9,null)).quality,'FIABLE','missing declared quality derives from observed counts');
assert.strictEqual(state({}).available,false,'legacy report without strict-frame evidence remains unchanged');

const invalid=[
  [sample(100,0,0,'FIABLE'),'OBSERVATION_QUALITY_INCOHERENTE'],
  [sample(100,70,.9,'FIABLE'),'OBSERVATION_COVERAGE_INCOHERENT'],
  [{...sample(100,90,.9,'FIABLE'),unavailableObservationFrames:9},'OBSERVATION_FRAME_COUNTS_INCOHERENT'],
  [{...sample(100,90,.9,'FIABLE'),usableObservationFrames:null},'OBSERVATION_FRAME_COUNTS_INCOHERENT'],
  [{...sample(100,90,.9,'FIABLE'),observationCoverage:null},'OBSERVATION_COVERAGE_INCOHERENT'],
  [{...sample(100,90,.9,'FIABLE'),observationCoverage:Infinity},'OBSERVATION_COVERAGE_INCOHERENT'],
  [sample(0,0,0,'INDISPONIBLE'),'OBSERVATION_NO_ATTEMPTED_FRAMES'],
  [sample(-1,0,0,'INDISPONIBLE'),'OBSERVATION_ATTEMPT_COUNT_INVALID'],
  [sample(100,90,.9,'UNKNOWN'),'OBSERVATION_QUALITY_INCOHERENTE']
];
for(const [bridge,reason] of invalid){
  const result=state(bridge);
  assert.strictEqual(result.available,true);
  assert.strictEqual(result.quality,'INDISPONIBLE');
  assert.strictEqual(result.coverage,null,'invalid evidence must not be reported as a measured percentage');
  assert.strictEqual(result.reasons[reason],1,'inconsistent source must expose an explicit blocker');
}

const report={
  bridge:sample(100,0,0,'FIABLE'),
  firstResultsTestability:{status:'PHYSICAL_TESTABLE',coreTestable:true,physicalTestable:true},
  playerCards:{
    summary:{status:'PHYSICAL_TESTABLE'},
    players:[{firstResults:{status:'PHYSICAL_TESTABLE',tracking:true,trajectory:true,heatmap:true,distance:true}}]
  }
};
const env={CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}};
Guard.apply(report,env);
assert.strictEqual(report.firstResultsTestability.status,'INDISPONIBLE');
assert.strictEqual(report.firstResultsTestability.coreTestable,false);
assert.strictEqual(report.playerCards.players[0].firstResults.tracking,false);
assert.strictEqual(report.playerCards.players[0].firstResults.distance,false);
assert.strictEqual(report.observationCoverageGuard.physicalResultsAllowed,false);

console.log('first results observation evidence consistency non-regression: PASS');
