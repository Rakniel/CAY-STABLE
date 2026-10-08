'use strict';
const assert=require('assert');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');
const base={attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'};
const env={CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}};
function state(patch){return Guard.observationState({bridge:{...base,...patch}});}
function report(patch){
  return {bridge:{...base,...patch},firstResultsTestability:{status:'PHYSICAL_TESTABLE',physicalTestable:true,coreTestable:true},playerCards:{summary:{status:'PHYSICAL_TESTABLE'},players:[{id:1,firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,metricReady:true}}]}};
}
assert.strictEqual(Guard.observationState({bridge:{}}).available,false,'legacy report without any observation evidence is unchanged');
assert.strictEqual(state({}).quality,'FIABLE');
assert.strictEqual(state({usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'FIABLE'}).quality,'PARTIEL','declared FIABLE cannot upgrade 70% evidence');
assert.strictEqual(state({observationQuality:'PARTIEL'}).quality,'PARTIEL','explicitly lower quality remains restrictive');
assert.strictEqual(state({observationQuality:'INDISPONIBLE'}).quality,'INDISPONIBLE','explicit unavailable quality remains restrictive');
assert.strictEqual(state({attemptedObservationFrames:3,usableObservationFrames:2,unavailableObservationFrames:1,observationCoverage:.6667,observationQuality:'PARTIEL'}).quality,'PARTIEL','4-decimal source rounding must be accepted');
const invalid=[
  [{observationCoverage:undefined},'OBSERVATION_COVERAGE_INVALID'],
  [{observationCoverage:null},'OBSERVATION_COVERAGE_INVALID'],
  [{observationCoverage:NaN},'OBSERVATION_COVERAGE_INVALID'],
  [{observationCoverage:-.1},'OBSERVATION_COVERAGE_INVALID'],
  [{observationCoverage:1.2},'OBSERVATION_COVERAGE_INVALID'],
  [{observationCoverage:.99},'OBSERVATION_COVERAGE_INCONSISTENT'],
  [{usableObservationFrames:80},'FRAME_COUNTS_INCONSISTENT'],
  [{unavailableObservationFrames:-10},'FRAME_COUNTS_INVALID'],
  [{usableObservationFrames:89.5,unavailableObservationFrames:10.5},'FRAME_COUNTS_INVALID'],
  [{usableObservationFrames:undefined},'FRAME_COUNTS_INVALID'],
  [{attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:0},'ATTEMPTED_FRAMES_INVALID'],
  [{attemptedObservationFrames:null},'ATTEMPTED_FRAMES_INVALID'],
  [{attemptedObservationFrames:'100'},'ATTEMPTED_FRAMES_INVALID'],
  [{observationQuality:'PERFECT'},'OBSERVATION_QUALITY_INVALID']
];
for(const [patch,reason] of invalid){
  const evidence=state(patch);
  assert.strictEqual(evidence.available,true,'explicit corrupt observation evidence cannot disappear');
  assert.strictEqual(evidence.quality,'INDISPONIBLE');
  assert.strictEqual(evidence.coverage,null);
  assert(evidence.integrityIssues.includes(reason),reason);
  const result=Guard.apply(report(patch),env);
  assert.strictEqual(result.observationCoverageGuard.physicalResultsAllowed,false);
  assert.strictEqual(result.observationCoverageGuard.visualResultsAllowed,false);
  assert.strictEqual(result.firstResultsTestability.status,'INDISPONIBLE');
  assert.strictEqual(result.playerCards.players[0].firstResults.tracking,false);
}
const partial=Guard.apply(report({usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'FIABLE'}),env);
assert.strictEqual(partial.observationCoverageGuard.quality,'PARTIEL');
assert.strictEqual(partial.firstResultsTestability.status,'PITCH_VISUAL_TESTABLE');
assert.strictEqual(partial.playerCards.players[0].firstResults.tracking,true);
assert.strictEqual(partial.playerCards.players[0].firstResults.distance,false);
const valid=Guard.apply(report({}),env);
assert.strictEqual(valid.observationCoverageGuard.physicalResultsAllowed,true);
assert.strictEqual(valid.firstResultsTestability.status,'PHYSICAL_TESTABLE');
console.log('first results observation integrity non-regression: PASS');
