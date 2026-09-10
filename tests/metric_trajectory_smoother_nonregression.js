const assert=require('assert');
const S=require('../metric_trajectory_smoother_v1.js');
const jitter=Array.from({length:7},(_,i)=>({x:i,y:i%2?33.7:34.3,time:i,segment:1}));
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

// Same-segment tracking blackouts must never be interpreted as travelled distance.
const blackout=[
 {x:0,y:0,time:0,segment:1},
 {x:1,y:0,time:.5,segment:1},
 {x:31,y:0,time:5,segment:1},
 {x:32,y:0,time:5.5,segment:1}
];
const blackoutDistance=S.pathDistance(blackout);
assert.strictEqual(blackoutDistance.distanceM,2,'30m across a 4.5s blackout must not be invented');
assert.strictEqual(blackoutDistance.seconds,1,'blackout time must not become observed movement time');
assert.strictEqual(blackoutDistance.pairs,2);
assert.strictEqual(blackoutDistance.gapRejectedPairs,1);
assert.strictEqual(blackoutDistance.gapRejectedSeconds,4.5);
assert.strictEqual(blackoutDistance.maxGapSec,1);
assert.match(blackoutDistance.policy,/GAP_TEMPOREL/);

// Invalid overrides must fail closed to the STABLE 1s blackout guard, never disable it.
for(const invalidGap of [-1,0,'','   ',null,undefined,NaN,Infinity]){
  const guarded=S.pathDistance(blackout,{maxGapSec:invalidGap});
  assert.strictEqual(guarded.maxGapSec,1,`invalid maxGapSec ${String(invalidGap)} must restore the STABLE default`);
  assert.strictEqual(guarded.distanceM,2,`invalid maxGapSec ${String(invalidGap)} must not invent blackout travel`);
  assert.strictEqual(guarded.gapRejectedPairs,1,`invalid maxGapSec ${String(invalidGap)} must keep the blackout cut`);
}
const explicitGap=S.pathDistance(blackout,{maxGapSec:5});
assert.strictEqual(explicitGap.maxGapSec,5,'a valid positive override remains supported');
assert.strictEqual(explicitGap.gapRejectedPairs,0,'a valid wider gap may intentionally include that interval');
assert.strictEqual(explicitGap.distanceM,32,'valid override behavior remains explicit and auditable');

// Blank coordinate/time strings are missing evidence, never numeric zero.
const blankCoordinate=S.pathDistance([
 {x:0,y:0,time:0,segment:1},
 {x:'   ',y:0,time:.5,segment:1},
 {x:2,y:0,time:1,segment:1}
]);
assert.strictEqual(blankCoordinate.distanceM,0,'blank coordinate must not become x=0 and create metric distance');
assert.strictEqual(blankCoordinate.seconds,0,'blank coordinate must reject adjacent metric intervals');
assert.strictEqual(blankCoordinate.pairs,0);

const blankTime=S.pathDistance([
 {x:0,y:0,time:0,segment:1},
 {x:1,y:0,time:'\t ',segment:1},
 {x:2,y:0,time:1,segment:1}
]);
assert.strictEqual(blankTime.distanceM,0,'blank timestamp must not become t=0 and create metric distance');
assert.strictEqual(blankTime.seconds,0,'blank timestamp must reject adjacent metric intervals');
assert.strictEqual(blankTime.pairs,0);

const smoothingWithBlank=Array.from({length:7},(_,i)=>({x:i,y:0,time:i*.5,segment:1}));
smoothingWithBlank[3]={...smoothingWithBlank[3],x:'   '};
assert.strictEqual(S.smoothSeries(smoothingWithBlank).smoothedSamples,0,'blank samples must invalidate every local smoothing window that touches them');

console.log('metric_trajectory_smoother_nonregression: PASS');
