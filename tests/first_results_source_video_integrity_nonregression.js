'use strict';
const assert=require('node:assert/strict');
const gate=require('../first_results_readiness_v1.js');
const all=()=>Object.fromEntries(gate.REQUIRED.map(name=>[name,{available:true,coverage:.9,analysisId:'match-1',inputFingerprint:'video-1'}]));
let assertions=0;
function verify(input,ready,reason){
  const out=gate.evaluateFirstResults(input,{minCoverage:.8});
  assert.equal(out.ready,ready);assert.equal(out.status,ready?'PREMIERS_RESULTATS_PRETS':'INDISPONIBLE');
  if(reason)assert(out.unavailable.some(item=>item.reason===reason),'Expected '+reason);
  assertions+=reason?3:2;
  return out;
}
verify(all(),true);
for(const name of gate.REQUIRED){const a=all();a[name].inputFingerprint='video-2';verify(a,false,'INPUT_FINGERPRINT_MISMATCH');}
{
 const a=all();for(const [name,artifact] of Object.entries(a)){artifact.sourceVideoFingerprint='video-1';artifact.inputFingerprint='stage-'+name;}
 const out=verify(a,true);assert.equal(out.sourceVideoFingerprintConsistent,true);assert.equal(out.provenanceMode,'EXPLICIT_SOURCE_VIDEO');assertions+=2;
}
for(const name of gate.REQUIRED){
 const a=all();for(const artifact of Object.values(a))artifact.sourceVideoFingerprint='video-1';
 a[name].sourceVideoFingerprint='video-2';const out=verify(a,false,'INPUT_FINGERPRINT_MISMATCH');assert.equal(out.sourceVideoFingerprintConsistent,false);assertions++;
}
for(const name of gate.REQUIRED){
 const a=all();a[name].sourceVideoFingerprint='video-1';verify(a,false,'SOURCE_VIDEO_FINGERPRINT_MISSING');
}
for(const bad of [null,undefined,'',false,[],{},'   ']){
 const a=all();a.heatmaps.sourceVideoFingerprint=bad;verify(a,false,'PROVENANCE_INCOMPLETE');
}
{
 const a=all();a.heatmaps.analysisId='other';a.heatmaps.inputFingerprint='other';verify(a,false,'ANALYSIS_ID_MISMATCH');
}
{
 const a=all();a.tracking.inputFingerprint=' video-1 ';const out=verify(a,true);assert.equal(out.sourceVideoFingerprintConsistent,false);assertions++;
}
console.log('first results source-video provenance: '+assertions+' assertions PASS');
