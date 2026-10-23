'use strict';
const assert=require('node:assert/strict');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');
const base={attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'};
const cases=[
  ['valid',{},'FIABLE'],
  ['partial',{usableObservationFrames:40,unavailableObservationFrames:60,observationCoverage:.4,observationQuality:'PARTIEL'},'PARTIEL'],
  ['overclaim',{usableObservationFrames:40,unavailableObservationFrames:60,observationCoverage:.4},'PARTIEL'],
  ['wrong ratio',{usableObservationFrames:40,unavailableObservationFrames:60},'INDISPONIBLE'],
  ['zero attempted',{attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:0},'INDISPONIBLE'],
  ['missing attempted',{attemptedObservationFrames:undefined},'INDISPONIBLE'],
  ['missing usable',{usableObservationFrames:undefined},'INDISPONIBLE'],
  ['negative count',{usableObservationFrames:-1,unavailableObservationFrames:101,observationCoverage:0},'INDISPONIBLE'],
  ['excess count',{usableObservationFrames:101,unavailableObservationFrames:0,observationCoverage:1},'INDISPONIBLE'],
  ['blank coverage',{observationCoverage:' '},'INDISPONIBLE'],
  ['boolean coverage',{observationCoverage:true},'INDISPONIBLE'],
  ['array coverage',{observationCoverage:[.9]},'INDISPONIBLE'],
  ['object coverage',{observationCoverage:{value:.9}},'INDISPONIBLE'],
  ['infinite coverage',{observationCoverage:Infinity},'INDISPONIBLE'],
  ['conservative declaration',{observationQuality:'PARTIEL'},'PARTIEL'],
  ['missing quality',{observationQuality:''},'INDISPONIBLE'],
  ['rounded ratio',{attemptedObservationFrames:3,usableObservationFrames:2,unavailableObservationFrames:1,observationCoverage:.6667,observationQuality:'PARTIEL'},'PARTIEL'],
  ['zero usable',{usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE'],
  ['array count',{usableObservationFrames:[90]},'INDISPONIBLE'],
  ['boolean count',{usableObservationFrames:true},'INDISPONIBLE'],
  ['boolean unavailable',{unavailableObservationFrames:false},'INDISPONIBLE'],
  ['NaN unavailable',{unavailableObservationFrames:NaN},'INDISPONIBLE']
];
let checks=0;
for(let round=0;round<3;round++)for(const [name,overrides,expected] of cases){
  const state=Guard.observationState({bridge:{...base,...overrides}});
  assert.equal(state.available,true,name);
  assert.equal(state.quality,expected,name);
  if(expected==='INDISPONIBLE')assert.equal(state.quality==='FIABLE',false,name);
  checks+=2+(expected==='INDISPONIBLE'?1:0);
}
assert.equal(Guard.observationState({}).available,false);checks++;
const report={
  bridge:{...base,usableObservationFrames:40,unavailableObservationFrames:60},
  firstResultsTestability:{status:'PHYSICAL_TESTABLE',physicalTestable:true},
  playerCards:{summary:{status:'PHYSICAL_TESTABLE'},players:[{id:'A',firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true}}]}
};
const guarded=Guard.apply(report,{CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}});
assert.equal(guarded.firstResultsTestability.status,'INDISPONIBLE');checks++;
assert.equal(guarded.playerCards.players[0].firstResults.distance,false);checks++;
assert.equal(guarded.observationCoverageGuard.physicalResultsAllowed,false);checks++;
console.log('first results observation evidence non-regression: PASS ('+checks+' assertions, '+cases.length+' scenarios x3)');
