'use strict';
const assert=require('assert');
const api=require('../pitch_keypoint_artifact_provider_v1.js');

assert.strictEqual(api.VERSION,'CAY_PITCH_KEYPOINT_ARTIFACT_V1');
assert.strictEqual(api.validateArtifact(null).ok,false);
assert.strictEqual(api.validateArtifact({contractVersion:api.VERSION}).reason,'PITCH_KEYPOINT_ARTIFACT_PROVENANCE_REQUIRED');

const base={
  contractVersion:api.VERSION,
  providerId:'mobile-calibration-export',
  provenance:{source:'cay-mobile/permissive-keypoints',license:'Apache-2.0',revision:'r1'},
  coordinateSpace:'NORMALIZED_0_1',
  maxSampleAgeSec:.25,
  minConfidence:.6,
  frames:[
    {time:1,segment:0,keypoints:[0,1,2,3,4,5].map(i=>({index:i,x:.1+i*.05,y:.2+i*.03,confidence:.9}))},
    {time:2,segment:1,keypoints:[0,1,2,3,4,5].map(i=>({index:i,x:.2+i*.05,y:.3+i*.03,confidence:.9}))}
  ]
};
assert.strictEqual(api.validateArtifact(base).ok,true);
const p=api.createProvider(base);
assert.strictEqual(p.runtimeDefaultAllowed,true);
assert.strictEqual(p.maxCalibrationAgeSec,.25);
assert.strictEqual(p.minConfidence,.6);
assert.strictEqual(p.keypointIndexMapping,null);

(async()=>{
  let r=await p.inferPitchKeypoints({width:1000,height:500},{time:1.1,segment:0,width:1000,height:500});
  assert.strictEqual(r.keypoints.length,6);
  assert.strictEqual(r.keypoints[0].x,100);
  assert.strictEqual(r.keypoints[0].y,100);
  assert.strictEqual(r.keypoints[0].sourceIndex,0);
  assert.ok(Math.abs(r.sampleAgeSec-.1)<1e-9);

  r=await p.inferPitchKeypoints({width:1000,height:500},{time:1.5,segment:0,width:1000,height:500});
  assert.deepStrictEqual(r.keypoints,[],'stale samples must not be reused across a gap');
  assert.strictEqual(r.reason,'PITCH_KEYPOINT_ARTIFACT_SAMPLE_UNAVAILABLE');

  r=await p.inferPitchKeypoints({width:1000,height:500},{time:1,segment:1,width:1000,height:500});
  assert.deepStrictEqual(r.keypoints,[],'segment isolation must prevent cross-plan calibration reuse');

  assert.throws(()=>api.createProvider({...base,provenance:{source:'bad',license:'AGPL-3.0',revision:'r1'}}),/LICENSE_REJECTED/);
  assert.throws(()=>api.createProvider({...base,provenance:{source:'missing',license:'MIT'}}),/PROVENANCE_REQUIRED/);
  assert.throws(()=>api.createProvider({...base,frames:[base.frames[1],base.frames[0]]}),/FRAMES_NOT_SORTED/);

  const low={...base,frames:[{time:1,segment:0,keypoints:[
    {index:0,x:.1,y:.2,confidence:.9},{index:0,x:.2,y:.3,confidence:.95},
    {index:1,x:1.2,y:.2,confidence:.9},{index:2,x:.2,y:.3,confidence:.4}
  ]}]};
  const lowProvider=api.createProvider(low);
  r=await lowProvider.inferPitchKeypoints({width:1000,height:500},{time:1,segment:0,width:1000,height:500});
  assert.deepStrictEqual(r.keypoints.map(k=>k.index),[0],'duplicates, out-of-range points and low confidence must be rejected');

  const mapped={
    ...base,
    providerId:'external-33-keypoint-model',
    keypointIndexMap:{0:3,7:9,32:31},
    frames:[{time:1,segment:0,keypoints:[
      {index:0,x:.10,y:.20,confidence:.90},
      {index:7,x:.30,y:.40,confidence:.91},
      {index:32,x:.50,y:.60,confidence:.92},
      {index:12,x:.70,y:.80,confidence:.99}
    ]}]
  };
  assert.strictEqual(api.validateArtifact(mapped).ok,true);
  const mappedProvider=api.createProvider(mapped);
  assert.deepStrictEqual(mappedProvider.keypointIndexMapping,{'0':3,'7':9,'32':31});
  r=await mappedProvider.inferPitchKeypoints({width:1000,height:500},{time:1,segment:0,width:1000,height:500});
  assert.deepStrictEqual(r.keypoints.map(k=>k.index),[3,9,31],'only explicitly mapped foreign indices may enter CAY semantic calibration');
  assert.deepStrictEqual(r.keypoints.map(k=>k.sourceIndex),[0,7,32]);
  assert.deepStrictEqual(r.keypoints.map(k=>k.x),[100,300,500]);

  const ambiguous={...mapped,keypointIndexMap:{0:3,1:3}};
  assert.strictEqual(api.validateArtifact(ambiguous).reason,'PITCH_KEYPOINT_INDEX_MAP_AMBIGUOUS');
  assert.throws(()=>api.createProvider(ambiguous),/INDEX_MAP_AMBIGUOUS/);
  assert.strictEqual(api.validateArtifact({...mapped,keypointIndexMap:{32:99}}).reason,'PITCH_KEYPOINT_INDEX_MAP_INVALID');
  assert.strictEqual(api.validateArtifact({...mapped,keypointIndexMap:{}}).reason,'PITCH_KEYPOINT_INDEX_MAP_EMPTY');

  console.log('pitch_keypoint_artifact_provider_nonregression: PASS');
})().catch(err=>{console.error(err);process.exitCode=1;});