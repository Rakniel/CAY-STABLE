'use strict';
const assert=require('node:assert/strict');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');
let assertions=0;
const eq=(actual,expected,label)=>{assert.equal(actual,expected,label);assertions++;};
const cases=[
  ['missing bridge',null,'INDISPONIBLE'],
  ['empty bridge',{},'INDISPONIBLE'],
  ['null attempted',{attemptedObservationFrames:null},'INDISPONIBLE'],
  ['zero attempted',{attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:0},'INDISPONIBLE'],
  ['missing usable',{attemptedObservationFrames:10,unavailableObservationFrames:1,observationCoverage:.9},'INDISPONIBLE'],
  ['coverage mismatch',{attemptedObservationFrames:10,usableObservationFrames:9,unavailableObservationFrames:1,observationCoverage:.8},'INDISPONIBLE'],
  ['valid coverage',{attemptedObservationFrames:10,usableObservationFrames:9,unavailableObservationFrames:1,observationCoverage:.9,observationQuality:'FIABLE'},'PHYSICAL_TESTABLE'],
  ['partial coverage',{attemptedObservationFrames:10,usableObservationFrames:7,unavailableObservationFrames:3,observationCoverage:.7,observationQuality:'PARTIEL'},'PITCH_VISUAL_TESTABLE'],
  ['zero usable',{attemptedObservationFrames:10,usableObservationFrames:0,unavailableObservationFrames:10,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE']
];
for(let repeat=0;repeat<8;repeat++)for(const [label,bridge,expected] of cases){
  const report={
    firstResultsTestability:{status:'PHYSICAL_TESTABLE',coreTestable:true,physicalTestable:true},
    playerCards:{summary:{status:'TERRAIN_DISPONIBLE'},players:[{id:'CAY7',firstResults:{status:'PHYSICAL_TESTABLE',tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,metricReady:true}}]},
    ...(bridge===null?{}:{bridge})
  };
  const out=Guard.apply(report,{CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}});
  eq(out.firstResultsTestability.status,expected,label+' status');
  eq(out.playerCards.players[0].firstResults.status,expected,label+' player');
  if(expected==='INDISPONIBLE'){
    eq(out.firstResultsTestability.coreTestable,false,label+' core');
    eq(out.playerCards.players[0].firstResults.tracking,false,label+' no tracking');
    eq(out.playerCards.players[0].firstResults.metricReady,false,label+' no metrics');
  }else if(expected==='PITCH_VISUAL_TESTABLE'){
    eq(out.playerCards.players[0].firstResults.tracking,true,label+' visual remains');
    eq(out.playerCards.players[0].firstResults.distance,false,label+' physical blocked');
  }else{
    eq(out.playerCards.players[0].firstResults.distance,true,label+' physical remains');
  }
}
console.log('PASS '+assertions+' assertions / 8 repetitions');
