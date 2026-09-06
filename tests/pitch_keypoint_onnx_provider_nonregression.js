const assert=require('assert');
const semantic=require('../pitch_semantic_calibration_v2.js');

assert.strictEqual(semantic.VERSION,'2.1.0');
assert.strictEqual(semantic.MODEL_INPUT_SIZE,640);
assert.strictEqual(semantic.MODEL_CHANNELS,101);
assert.ok(semantic.MODEL_URL.includes('football-pitch-detection-fp16.onnx'));
assert.ok(semantic.defaultKeypointProvider);
assert.strictEqual(semantic.defaultKeypointProvider.runtimeDefaultAllowed,true);
assert.strictEqual(semantic.defaultKeypointProvider.usageScope,'INTERNAL_CLUB');
assert.strictEqual(semantic.defaultKeypointProvider.distributionPolicy,'REMOTE_WEIGHTS_NOT_BUNDLED');

const transform=semantic.letterboxTransform(1280,720,640);
assert.strictEqual(transform.scale,.5);
assert.strictEqual(transform.resizedWidth,640);
assert.strictEqual(transform.resizedHeight,360);
assert.strictEqual(transform.padX,0);
assert.strictEqual(transform.padY,140);

// Synthetic YOLOv8-pose output [1,101,2]. Proposal 0 is weak; proposal 1 is the pitch.
const proposals=2,channels=101,data=new Float32Array(channels*proposals);
const set=(proposal,channel,value)=>{data[channel*proposals+proposal]=value;};
set(0,4,.08);
set(1,4,.91);
for(let i=0;i<32;i++){
  const base=5+i*3;
  set(1,base,320);
  set(1,base+1,320);
  set(1,base+2,.80);
}
let decoded=semantic.decodePoseTensor({data,dims:[1,101,2]},transform,{minDetectionConfidence:.18,minKeypointConfidence:.2});
assert.strictEqual(decoded.reason,null);
assert.strictEqual(decoded.proposalIndex,1);
assert.ok(Math.abs(decoded.detectorConfidence-.91)<1e-5);
assert.strictEqual(decoded.keypoints.length,32);
assert.strictEqual(decoded.keypoints.filter(k=>k.visible).length,32);
assert.ok(Math.abs(decoded.keypoints[0].x-640)<1e-6);
assert.ok(Math.abs(decoded.keypoints[0].y-360)<1e-6);

// The decoder must also accept transposed ONNX outputs [1,N,101].
const transposed=new Float32Array(channels*proposals);
for(let p=0;p<proposals;p++)for(let c=0;c<channels;c++)transposed[p*channels+c]=data[c*proposals+p];
decoded=semantic.decodePoseTensor({data:transposed,dims:[1,2,101]},transform,{minDetectionConfidence:.18,minKeypointConfidence:.2});
assert.strictEqual(decoded.proposalIndex,1);
assert.strictEqual(decoded.keypoints.filter(k=>k.visible).length,32);

// A model response below the detector threshold must never fabricate landmarks.
const weak=new Float32Array(channels);
weak[4]=.05;
decoded=semantic.decodePoseTensor({data:weak,dims:[1,101,1]},semantic.letterboxTransform(640,640,640),{minDetectionConfidence:.18});
assert.strictEqual(decoded.reason,'PITCH_NOT_CONFIDENTLY_DETECTED');
assert.deepStrictEqual(decoded.keypoints,[]);

// Off-frame / weak keypoints are kept diagnostically but marked invisible so the
// existing semantic calibration layer cannot count them as geometric evidence.
const edge=new Float32Array(channels);
edge[4]=.9;
for(let i=0;i<32;i++){
  const base=5+i*3;
  edge[base]=i===0?-20:320;
  edge[base+1]=320;
  edge[base+2]=i===1?.1:.8;
}
decoded=semantic.decodePoseTensor({data:edge,dims:[1,101,1]},semantic.letterboxTransform(640,640,640),{});
assert.strictEqual(decoded.keypoints[0].visible,false);
assert.strictEqual(decoded.keypoints[1].visible,false);
assert.strictEqual(decoded.keypoints[2].visible,true);

console.log('pitch_keypoint_onnx_provider_nonregression: PASS');
