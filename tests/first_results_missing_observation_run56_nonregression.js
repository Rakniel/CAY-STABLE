'use strict';
const assert=require('node:assert/strict');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');
const missing=[null,undefined,{}, {bridge:{}},
  {bridge:{attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:0,observationQuality:'INDISPONIBLE'}},
  {bridge:{attemptedObservationFrames:true,observationQuality:'FIABLE'}},
  {bridge:{attemptedObservationFrames:'100',observationQuality:'FIABLE'}},
  {bridge:{attemptedObservationFrames:1.5,observationQuality:'FIABLE'}}];
for(const source of missing){
  const observation=Guard.observationState(source);
  assert.equal(observation.available,false);
  const report={firstResultsTestability:{status:'PHYSICAL_TESTABLE',coreTestable:true,physicalTestable:true},
    playerCards:{summary:{status:'PHYSICAL_TESTABLE'},players:[{id:'A',
      firstResults:{status:'PHYSICAL_TESTABLE',tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true}}]}};
  Guard.applyObservationGuard(report,observation);
  assert.equal(report.observationCoverageGuard.available,false);
  assert.equal(report.observationCoverageGuard.physicalResultsAllowed,false);
  assert.equal(report.observationCoverageGuard.visualResultsAllowed,false);
  assert.equal(report.firstResultsTestability.status,'INDISPONIBLE');
  assert.equal(report.firstResultsTestability.coreTestable,false);
  assert.equal(report.firstResultsTestability.physicalTestable,false);
  assert.equal(report.playerCards.players[0].firstResults.status,'INDISPONIBLE');
  assert.equal(report.playerCards.players[0].firstResults.tracking,false);
  assert.equal(report.playerCards.players[0].firstResults.distance,false);
}
for(const [bridge,quality] of [
  [{attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'},'FIABLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL'},'PARTIEL'],
  [{attemptedObservationFrames:20,usableObservationFrames:0,unavailableObservationFrames:20,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE']]){
  const observation=Guard.observationState({bridge});
  assert.equal(observation.quality,quality);
  const report={firstResultsTestability:{status:'PHYSICAL_TESTABLE',physicalTestable:true},playerCards:{summary:{},players:[]}};
  Guard.applyObservationGuard(report,observation);
  assert.equal(report.observationCoverageGuard.physicalResultsAllowed,quality==='FIABLE');
}
console.log('RUN56 missing observation fail-closed: PASS');
