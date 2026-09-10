'use strict';
const assert=require('assert');
const Smoother=require('../metric_trajectory_smoother_v1.js');
const PlayerStats=require('../player_stats_v1.js');

assert.strictEqual(Smoother.insidePitch({x:0,y:0}),true,'pitch origin must remain valid');
assert.strictEqual(Smoother.insidePitch({x:105,y:68}),true,'pitch far corner must remain valid');
assert.strictEqual(Smoother.insidePitch({x:105.001,y:34}),false,'x beyond pitch length must be rejected');
assert.strictEqual(Smoother.insidePitch({x:52.5,y:-0.001}),false,'negative y must be rejected');

const source=[
  {x:10,y:20,time:0,segment:0},
  {x:106,y:20,time:1,segment:0},
  {x:11,y:20,time:2,segment:0}
];
const smooth=Smoother.smoothSeries(source);
assert.strictEqual(smooth.rejectedOutsidePitchSamples,1,'one out-of-pitch sample must be explicitly rejected');
assert.strictEqual(smooth.points[1],null,'out-of-pitch sample must not reach metric consumers');
assert.strictEqual(smooth.usableSamples,2,'only in-pitch samples remain usable');

const distance=Smoother.pathDistance(source);
assert.strictEqual(distance.distanceM,0,'no distance may bridge through an out-of-pitch projection');
assert.strictEqual(distance.pairs,0,'no physical pair is valid in this adversarial sequence');
assert.strictEqual(distance.outsidePitchRejectedPairs,2,'both adjacent pairs touching the bad projection must be rejected');

const track={fullPath:[
  {x:.1,y:.2,time:0,segment:0,metricX:10,metricY:20},
  {x:.2,y:.2,time:1,segment:0,metricX:106,metricY:20},
  {x:.3,y:.2,time:2,segment:0,metricX:11,metricY:20}
]};
const projectors={0:{validated:true,confidence:.95,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};
const metric=PlayerStats.metricForTrack(track,projectors);
assert.strictEqual(metric.eligibleSeconds,2,'source chronology stays visible in the denominator');
assert.strictEqual(metric.metricCoveredSeconds,0,'out-of-pitch projection must break metric continuity');
assert.strictEqual(metric.metricCoverage,0,'physical metric coverage must become zero when both intervals touch the invalid point');
assert.strictEqual(metric.distanceM,null,'distance must be INDISPONIBLE instead of fabricated');
assert.strictEqual(metric.maxSpeedKmh,null,'speed must be INDISPONIBLE instead of fabricated');
assert.strictEqual(metric.sprintCount,null,'sprints must be INDISPONIBLE instead of fabricated');

console.log('metric pitch bounds physical stats non-regression: OK');
