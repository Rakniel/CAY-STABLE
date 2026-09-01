const assert=require('assert');
const {evaluateIdentityEpisodes,compareIdentityEpisodes}=require('../tracking_identity_episode_eval_v1.js');
const box=(id,x)=>({id,bbox:{x1:x,y1:0,x2:x+10,y2:20}});

const perfect=[
 {frame:0,segmentId:'A',truth:[box('P1',0)],predictions:[box('T1',0)]},
 {frame:1,segmentId:'A',truth:[box('P1',1)],predictions:[]},
 {frame:2,segmentId:'A',truth:[box('P1',2)],predictions:[]},
 {frame:3,segmentId:'A',truth:[box('P1',3)],predictions:[box('T1',3)]},
 {frame:12,segmentId:'B',truth:[box('P1',5)],predictions:[box('T1',5)]}
];
const broken=[
 {frame:0,segmentId:'A',truth:[box('P1',0)],predictions:[box('T1',0)]},
 {frame:1,segmentId:'A',truth:[box('P1',1)],predictions:[]},
 {frame:2,segmentId:'A',truth:[box('P1',2)],predictions:[]},
 {frame:3,segmentId:'A',truth:[box('P1',3)],predictions:[box('T9',3)]},
 {frame:12,segmentId:'B',truth:[box('P1',5)],predictions:[box('T8',5)]}
];
const a=evaluateIdentityEpisodes(perfect,{minLongGapFrames:8});
assert.strictEqual(a.quality,'EVALUABLE');
assert.strictEqual(a.reidAttempts,2);
assert.strictEqual(a.reidRecoveredSameId,2);
assert.strictEqual(a.reidRecoveryRate,1);
assert.strictEqual(a.crossSegmentAttempts,1);
assert.strictEqual(a.crossSegmentRecoveryRate,1);
assert.strictEqual(a.longGapAttempts,1);
assert.strictEqual(a.longGapRecoveryRate,1);

const b=evaluateIdentityEpisodes(broken,{minLongGapFrames:8});
assert.strictEqual(b.reidAttempts,2);
assert.strictEqual(b.reidRecoveredSameId,0);
assert.strictEqual(b.failedReidentifications,2);
assert.strictEqual(b.crossSegmentRecoveryRate,0);
const cmp=compareIdentityEpisodes(broken,perfect,{minLongGapFrames:8});
assert.ok(cmp.delta.reidRecoveryRate>0);
assert.ok(cmp.delta.longGapRecoveryRate>0);
assert.ok(cmp.delta.crossSegmentRecoveryRate>0);
assert.strictEqual(cmp.delta.failedReidentifications,-2);

const noOpportunity=evaluateIdentityEpisodes([
 {frame:0,truth:[box('P1',0)],predictions:[box('T1',0)]},
 {frame:1,truth:[box('P1',1)],predictions:[box('T1',1)]}
]);
assert.strictEqual(noOpportunity.quality,'INDISPONIBLE');
assert.strictEqual(noOpportunity.reason,'no_reidentification_opportunity');
console.log('tracking_identity_episode_eval_nonregression: PASS');
