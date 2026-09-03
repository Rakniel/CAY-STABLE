const assert=require('assert');
const M=require('../metric_camera_motion_projector_v1.js');
const H=[1,0,0,0,1,0,0,0,1];
const anchor={validated:true,homography:H,confidence:.95,pitch:{lengthM:105,widthM:68}};

const translated=M.createPropagatedProjector(anchor,{matrix:[1,0,10,0,1,5],confidence:.95,support:40,inlierRatio:.9,residual:.005},{ageSec:.1,maxAgeSec:.35});
assert.strictEqual(translated.validated,true);
let q=translated.project({x:30,y:25});
assert.ok(q);
assert.ok(Math.abs(q.x-20)<1e-9);
assert.ok(Math.abs(q.y-20)<1e-9);
assert.strictEqual(translated.validation.motionSupport,40);
assert.ok(translated.validation.motionPlausibility);

const scaled=M.createPropagatedProjector(anchor,{matrix:[1.1,0,2,0,1.1,-3,0,0,1],confidence:.96,support:60,inlierRatio:.92,residual:.004},{ageSec:.2,maxAgeSec:.35});
assert.strictEqual(scaled.validated,true);
q=scaled.project({x:24,y:19});
assert.ok(Math.abs(q.x-20)<1e-8);
assert.ok(Math.abs(q.y-20)<1e-8);

const stale=M.createPropagatedProjector(anchor,{matrix:[1,0,1,0,1,1],confidence:.95,support:40,inlierRatio:.9,residual:.005},{ageSec:.5,maxAgeSec:.35});
assert.strictEqual(stale.validated,false);
assert.strictEqual(stale.reason,'PROPAGATION_TOO_OLD');
const weak=M.createPropagatedProjector(anchor,{matrix:[1,0,1,0,1,1],confidence:.5,support:40,inlierRatio:.9,residual:.005},{ageSec:.1});
assert.strictEqual(weak.validated,false);
assert.strictEqual(weak.reason,'MOTION_CONFIDENCE_TOO_LOW');
const lowSupport=M.createPropagatedProjector(anchor,{matrix:[1,0,1,0,1,1],confidence:.95,support:5,inlierRatio:.9,residual:.005},{ageSec:.1});
assert.strictEqual(lowSupport.validated,false);
assert.strictEqual(lowSupport.reason,'MOTION_SUPPORT_TOO_LOW');
const highResidual=M.createPropagatedProjector(anchor,{matrix:[1,0,1,0,1,1],confidence:.95,support:40,inlierRatio:.9,residual:.08},{ageSec:.1});
assert.strictEqual(highResidual.validated,false);
assert.strictEqual(highResidual.reason,'MOTION_RESIDUAL_TOO_HIGH');
const cut=M.createPropagatedProjector(anchor,{matrix:[1,0,1,0,1,1],confidence:.95,support:40,inlierRatio:.9,residual:.005},{ageSec:.1,segmentBreak:true});
assert.strictEqual(cut.validated,false);
assert.strictEqual(cut.reason,'SEGMENT_BREAK');

// A high-confidence consensus is still unsafe when its transform is physically
// implausible for a short camera-motion propagation window.
const mirrored=M.createPropagatedProjector(anchor,{matrix:[-1,0,100,0,1,0],confidence:.99,support:100,inlierRatio:.98,residual:.001},{ageSec:.05});
assert.strictEqual(mirrored.validated,false);
assert.strictEqual(mirrored.reason,'MOTION_ORIENTATION_FLIP');
const extremeZoom=M.createPropagatedProjector(anchor,{matrix:[2.2,0,0,0,2.2,0],confidence:.99,support:100,inlierRatio:.98,residual:.001},{ageSec:.05});
assert.strictEqual(extremeZoom.validated,false);
assert.strictEqual(extremeZoom.reason,'MOTION_SCALE_IMPLAUSIBLE');
const extremePerspective=M.createPropagatedProjector(anchor,{matrix:[1,0,0,0,1,0,.002,0,1],confidence:.99,support:100,inlierRatio:.98,residual:.001},{ageSec:.05,frameWidth:1280,frameHeight:720});
assert.strictEqual(extremePerspective.validated,false);
assert.strictEqual(extremePerspective.reason,'MOTION_PERSPECTIVE_TOO_HIGH');

const unavailable=M.createPropagatedProjector({validated:false}, {matrix:[1,0,0,0,1,0],confidence:1,support:100,inlierRatio:1,residual:0},{ageSec:.1});
assert.strictEqual(unavailable.validated,false);
assert.strictEqual(unavailable.reason,'ANCHOR_CALIBRATION_UNAVAILABLE');
console.log('metric_camera_motion_projector_nonregression: PASS');
