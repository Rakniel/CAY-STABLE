'use strict';
const assert=require('node:assert/strict');
const Bridge=require('../first_results_runtime_guard_bridge_v1.js');
const valid=[
  [{attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'},'FIABLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL'},'PARTIEL'],
  [{attemptedObservationFrames:20,usableObservationFrames:0,unavailableObservationFrames:20,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:95,unavailableObservationFrames:5,observationCoverage:.95,observationQuality:'PARTIEL'},'PARTIEL']
];
const invalid=[
  [{attemptedObservationFrames:100,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:0,observationQuality:'FIABLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:50,unavailableObservationFrames:50,observationCoverage:.5,observationQuality:'FIABLE'},'PARTIEL'],
  [{attemptedObservationFrames:100,usableObservationFrames:1,unavailableObservationFrames:99,observationCoverage:.95,observationQuality:'FIABLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:100,unavailableObservationFrames:0,observationCoverage:1.5,observationQuality:'FIABLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:-1,observationQuality:'FIABLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:90,observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE'],
  [{attemptedObservationFrames:100,usableObservationFrames:99,unavailableObservationFrames:1,observationCoverage:.98,observationQuality:'FIABLE'},'INDISPONIBLE']
];
for(const [bridge,quality] of [...valid,...invalid]){
  const observation=Bridge.observationState({bridge});
  assert.equal(observation.quality,quality);
  const report={firstResultsTestability:{status:'PHYSICAL_TESTABLE',physicalTestable:true},playerCards:{summary:{},players:[]}};
  Bridge.applyObservationGuard(report,observation);
  assert.equal(report.observationCoverageGuard.physicalResultsAllowed,quality==='FIABLE');
}
for(const attemptedObservationFrames of ['0x64',true,2.5,-1]){
  assert.equal(Bridge.observationState({bridge:{attemptedObservationFrames,observationQuality:'FIABLE'}}).available,false);
}
console.log('RUN53 observation integrity: PASS');
