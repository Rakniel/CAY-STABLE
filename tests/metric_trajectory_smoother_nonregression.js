const assert=require('assert');
const S=require('../metric_trajectory_smoother_v1.js');
const jitter=Array.from({length:7},(_,i)=>({x:i,y:i%2?-.3:.3,time:i,segment:1}));
const raw=S.pathDistance(jitter);
const sm=S.smoothSeries(jitter);
const smoothDistance=S.pathDistance(sm.points);
assert.strictEqual(sm.method,'SAVITZKY_GOLAY_5_POINT_QUADRATIC_FIXED_COEFFICIENTS');
assert.ok(sm.smoothedSamples>=3,'interior samples should be smoothed');
assert.ok(smoothDistance.distanceM<raw.distanceM*.97,'high-frequency jitter should not inflate travelled distance');

const linear=Array.from({length:7},(_,i)=>({x:i,y:2*i,time:i*.5,segment:1}));
const linearRaw=S.pathDistance(linear),linearSm=S.pathDistance(S.smoothSeries(linear).points);
assert.ok(Math.abs(linearRaw.distanceM-linearSm.distanceM)<1e-6,'linear motion must be preserved');

const abrupt=[
 {x:0,y:0,time:0,segment:1},{x:3.5,y:0,time:.5,segment:1},{x:7,y:0,time:1,segment:1},
 {x:8,y:0,time:1.5,segment:1},{x:11.5,y:0,time:2,segment:1},{x:15,y:0,time:2.5,segment:1}
];
assert.strictEqual(S.smoothSeries(abrupt).smoothedSamples,0,'abrupt sprint/recovery pace changes must remain unsmoothed');

const cut=[
 {x:0,y:0,time:0,segment:1},{x:1,y:.2,time:.2,segment:1},{x:2,y:0,time:.4,segment:1},
 {x:20,y:10,time:.6,segment:2},{x:21,y:10.2,time:.8,segment:2},{x:22,y:10,time:1,segment:2}
];
const cutSm=S.smoothSeries(cut);
assert.strictEqual(cutSm.smoothedSamples,0,'no smoothing window may cross a camera/segment cut');
assert.deepStrictEqual(cutSm.points.map(p=>[p.x,p.y]),cut.map(p=>[p.x,p.y]));

const irregular=[
 {x:0,y:0,time:0,segment:1},{x:1,y:.2,time:.1,segment:1},{x:2,y:0,time:.2,segment:1},{x:3,y:.2,time:.9,segment:1},{x:4,y:0,time:1,segment:1}
];
assert.strictEqual(S.smoothSeries(irregular).smoothedSamples,0,'irregular timing must disable local smoothing');
console.log('metric_trajectory_smoother_nonregression: PASS');
