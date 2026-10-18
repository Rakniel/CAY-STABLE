'use strict';
const assert = require('node:assert/strict');
const Guard = require('../first_results_runtime_guard_bridge_v1.js');

// Evidence must be derived from observed frame counts, not an optimistic
// upstream label. Keep this test on the shipped bridge (not a copied helper).
const cases = [
  ['90% reliable', {attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'}, 'FIABLE'],
  ['70% partial', {attemptedObservationFrames:100,usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL'}, 'PARTIEL'],
  ['zero usable, claimed 90%', {attemptedObservationFrames:100,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:.9,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['60% falsely reliable', {attemptedObservationFrames:100,usableObservationFrames:60,unavailableObservationFrames:40,observationCoverage:.6,observationQuality:'FIABLE'}, 'PARTIEL'],
  ['missing usable', {attemptedObservationFrames:100,observationCoverage:.9,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['contradictory counts', {attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:30,observationCoverage:.9,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['derive coverage', {attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationQuality:'FIABLE'}, 'FIABLE'],
  ['respect cautious label', {attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'PARTIEL'}, 'PARTIEL'],
  ['zero attempts', {attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:1,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['missing attempts', {observationCoverage:.9,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['null attempts', {attemptedObservationFrames:null,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['invalid coverage', {attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:1.1,observationQuality:'FIABLE'}, 'INDISPONIBLE'],
  ['rounded producer coverage', {attemptedObservationFrames:3,usableObservationFrames:2,unavailableObservationFrames:1,observationCoverage:.6667,observationQuality:'PARTIEL'}, 'PARTIEL']
];
let assertions=0;
for(let pass=0;pass<3;pass++){
  for(const [name,bridge,expected] of cases){
    assert.equal(Guard.observationState({bridge}).quality,expected,name); assertions++;
    const report={
      bridge:{...bridge},
      firstResultsTestability:{status:'PHYSICAL_TESTABLE',physicalTestable:true},
      playerCards:{players:[{firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true}}]}
    };
    const result=Guard.apply(report,{CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}});
    assert.equal(result.observationCoverageGuard.quality,expected,name); assertions++;
    if(expected==='INDISPONIBLE'){
      assert.equal(result.firstResultsTestability.status,'INDISPONIBLE',name); assertions++;
      assert.equal(result.playerCards.players[0].firstResults.tracking,false,name); assertions++;
    }else if(expected==='PARTIEL'){
      assert.equal(result.playerCards.players[0].firstResults.distance,false,name); assertions++;
    }
  }
  assert.equal(Guard.observationState({bridge:{}}).available,false,'legacy evidence absent'); assertions++;
}
console.log('first results observation evidence: '+assertions+' assertions PASS');
