const assert=require('assert');
const A=require('../motchallenge_tracking_artifact_adapter_v1.js');

const provenance={source:'synthetic-mot-fixture',license:'MIT',revision:'fixture-v1'};
const rows=[
  {frame:1,track_id:7,bbox_ltwh:[100,50,40,120],score:.95,category_id:'player'},
  {frame:1,track_id:99,bbox_ltwh:[300,200,20,20],score:.9,category_id:'ball'}
];
const artifact=A.createArtifact(rows,{
  width:640,height:360,fps:25,frameBase:1,
  provenance,requireWeightProvenance:false,
  classMap:{player:'team',ball:'ball'}
});

const player=artifact.frames[0].tracks.find(t=>t.sourceTrackId===7);
const ball=artifact.frames[0].tracks.find(t=>t.sourceTrackId===99);
assert(player&&ball);
assert.strictEqual(player.anchor.kind,'bbox_bottom_center');
assert.strictEqual(player.detection.anchorKind,'bbox_bottom_center');
assert.ok(Math.abs(player.anchor.x-120/640)<1e-12);
assert.ok(Math.abs(player.anchor.y-170/360)<1e-12);
assert.strictEqual(ball.anchor.kind,'bbox_center');
assert.ok(Math.abs(ball.anchor.x-310/640)<1e-12);
assert.ok(Math.abs(ball.anchor.y-210/360)<1e-12);
assert.strictEqual(artifact.policy.metricAnchorPolicy,'PERSON_BOTTOM_CENTER_BALL_CENTER');

const q=A.detectionsAt(artifact,0,{maxAgeSec:.01});
assert.strictEqual(q.status,'AVAILABLE');
assert.strictEqual(q.detections.length,1);
assert.strictEqual(q.detections[0].anchorKind,'bbox_bottom_center');
assert.ok(Math.abs(q.detections[0].y-170/360)<1e-12);

console.log('mot_metric_anchor_nonregression: PASS');
