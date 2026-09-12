'use strict';
const assert=require('assert');
const Provider=require('../camera_motion_artifact_provider_v1.js');
const Guard=require('../camera_motion_background_evidence_guard_v1.js');

const artifact={
  contractVersion:Provider.VERSION,
  providerId:'norfair-style-background-motion-fixture',
  provenance:{source:'CAY clean-room background-motion producer; design reference tryolabs/norfair',license:'BSD-3-Clause',revision:'e517b4236f6b67a6ecf342f5df1fccb7788dbc54'},
  samples:[
    {segment:0,anchorTime:1,time:1.03,matrix:[1,0,3,0,1,1],confidence:.95,support:80,inlierRatio:.9,residual:.004,backgroundMaskApplied:true,matchedReferencePointRatio:.91,referenceAgeFrames:8}
  ]
};

assert.strictEqual(Provider.validateArtifact(artifact).ok,true,'base artifact must remain compatible');
assert.strictEqual(Guard.validateArtifact(artifact).ok,true,'background-evidenced artifact should pass');

let verdict=Guard.validateArtifact({...artifact,samples:[{...artifact.samples[0],backgroundMaskApplied:false}]});
assert.strictEqual(verdict.reason,'BACKGROUND_MOTION_MASK_EVIDENCE_MISSING');
assert.strictEqual(verdict.sampleIndex,0);

verdict=Guard.validateArtifact({...artifact,samples:[{...artifact.samples[0],matchedReferencePointRatio:undefined}]});
assert.strictEqual(verdict.reason,'BACKGROUND_MOTION_REFERENCE_RATIO_MISSING');

verdict=Guard.validateArtifact({...artifact,samples:[{...artifact.samples[0],matchedReferencePointRatio:1.2}]});
assert.strictEqual(verdict.reason,'BACKGROUND_MOTION_REFERENCE_RATIO_INVALID');

verdict=Guard.validateArtifact({...artifact,samples:[{...artifact.samples[0],matchedReferencePointRatio:.74}]});
assert.strictEqual(verdict.reason,'BACKGROUND_MOTION_REFERENCE_RATIO_TOO_LOW');

assert.strictEqual(Guard.validateArtifact(artifact,{minMatchedReferencePointRatio:.92}).reason,'BACKGROUND_MOTION_REFERENCE_RATIO_TOO_LOW');
assert.strictEqual(Guard.validateArtifact(artifact,{maxReferenceAgeFrames:7}).reason,'BACKGROUND_MOTION_REFERENCE_TOO_OLD');
assert.strictEqual(Guard.validateArtifact(artifact,{maxReferenceAgeFrames:8}).ok,true);

const guarded=Guard.createGuardedProvider(artifact,{minMatchedReferencePointRatio:.8,maxReferenceAgeFrames:10});
assert.strictEqual(guarded.backgroundEvidenceGuard.version,Guard.VERSION);
assert.strictEqual(guarded.backgroundEvidenceGuard.minMatchedReferencePointRatio,.8);
const hit=guarded.motionFor(1,1.031,0);
assert(hit.motion,'guard must preserve the existing provider once evidence is validated');
assert.deepStrictEqual(hit.backgroundEvidence,{
  guardVersion:Guard.VERSION,
  backgroundMaskApplied:true,
  matchedReferencePointRatio:.91,
  minMatchedReferencePointRatio:.8,
  referenceAgeFrames:8
},'accepted runtime motion must keep its background evidence auditable');

const unavailable=guarded.motionFor(1,2,0);
assert.strictEqual(unavailable.motion,null,'stale motion remains unavailable');
assert.strictEqual(unavailable.backgroundEvidence,undefined,'unavailable motion must not fabricate evidence');

const projector={project:p=>p};
const propagated=guarded.createPropagatedProjector(projector,1,1.031,0,{maxAgeSec:1});
if(propagated.validated===true){
  assert(propagated.artifact&&propagated.artifact.backgroundEvidence,'propagated projector must expose the accepted background evidence');
  assert.strictEqual(propagated.artifact.backgroundEvidence.matchedReferencePointRatio,.91);
}

const legalFailure=Guard.validateArtifact({...artifact,provenance:{source:'x',license:'GPL-3.0',revision:'r'}});
assert.strictEqual(legalFailure.reason,'CAMERA_MOTION_ARTIFACT_LICENSE_REJECTED','existing license guard must remain authoritative');

console.log('camera_motion_background_evidence_guard_nonregression: ok');
