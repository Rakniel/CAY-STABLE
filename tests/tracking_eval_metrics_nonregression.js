const assert=require('assert');
const {iou,evaluateTracking,compareTracking}=require('../tracking_eval_metrics_v1.js');
const box=(id,x)=>({id,bbox:{x1:x,y1:0,x2:x+10,y2:20}});
assert.strictEqual(iou(box('a',0),box('b',0)),1);
assert.strictEqual(iou(box('a',0),box('b',20)),0);
const truth=[
 {frame:0,truth:[box('P1',0),box('P2',30)]},
 {frame:1,truth:[box('P1',2),box('P2',32)]},
 {frame:2,truth:[box('P1',4),box('P2',34)]},
 {frame:3,truth:[box('P1',6),box('P2',36)]}
];
const baseline=truth.map((f,i)=>({frame:f.frame,truth:f.truth,predictions:[box(i<2?'T1':'T9',f.truth[0].bbox.x1),box('T2',f.truth[1].bbox.x1),...(i===1?[box('FALSE',80)]:[])]}));
const improved=truth.map(f=>({frame:f.frame,truth:f.truth,predictions:[box('T1',f.truth[0].bbox.x1),box('T2',f.truth[1].bbox.x1)]}));
const b=evaluateTracking(baseline),a=evaluateTracking(improved),cmp=compareTracking(baseline,improved);
assert.strictEqual(b.idSwitches,1);
assert.strictEqual(b.falsePositives,1);
assert.strictEqual(a.idSwitches,0);
assert.strictEqual(a.falsePositives,0);
assert.strictEqual(a.recall,1);
assert.strictEqual(a.precision,1);
assert.strictEqual(a.mota,1);
assert.ok(cmp.delta.mota>0);
assert.ok(cmp.delta.identityContinuity>0);
assert.strictEqual(cmp.delta.idSwitches,-1);
const fragmented=[
 {frame:0,truth:[box('P1',0)],predictions:[box('T1',0)]},
 {frame:1,truth:[box('P1',2)],predictions:[]},
 {frame:2,truth:[box('P1',4)],predictions:[box('T1',4)]}
];
assert.strictEqual(evaluateTracking(fragmented).fragments,1);
assert.strictEqual(evaluateTracking([]).quality,'INDISPONIBLE');
console.log('tracking_eval_metrics_nonregression: PASS');
