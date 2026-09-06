const assert=require('assert');
const Cleaner=require('../metric_trajectory_outlier_cleaner_v1.js');

const points=[
  {x:0,y:0,time:0,segment:1},
  {x:1,y:0,time:.25,segment:1},
  {x:20,y:0,time:.5,segment:1},
  {x:3,y:0,time:.75,segment:1},
  {x:4,y:0,time:1,segment:1}
];
const cleaned=Cleaner.clean(points,{maxSpeedKmh:55,maxGapSec:1});
assert.deepStrictEqual(cleaned.points.map(p=>p.x),[0,1,3,4]);
assert.strictEqual(cleaned.rejectedSamples,1);
assert.strictEqual(Cleaner.pathDistance(cleaned).distanceM,4);

const baselineDistance=points.slice(1).reduce((sum,b,i)=>{
  const a=points[i],speed=Cleaner.transitionSpeedKmh(a,b);
  return sum+(speed!==null&&speed<=55?Math.hypot(b.x-a.x,b.y-a.y):0);
},0);
assert.strictEqual(baselineDistance,2);

const segmentCut=Cleaner.clean([{x:0,y:0,time:0,segment:1},{x:1,y:0,time:.2,segment:2}],{});
assert.strictEqual(segmentCut.runs.length,2);
const temporalGap=Cleaner.clean([{x:0,y:0,time:0,segment:1},{x:4,y:0,time:2,segment:1}],{maxGapSec:1});
assert.strictEqual(temporalGap.runs.length,2);
const invalid=Cleaner.clean([{x:0,y:0,time:0,segment:1},null,{x:1,y:0,time:.5,segment:1}],{});
assert.strictEqual(invalid.runs.length,2);

console.log('metric trajectory outlier cleaner non-regression: OK',JSON.stringify({baselineDistanceM:baselineDistance,cleanedDistanceM:Cleaner.pathDistance(cleaned).distanceM}));
