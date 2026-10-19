'use strict';
const assert=require('assert');
const Adapter=require('../motchallenge_tracking_artifact_adapter_v1.js');
const provenance={
  source:'CAY synthetic test fixture',license:'MIT',revision:'run92',
  weights:{source:'manual synthetic fixture',license:'CC0-1.0',revision:'run92'}
};
const options={width:640,height:360,fps:25,provenance,classMap:{cay:'team'}};
const row=(id,box,score)=>({frame:1,track_id:id,bbox_ltwh:box,score,category_id:'cay'});
const invalid=[
  row(1,[700,400,30,90],.9), // completely outside the frame
  row(2,[30,30,30,90],1.2),
  row(3,[30,30,30,90],-.2),
  row(4,[30,30,30,90],Infinity),
  row(5,[30,30,30,90],true),
  row(6,[30,30,30,90],'0.9')
];
const result=Adapter.createArtifact(invalid,options);
assert.strictEqual(result.summary.acceptedRows,0);
assert.strictEqual(result.summary.rejectedGeometry,1);
assert.strictEqual(result.summary.rejectedScore,5);
assert.strictEqual(result.summary.frameCount,0);
const valid=Adapter.createArtifact([
  row(1,[-10,30,40,90],0), // partially visible: keep
  {frame:2,track_id:1,bbox_ltwh:[30,30,40,90],score:1,category_id:'cay'}
],options);
assert.strictEqual(valid.summary.acceptedRows,2);
assert.strictEqual(valid.summary.rejectedGeometry,0);
assert.strictEqual(valid.frames.length,2);
assert.strictEqual(Adapter.detectionsAt(valid,0).status,'AVAILABLE');
assert.strictEqual(Adapter.detectionsAt(valid,0).detections.length,1);
const mot=Adapter.createArtifact('1,7,20,20,40,80,0.93,-1,-1,-1',{...options,classMap:{'':'team'}});
assert.strictEqual(mot.summary.acceptedRows,1);
const badMot=Adapter.createArtifact('1,7,20,20,40,80,Infinity,-1,-1,-1',{...options,classMap:{'':'team'}});
assert.strictEqual(badMot.summary.rejectedScore,1);
for(const bad of [
  {...options,width:Infinity},{...options,height:Infinity},{...options,fps:Infinity},
  {...options,width:0},{...options,fps:0}
]){
  assert.throws(()=>Adapter.createArtifact([],bad),/TRACKING_FRAME_GEOMETRY_REQUIRED/);
}
const overflow=Adapter.createArtifact(Array.from({length:12},(_,i)=>row(i,[i*40,30,25,90],.95)),options);
assert.strictEqual(overflow.summary.overCapacityFrames,1);
assert.strictEqual(Adapter.detectionsAt(overflow,0).reason,'CAY_ACTIVE_CAP_EXCEEDED');
assert.throws(()=>Adapter.createArtifact([row(1,[20,20,40,80],.9)],{...options,provenance:{source:'unknown',license:'AGPL-3.0',revision:'x'}}),/TRACKING_LICENSE_REJECTED/);
console.log('mot_tracking_artifact_strict_inputs_run92: PASS');
