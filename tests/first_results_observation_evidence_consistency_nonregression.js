'use strict';
const assert=require('node:assert/strict');
const Guard=require('../first_results_runtime_guard_bridge_v1.js');

const make=(fields)=>({bridge:{attemptedObservationFrames:100,...fields}});
const cases=[
  ['consistent reliable',{usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE'},'FIABLE'],
  ['consistent partial',{usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL'},'PARTIEL'],
  ['false reliable zero usable',{usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE'],
  ['false reliable partial',{usableObservationFrames:60,unavailableObservationFrames:40,observationCoverage:.6,observationQuality:'FIABLE'},'PARTIEL'],
  ['blank coverage',{usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:null,observationQuality:'FIABLE'},'INDISPONIBLE'],
  ['missing counts',{observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE'],
  ['inconsistent counts',{usableObservationFrames:90,unavailableObservationFrames:30,observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE'],
  ['derived coverage',{usableObservationFrames:90,unavailableObservationFrames:10,observationQuality:'FIABLE'},'FIABLE'],
  ['no unjustified upgrade',{usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'PARTIEL'},'PARTIEL'],
  ['declared unavailable',{usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'INDISPONIBLE'},'INDISPONIBLE'],
  ['null usable',{usableObservationFrames:null,unavailableObservationFrames:100,observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE'],
  ['negative usable',{usableObservationFrames:-5,unavailableObservationFrames:105,observationCoverage:.9,observationQuality:'FIABLE'},'INDISPONIBLE']
];

for(let pass=0;pass<3;pass++){
  for(const [name,data,quality] of cases){
    const result=Guard.observationState(make(data));
    assert.equal(result.quality,quality,name);
    if(quality==='INDISPONIBLE'&&name!=='declared unavailable'&&name!=='blank coverage')
      assert.equal(result.evidenceConsistent,false,name+' must reject inconsistent evidence');
  }
  const env={CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true,reasons:[]})}};
  const report={
    bridge:make({usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:.9,observationQuality:'FIABLE'}).bridge,
    firstResultsTestability:{status:'PHYSICAL_TESTABLE',physicalTestable:true},
    playerCards:{players:[{firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true}}]}
  };
  const guarded=Guard.apply(report,env);
  assert.equal(guarded.firstResultsTestability.status,'INDISPONIBLE');
  assert.equal(guarded.playerCards.players[0].firstResults.tracking,false);
  assert.equal(guarded.observationCoverageGuard.physicalResultsAllowed,false);
}
console.log('RUN72 observation evidence consistency: PASS (3 passes)');
