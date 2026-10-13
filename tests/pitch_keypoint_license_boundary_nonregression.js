'use strict';
const assert=require('node:assert/strict');
const Guard=require('../detector_license_guard_v1.js');
const Provider=require('../pitch_keypoint_artifact_provider_v1.js');
require('../stable_runtime_tracking_v2.js');
const Runtime=global.CAYStableSemanticKeypointRuntime;
const base={source:'test-fixture',revision:'test-r1'};
const artifact=p=>({contractVersion:Provider.VERSION,provenance:p,coordinateSpace:'PIXEL',frames:[{time:1,segment:0,keypoints:[{index:0,x:1,y:2,confidence:.9}]}]});
const direct=p=>({runtimeDefaultAllowed:true,provenance:p,async inferPitchKeypoints(){throw Error('must not infer');}});
let checks=0;
for(let repeat=0;repeat<5;repeat++){
  for(const license of ['MIT','Apache-2.0','BSD-3-Clause','ISC']){
    const p={...base,license};
    assert.equal(Guard.inspectLicense(license).allowed,true);
    assert.equal(Provider.validateArtifact(artifact(p)).ok,true,license);
    assert.equal(Runtime.providerVerdict(direct(p)).allowed,true,license);
    checks+=3;
  }
  for(const license of ['AGPL-3.0','GPL-3.0','proprietary','unknown','MIT+unknown','MIT OR GPL-3.0','','CAY-INTERNAL']){
    const p={...base,license};
    assert.equal(Guard.inspectLicense(license).allowed,license==='CAY-INTERNAL','central guard '+license);
    assert.equal(Provider.validateArtifact(artifact(p)).ok,false,'artifact '+license);
    assert.equal(Runtime.providerVerdict(direct(p)).allowed,false,'runtime '+license);
    checks+=3;
  }
  const internal={...base,license:'CAY-INTERNAL',kind:'internal'};
  assert.equal(Provider.validateArtifact(artifact(internal)).ok,true);
  assert.equal(Runtime.providerVerdict(direct(internal)).allowed,true);
  assert.equal(Provider.validateArtifact(artifact({...base,license:'MIT',kind:'internal'})).ok,false);
  assert.equal(Runtime.providerVerdict(direct({...base,license:'MIT',kind:'internal'})).allowed,false);
  checks+=4;
}
console.log('pitch keypoint license boundary non-regression: '+checks+' assertions PASS');
