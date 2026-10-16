'use strict';
const assert=require('assert');
let frameEvidence=null;
global.CAYStableTrackingBridge={
  create(){
    return {report(){return {
      bridge:frameEvidence?{...frameEvidence}:undefined,
      playerCards:{summary:{status:'TERRAIN_DISPONIBLE'},players:[{
        id:'A',firstResults:{tracking:true,trajectory:true,heatmap:true,
          distance:true,avgSpeed:true,maxSpeed:true,sprints:true,
          physicalMetrics:true,physicalMetricsComplete:true}
      }]}
    };}};
  }
};
require('../first_results_testability_gate_v1.js');
global.CAYStableTrackingRuntimeGuard={
  verdict(){return {ok:true,twoStage:true,cameraConsensus:true,reasons:[]};}
};
const Guard=require('../first_results_runtime_guard_bridge_v1.js');
const valid={attemptedObservationFrames:100,usableObservationFrames:90,
  unavailableObservationFrames:10,observationCoverage:.9,
  observationQuality:'FIABLE',unavailableReasons:{INFERENCE_FAILED:10}};
const cases=[
  ['legacy absent',null,'PHYSICAL_TESTABLE',null],
  ['consistent reliable',valid,'PHYSICAL_TESTABLE',null],
  ['consistent partial',{...valid,usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL'},'PITCH_VISUAL_TESTABLE',null],
  ['consistent unavailable',{...valid,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE',null],
  ['rounded three frames',{...valid,attemptedObservationFrames:3,usableObservationFrames:2,unavailableObservationFrames:1,observationCoverage:.6667,observationQuality:'PARTIEL'},'PITCH_VISUAL_TESTABLE',null],
  ['missing usable',{...valid,usableObservationFrames:undefined},'INDISPONIBLE','OBSERVATION_FRAME_COUNTS_INCONSISTENT'],
  ['missing unavailable',{...valid,unavailableObservationFrames:undefined},'INDISPONIBLE','OBSERVATION_FRAME_COUNTS_INCONSISTENT'],
  ['counts disagree',{...valid,usableObservationFrames:91},'INDISPONIBLE','OBSERVATION_FRAME_COUNTS_INCONSISTENT'],
  ['negative count',{...valid,unavailableObservationFrames:-1},'INDISPONIBLE','OBSERVATION_FRAME_COUNTS_INCONSISTENT'],
  ['zero attempts',{...valid,attemptedObservationFrames:0,usableObservationFrames:0,unavailableObservationFrames:0,observationCoverage:0,observationQuality:'INDISPONIBLE'},'INDISPONIBLE','OBSERVATION_NO_ATTEMPTED_FRAMES'],
  ['forged coverage',{...valid,observationCoverage:0},'INDISPONIBLE','OBSERVATION_COVERAGE_INCONSISTENT'],
  ['blank coverage',{...valid,observationCoverage:''},'INDISPONIBLE','OBSERVATION_COVERAGE_INCONSISTENT'],
  ['forged quality',{...valid,observationQuality:'PARTIEL'},'INDISPONIBLE','OBSERVATION_QUALITY_INCONSISTENT'],
  ['forged zero frame quality',{...valid,usableObservationFrames:0,unavailableObservationFrames:100,observationCoverage:0},'INDISPONIBLE','OBSERVATION_QUALITY_INCONSISTENT']
];
for(let round=0;round<3;round++)for(const [name,evidence,expected,error] of cases){
  frameEvidence=evidence;
  const report=global.CAYStableTrackingBridge.create({}).report();
  assert.strictEqual(report.firstResultsTestability.status,expected,name);
  if(error){
    assert.strictEqual(report.observationCoverageGuard.evidenceError,error,name+' diagnostic');
    assert.strictEqual(report.observationCoverageGuard.physicalResultsAllowed,false,name+' physical');
    assert.strictEqual(report.playerCards.players[0].firstResults.tracking,false,name+' card');
  }
}
assert.strictEqual(Guard.install(global),false);
delete global.CAYStableTrackingRuntimeGuard;
delete global.CAYStableTrackingBridge;
console.log('observation consistency: PASS ('+(cases.length*3)+' scenarios)');
