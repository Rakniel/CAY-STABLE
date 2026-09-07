'use strict';
const assert=require('assert');
const Adapter=require('../motchallenge_tracking_artifact_adapter_v1.js');

const provenance={
  source:'TrackingLaboratory/tracklab',
  license:'MIT',
  revision:'main-audited-2026-09-08',
  weights:{source:'fixture/no-real-weights',license:'MIT',revision:'synthetic-v1'}
};

const base={width:1920,height:1080,fps:25,provenance,classMap:{'0':'team'},expectedFeatureDim:3};
const artifact=Adapter.createArtifact([
  {frame:1,track_id:7,bbox_ltwh:[100,100,60,180],score:.95,category_id:0,feature:[3,4,0]},
  {frame:2,track_id:7,bbox_ltwh:[102,100,60,180],score:.94,category_id:0,feature:[6,8,0]},
  {frame:3,track_id:7,bbox_ltwh:[104,100,60,180],score:.93,category_id:0,feature:[1,2]},
  {frame:4,track_id:7,bbox_ltwh:[106,100,60,180],score:.92,category_id:0,feature:[0,0,0]}
],base);

assert.strictEqual(artifact.policy.embeddingPolicy,'L2_NORMALIZED_EUCLIDEAN_EQUIV_COSINE');
assert.strictEqual(artifact.policy.featureDim,3);
assert.strictEqual(artifact.summary.embeddingRows,2);
assert.strictEqual(artifact.summary.rejectedFeature,2);
assert.strictEqual(artifact.summary.acceptedRows,2);

const f1=artifact.frames[0].tracks[0].detection.feature;
const f2=artifact.frames[1].tracks[0].detection.feature;
assert.ok(Math.abs(Math.hypot(...f1)-1)<1e-12);
assert.ok(Math.abs(Math.hypot(...f2)-1)<1e-12);
assert.deepStrictEqual(f1,f2,'scaled versions of the same embedding must normalize identically');
assert.ok(Math.abs(f1[0]-.6)<1e-12&&Math.abs(f1[1]-.8)<1e-12);

const passthrough=Adapter.createArtifact([
  {frame:1,track_id:1,bbox_ltwh:[0,0,20,40],score:1,category_id:0,embedding:[3,4,0]}
],{...base,normalizeEmbeddings:false});
assert.strictEqual(passthrough.policy.embeddingPolicy,'PASSTHROUGH');
assert.deepStrictEqual(passthrough.frames[0].tracks[0].detection.feature,[3,4,0]);

assert.strictEqual(Adapter.l2NormalizeFeature([0,0]),null);
assert.deepStrictEqual(Adapter.l2NormalizeFeature([0,5]),[0,1]);
console.log('mot_reid_embedding_normalization_nonregression: PASS');
