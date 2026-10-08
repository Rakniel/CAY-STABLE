'use strict';
const assert=require('assert');
const Adapter=require('../motchallenge_tracking_artifact_adapter_v1.js');
const provenance={
  source:'CAY synthetic test fixture',license:'MIT',revision:'offimage-fixture-v1',
  weights:{source:'manual synthetic boxes',license:'CC0-1.0',revision:'offimage-fixture-v1'}
};
const options={width:640,height:360,fps:25,provenance,classMap:{cay:'team',ball:'ball'}};
const cases=[
  {name:'right of image',box:[700,20,20,40],cat:'cay',accepted:0},
  {name:'left of image',box:[-80,20,20,40],cat:'cay',accepted:0},
  {name:'below image',box:[100,400,20,40],cat:'cay',accepted:0},
  {name:'above image',box:[100,-120,20,40],cat:'cay',accepted:0},
  {name:'partially clipped with foot outside',box:[630,20,40,40],cat:'cay',accepted:0},
  {name:'partially clipped with foot on left boundary',box:[-10,20,20,40],cat:'cay',accepted:1},
  {name:'foot on right boundary',box:[630,20,20,40],cat:'cay',accepted:1},
  {name:'ordinary player',box:[100,20,20,40],cat:'cay',accepted:1},
  {name:'ball centre off image',box:[650,30,20,20],cat:'ball',accepted:0},
  {name:'ball centre on image',box:[100,30,20,20],cat:'ball',accepted:1}
];
for(const c of cases){
  const artifact=Adapter.createArtifact([{frame:1,track_id:7,bbox_ltwh:c.box,score:.9,category_id:c.cat}],options);
  assert.strictEqual(artifact.summary.acceptedRows,c.accepted,c.name);
  assert.strictEqual(artifact.summary.rejectedGeometry,1-c.accepted,c.name+' audit');
  assert.strictEqual(Adapter.detectionsAt(artifact,0).detections.length,c.cat==='ball'?0:c.accepted,c.name+' team query');
}
assert.strictEqual(Adapter.metricAnchorForBox(700,20,20,40,'team',640,360),null);
assert.strictEqual(Adapter.metricAnchorForBox(-10,20,20,40,'team',640,360).x,0);
for(const field of ['width','height','fps']){
  for(const invalid of [Infinity,-Infinity,NaN]){
    assert.throws(()=>Adapter.createArtifact([],{...options,[field]:invalid}),/TRACKING_FRAME_GEOMETRY_REQUIRED/);
  }
}
const rows=Array.from({length:12},(_,i)=>({frame:1,track_id:i,bbox_ltwh:[700+i*10,30,10,20],score:.9,category_id:'cay'}));
rows.push({frame:1,track_id:99,bbox_ltwh:[100,30,10,20],score:.9,category_id:'cay'});
const mixed=Adapter.createArtifact(rows,options);
assert.strictEqual(mixed.summary.rejectedGeometry,12);
assert.strictEqual(mixed.summary.acceptedRows,1);
assert.strictEqual(mixed.frames[0].cayEligible,true,'offscreen false CAY must not trip 11-player cap');
assert.strictEqual(Adapter.detectionsAt(mixed,0).detections.length,1);
console.log('mot_offimage_anchor_nonregression: PASS');
