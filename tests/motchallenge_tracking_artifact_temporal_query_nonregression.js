'use strict';
const assert=require('assert');
const A=require('../motchallenge_tracking_artifact_adapter_v1.js');
const provenance={
  source:'TrackingLaboratory/tracklab',license:'MIT',revision:'5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2',
  weights:{source:'fixture/manual-boxes',license:'CC0-1.0',revision:'fixture-v1'}
};
const options={width:640,height:360,fps:25,provenance,classMap:{'1':'team'},analysisId:'mot-temporal-query'};
const rows=[1,2,3].map(frame=>({frame,track_id:7,bbox_ltwh:[frame*10,20,20,40],score:.95,category_id:1}));
const artifact=A.createArtifact(rows,options);
let result=A.detectionsAt(artifact,0);
assert.strictEqual(result.status,'AVAILABLE');
assert.strictEqual(result.frame,1);
result=A.detectionsAt(artifact,.02,{maxAgeSec:.03});
assert.strictEqual(result.status,'AVAILABLE');
assert.strictEqual(result.frame,1,'earlier frame must win midpoint ties');
result=A.detectionsAt(artifact,.061,{maxAgeSec:.03});
assert.strictEqual(result.status,'AVAILABLE');
assert.strictEqual(result.frame,3);
result=A.detectionsAt(artifact,.04,{maxAgeSec:0});
assert.strictEqual(result.status,'AVAILABLE');
assert.strictEqual(result.frame,2);
result=A.detectionsAt(artifact,.040001,{maxAgeSec:0});
assert.strictEqual(result.reason,'TRACKING_SAMPLE_STALE');
for(const time of [null,undefined,'',' ',NaN,Infinity,true,false,[],{},'not-a-time']){
  result=A.detectionsAt(artifact,time);
  assert.strictEqual(result.status,'INDISPONIBLE');
  assert.strictEqual(result.reason,'TRACKING_TIME_INVALID');
}
result=A.detectionsAt(artifact,5,{maxAgeSec:.04});
assert.strictEqual(result.reason,'TRACKING_SAMPLE_STALE');
result=A.detectionsAt(A.createArtifact([],options),0);
assert.strictEqual(result.reason,'TRACKING_SAMPLE_STALE');
const over=A.createArtifact(Array.from({length:12},(_,id)=>({frame:1,track_id:id,bbox_ltwh:[id*20,20,18,50],score:.9,category_id:1})),options);
assert.strictEqual(A.detectionsAt(over,0).reason,'CAY_ACTIVE_CAP_EXCEEDED');
const unclassified=A.createArtifact(rows,{...options,classMap:{}});
assert.strictEqual(A.detectionsAt(unclassified,0).detections.length,0,'no implicit CAY team assignment');
const large=A.createArtifact(Array.from({length:10000},(_,i)=>({frame:i+1,track_id:7,bbox_ltwh:[50,20,20,40],score:.9,category_id:1})),options);
for(let i=0;i<400;i++){
  const frame=(i*19)%10000+1;
  const sample=A.detectionsAt(large,(frame-1)/25,{maxAgeSec:1e-6});
  assert.strictEqual(sample.status,'AVAILABLE');
  assert.strictEqual(sample.frame,frame);
}
console.log('motchallenge temporal query non-regression: PASS');
