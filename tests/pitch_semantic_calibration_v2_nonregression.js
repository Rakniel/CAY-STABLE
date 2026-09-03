'use strict';

const assert=require('assert');
const V2=require('../pitch_semantic_calibration_v2.js');

assert.strictEqual(V2.KEYPOINT_COUNT,32);
const vertices=V2.canonicalVertices({lengthM:105,widthM:68});
assert.strictEqual(vertices.length,32);
assert.deepStrictEqual(vertices[0],{x:0,y:0});
assert.deepStrictEqual(vertices[29],{x:105,y:68});
assert(Math.abs(vertices[13].x-52.5)<1e-9&&vertices[13].y===0);

const frameSize={width:1050,height:680};
const keypoints=vertices.map((p,index)=>({index,x:p.x*10,y:p.y*10,confidence:.95,visible:true}));
const correspondences=V2.buildCorrespondences(keypoints,{frameSize,minConfidence:.5,lengthM:105,widthM:68});
assert.strictEqual(correspondences.length,32);
assert.strictEqual(correspondences[0].feature,'PITCH_KEYPOINT_01');

const accepted=V2.evaluate({keypoints,frameSize,minConfidence:.5,lengthM:105,widthM:68});
assert.strictEqual(accepted.status,'ACCEPTED_AUTOMATIC',JSON.stringify(accepted));
assert.strictEqual(accepted.calibrationInput,'SEMANTIC_PITCH_KEYPOINTS');
assert.strictEqual(accepted.legacyFreePolygonUsed,false);
assert(accepted.visibleKeypoints>=6);

const weak=V2.evaluate({keypoints:keypoints.slice(0,5),frameSize,minConfidence:.5,lengthM:105,widthM:68});
assert.strictEqual(weak.status,'INSUFFICIENT_EVIDENCE');
assert.strictEqual(weak.reason,'PITCH_KEYPOINTS_NEED_SIX_VISIBLE');

const lowConfidence=keypoints.map((p,i)=>({...p,confidence:i<6?.3:.95}));
const filtered=V2.buildCorrespondences(lowConfidence,{frameSize,minConfidence:.5});
assert.strictEqual(filtered.length,26);

console.log('pitch semantic calibration v2 non-regression: PASS');
