const assert=require('assert');
const A=require('../motchallenge_tracking_artifact_adapter_v1.js');

const provenance={
  source:'TrackingLaboratory/tracklab',license:'MIT',revision:'5767e86c32a6d6c68e2fc8ae7311f558fff6c7b2',
  weights:{source:'fixture/manual-boxes',license:'CC0-1.0',revision:'fixture-v1'}
};
const mot=[
  '1,10,100,50,40,120,0.95,-1,-1,-1',
  '1,11,300,60,40,120,0.90,-1,-1,-1',
  '2,10,110,50,40,120,0.94,-1,-1,-1'
].join('\n');
const artifact=A.createArtifact(mot,{width:640,height:360,fps:25,provenance,classMap:{'':'team'},analysisId:'fixture'});
assert.strictEqual(artifact.version,'CAY_MOT_TRACKING_ARTIFACT_V1');
assert.strictEqual(artifact.descriptor.stage,'tracking_v1');
assert.strictEqual(artifact.summary.acceptedRows,3);
assert.strictEqual(artifact.summary.overCapacityFrames,0);
assert.strictEqual(artifact.frames[0].tracks[0].anchor.x,120/640);
assert.strictEqual(artifact.frames[0].tracks[0].anchor.y,170/360);
let q=A.detectionsAt(artifact,0,{maxAgeSec:.03});
assert.strictEqual(q.status,'AVAILABLE');
assert.strictEqual(q.detections.length,2);
assert.strictEqual(q.detections[0].sourceTrackId,10);
q=A.detectionsAt(artifact,.2,{maxAgeSec:.03});
assert.strictEqual(q.status,'INDISPONIBLE');
assert.strictEqual(q.reason,'TRACKING_SAMPLE_STALE');

const rows=[];
for(let i=0;i<12;i++)rows.push({frame:1,track_id:i,bbox_ltwh:[i*10,10,8,20],score:.9,category_id:'cay'});
const over=A.createArtifact(rows,{width:640,height:360,fps:25,provenance,classMap:{cay:'team'}});
assert.strictEqual(over.frames[0].cayEligible,false);
q=A.detectionsAt(over,0,{maxAgeSec:.03});
assert.strictEqual(q.status,'INDISPONIBLE');
assert.strictEqual(q.reason,'CAY_ACTIVE_CAP_EXCEEDED');

const tracklab=A.createArtifact([{frame:1,track_id:44,bbox_ltwh:[20,30,50,100],bbox_conf:.88,category_id:7,person_id:12,embedding:[.1,.2,.3]}],{width:640,height:360,fps:25,provenance,classMap:{'7':'goalkeeper'}});
assert.strictEqual(tracklab.frames[0].tracks[0].personId,12);
const feature=tracklab.frames[0].tracks[0].detection.feature;
const norm=Math.hypot(.1,.2,.3);
assert.strictEqual(feature.length,3);
for(let i=0;i<feature.length;i++) assert.ok(Math.abs(feature[i]-[.1,.2,.3][i]/norm)<1e-12);
assert.ok(Math.abs(Math.hypot(...feature)-1)<1e-12);
assert.strictEqual(tracklab.frames[0].tracks[0].cat,'goalkeeper');

assert.throws(()=>A.createArtifact(mot,{width:640,height:360,fps:25,provenance:{source:'bad',license:'AGPL-3.0',revision:'x',weights:{source:'x',license:'MIT',revision:'x'}}}),/TRACKING_LICENSE_REJECTED/);
assert.throws(()=>A.createArtifact(mot,{width:640,height:360,fps:25,provenance:{source:'ok',license:'MIT',revision:'x'}}),/TRACKING_WEIGHT_PROVENANCE_REQUIRED/);
assert.throws(()=>A.createArtifact(mot,{width:640,height:360,fps:25,provenance:{source:'ok',license:'MIT',revision:'x',weights:{source:'bad-model',license:'GPL-3.0',revision:'x'}}}),/TRACKING_WEIGHT_LICENSE_REJECTED/);

console.log('motchallenge_tracking_artifact_nonregression: PASS');
