'use strict';
const assert=require('assert');
const Provider=require('../camera_motion_artifact_provider_v1.js');

const base={
  contractVersion:Provider.VERSION,
  providerId:'opencv-botsort-gmc-fixture',
  provenance:{source:'NirAharon/BoT-SORT + OpenCV',license:'MIT + Apache-2.0',revision:'fixture-v1'},
  maxSampleAgeSec:.05,
  samples:[
    {segment:0,anchorTime:1,time:1.04,matrix:[1,0,4,0,1,2],confidence:.96,support:90,inlierRatio:.91,residual:.003,forwardBackwardErrorPx:.5},
    {segment:1,anchorTime:2,time:2.04,matrix:[1,0,2,0,1,1],confidence:.95,support:80,inlierRatio:.9,residual:.004,forwardBackwardErrorPx:.6}
  ]
};

assert.strictEqual(Provider.validateArtifact(base).ok,true);
assert.strictEqual(Provider.validateArtifact({...base,provenance:{source:'x',license:'GPL-3.0',revision:'r'}}).reason,'CAMERA_MOTION_ARTIFACT_LICENSE_REJECTED');
assert.strictEqual(Provider.validateArtifact({...base,samples:[base.samples[1],base.samples[0]]}).reason,'CAMERA_MOTION_ARTIFACT_SAMPLES_NOT_SORTED');

const p=Provider.createProvider(base);
let hit=p.motionFor(1,1.041,0);
assert(hit.motion,'fresh motion sample should be available');
assert.strictEqual(hit.motion.segment,0);
assert.strictEqual(p.motionFor(1,1.2,0).reason,'CAMERA_MOTION_SAMPLE_UNAVAILABLE');
assert.strictEqual(p.motionFor(1,2.041,1).reason,'CAMERA_MOTION_SAMPLE_UNAVAILABLE','segment/anchor isolation must hold');

const anchor={validated:true,homography:[1,0,0,0,1,0,0,0,1],confidence:.98,pitch:{lengthM:105,widthM:68}};
const propagated=p.createPropagatedProjector(anchor,1,1.04,0,{frameWidth:1920,frameHeight:1080,maxAgeSec:.1,requireForwardBackwardConsistency:true});
assert.strictEqual(propagated.validated,true,propagated.reason||'propagated projector should validate');
const q=propagated.project({x:100,y:50});
assert(q&&Math.abs(q.x-96)<1e-6&&Math.abs(q.y-48)<1e-6,'current image must map through inverse camera motion');
assert.strictEqual(propagated.artifact.segment,0);
assert.strictEqual(propagated.artifact.provenance.source,'NirAharon/BoT-SORT + OpenCV');

console.log('camera_motion_artifact_provider_nonregression: ok');