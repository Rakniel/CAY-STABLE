'use strict';
const assert=require('assert');
const Smoother=require('../metric_trajectory_smoother_v1.js');
const PlayerStats=require('../player_stats_v1.js');

assert.strictEqual(Smoother.insidePitch({x:0,y:0}),true,'pitch origin must remain valid');
assert.strictEqual(Smoother.insidePitch({x:105,y:68}),true,'pitch far corner must remain valid');
assert.strictEqual(Smoother.insidePitch({x:105.001,y:34}),false,'x beyond pitch length must be rejected');
assert.strictEqual(Smoother.insidePitch({x:52.5,y:-0.001}),false,'negative y must be rejected');

// Low-speed near-touchline drift: this is deliberately below all speed vetoes.
// Without an explicit pitch-bound guard the two intervals would contribute 1.7 m.
const source=[
  {x:104.5,y:20,time:0,segment:0},
  {x:105.5,y:20,time:1,segment:0},
  {x:104.8,y:20,time:2,segment:0}
];
const legacyUnguardedDistance=Math.hypot(source[1].x-source[0].x,source[1].y-source[0].y)+Math.hypot(source[2].x-source[1].x,source[2].y-source[1].y);
assert.strictEqual(+legacyUnguardedDistance.toFixed(2),1.7,'fixture must represent a plausible low-speed false distance before the pitch-bound guard');
const smooth=Smoother.smoothSeries(source);
assert.strictEqual(smooth.rejectedOutsidePitchSamples,1,'one out-of-pitch sample must be explicitly rejected');
assert.strictEqual(smooth.points[1],null,'out-of-pitch sample must not reach metric consumers');
assert.strictEqual(smooth.usableSamples,2,'only in-pitch samples remain usable');

const distance=Smoother.pathDistance(source);
assert.strictEqual(distance.distanceM,0,'no distance may bridge through an out-of-pitch projection');
assert.strictEqual(distance.pairs,0,'no physical pair is valid in this adversarial sequence');
assert.strictEqual(distance.outsidePitchRejectedPairs,2,'both adjacent pairs touching the bad projection must be rejected');

const track={fullPath:[
  {x:.1,y:.2,time:0,segment:0,metricX:104.5,metricY:20},
  {x:.2,y:.2,time:1,segment:0,metricX:105.5,metricY:20},
  {x:.3,y:.2,time:2,segment:0,metricX:104.8,metricY:20}
]};
const projectors={0:{validated:true,confidence:.95,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};
const metric=PlayerStats.metricForTrack(track,projectors);
assert.strictEqual(metric.eligibleSeconds,2,'source chronology stays visible in the denominator');
assert.strictEqual(metric.metricCoveredSeconds,0,'out-of-pitch projection must break metric continuity');
assert.strictEqual(metric.metricCoverage,0,'physical metric coverage must become zero when both intervals touch the invalid point');
assert.strictEqual(metric.distanceM,null,'distance must be INDISPONIBLE instead of fabricated');
assert.strictEqual(metric.maxSpeedKmh,null,'speed must be INDISPONIBLE instead of fabricated');
assert.strictEqual(metric.sprintCount,null,'sprints must be INDISPONIBLE instead of fabricated');

// A validated larger pitch must not be silently forced back to the historical 105x68 default.
const largePitchTrack={fullPath:[
  {x:.1,y:.2,time:0,segment:0,metricX:106,metricY:69},
  {x:.2,y:.2,time:1,segment:0,metricX:108,metricY:69}
]};
const largePitchProjectors={0:{validated:true,confidence:.95,source:'TEST_110x70',pitch:{lengthM:110,widthM:70},project:p=>({x:p.metricX,y:p.metricY})}};
const largePitchMetric=PlayerStats.metricForTrack(largePitchTrack,largePitchProjectors);
assert.strictEqual(largePitchMetric.metricCoverage,1,'projector-specific 110x70 geometry must preserve valid metric coverage');
assert.strictEqual(largePitchMetric.metricCoveredSeconds,1,'the valid interval must remain measurable');
assert.strictEqual(largePitchMetric.distanceM,2,'distance on the validated larger pitch must remain measurable');
assert.strictEqual(largePitchMetric.avgSpeedKmh,7.2,'speed on the validated larger pitch must remain measurable');
assert.strictEqual(largePitchMetric.quality,'FIABLE','complete valid coverage on the larger pitch must remain reliable');

// The exact same coordinates must remain unavailable on a standard 105x68 projector.
const standardPitchProjectors={0:{validated:true,confidence:.95,source:'TEST_105x68',pitch:{lengthM:105,widthM:68},project:p=>({x:p.metricX,y:p.metricY})}};
const standardPitchMetric=PlayerStats.metricForTrack(largePitchTrack,standardPitchProjectors);
assert.strictEqual(standardPitchMetric.metricCoverage,0,'coordinates outside the projector pitch must be rejected');
assert.strictEqual(standardPitchMetric.distanceM,null,'out-of-pitch distance must stay unavailable');
assert.strictEqual(standardPitchMetric.avgSpeedKmh,null,'out-of-pitch speed must stay unavailable');

const info=PlayerStats.metricProjectorInfo(largePitchProjectors[0]);
assert.strictEqual(info.pitchLengthM,110,'player stats projector metadata must preserve pitch length');
assert.strictEqual(info.pitchWidthM,70,'player stats projector metadata must preserve pitch width');

console.log('metric pitch bounds physical stats non-regression: OK');
