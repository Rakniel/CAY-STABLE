const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');

const invalid=[null,undefined,'','  ',false,[],{},NaN,Infinity];
for(const value of invalid){
  assert.strictEqual(Bridge.normalizeDetection({cat:'team',x:value,y:.5},100,100),null,'invalid x rejected');
  assert.strictEqual(Bridge.normalizeDetection({cat:'team',x:.5,y:value},100,100),null,'invalid y rejected');
}
const boxes=[
  {x:null,y:2,w:5,h:5},{x:1,y:2,w:0,h:5},
  {x:1,y:2,w:-5,h:5},{x:1,y:2,w:5,h:0},
  {x:1,y:2,w:5,h:NaN},{x:undefined,y:2,w:5,h:5}
];
for(const box of boxes){
  assert.strictEqual(Bridge.boxAnchor(box),null,'malformed box rejected');
  assert.strictEqual(Bridge.normalizeDetection({cat:'team',b:box},100,100),null,'malformed box cannot create CAY track');
}
const origin=Bridge.normalizeDetection({cat:'team',x:0,y:'0.25'},100,100);
assert.ok(origin&&origin.x===0&&origin.y===.25,'real origin and numeric strings preserved');
const fallback=Bridge.normalizeDetection({cat:'team',x:null,y:null,b:{x:10,y:20,w:20,h:40}},100,100);
assert.ok(fallback&&Math.abs(fallback.x-.2)<1e-9&&Math.abs(fallback.y-.584)<1e-9,'valid bounding-box fallback preserved');
const tracker=Bridge.create();
const assigned=tracker.processFrame([...invalid.map(x=>({cat:'team',x,y:.5,score:.99})),{cat:'team',x:.4,y:.6,score:.95}],0,{width:100,height:100});
assert.strictEqual(assigned.length,1,'only valid detection assigned');
assert.strictEqual(tracker.snapshot().rosterTotal,1,'no phantom roster identities');
assert.strictEqual(tracker.snapshot().rejectedByReason.normalization_failed,invalid.length,'invalid detections audited');
console.log('stable tracking geometry guard: PASS (18 coordinates, 6 boxes, valid fallback, 1 player)');
