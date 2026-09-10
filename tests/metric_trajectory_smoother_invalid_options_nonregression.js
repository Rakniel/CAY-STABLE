'use strict';
const assert=require('assert');
const Smoother=require('../metric_trajectory_smoother_v1.js');

const linearIrregular=[
  {time:0,segment:1,x:0,y:0},
  {time:.1,segment:1,x:.1,y:0},
  {time:.2,segment:1,x:.2,y:0},
  {time:.3,segment:1,x:.3,y:0},
  {time:1,segment:1,x:1,y:0}
];

// Infinity must not disable the irregular-sampling guard.
const spacingInfinity=Smoother.smoothSeries(linearIrregular,{maxSpacingRatio:Infinity});
assert.strictEqual(spacingInfinity.smoothedSamples,0,'Infinity must restore the STABLE spacing-ratio guard');
const spacingExplicit=Smoother.smoothSeries(linearIrregular,{maxSpacingRatio:10});
assert.strictEqual(spacingExplicit.smoothedSamples,1,'a finite explicit spacing override remains supported');

const abruptSpeed=[
  {time:0,segment:1,x:0,y:0},
  {time:.2,segment:1,x:.2,y:0},
  {time:.4,segment:1,x:.4,y:0},
  {time:.6,segment:1,x:1.4,y:0},
  {time:.8,segment:1,x:1.6,y:0}
];

// Infinity must not disable the abrupt-speed-change guard.
const speedRatioInfinity=Smoother.smoothSeries(abruptSpeed,{maxSpeedRatio:Infinity});
assert.strictEqual(speedRatioInfinity.smoothedSamples,0,'Infinity must restore the STABLE speed-ratio guard');
const speedRatioExplicit=Smoother.smoothSeries(abruptSpeed,{maxSpeedRatio:10});
assert.strictEqual(speedRatioExplicit.smoothedSamples,1,'a finite explicit speed-ratio override remains supported');

// An infinite floor used to skip the speed-ratio check entirely.
const floorInfinity=Smoother.smoothSeries(abruptSpeed,{speedRatioFloorMps:Infinity});
assert.strictEqual(floorInfinity.smoothedSamples,0,'Infinity must restore the STABLE speed-ratio floor');
const floorExplicit=Smoother.smoothSeries(abruptSpeed,{speedRatioFloorMps:10});
assert.strictEqual(floorExplicit.smoothedSamples,1,'a finite explicit floor override remains supported');

const longGap=[
  {time:0,segment:1,x:0,y:0},
  {time:.25,segment:1,x:.25,y:0},
  {time:.5,segment:1,x:.5,y:0},
  {time:.75,segment:1,x:.75,y:0},
  {time:2,segment:1,x:2,y:0}
];
const gapInfinity=Smoother.smoothSeries(longGap,{maxGapSec:Infinity,maxSpacingRatio:10});
assert.strictEqual(gapInfinity.smoothedSamples,0,'Infinity must restore the 1s STABLE smoothing gap guard');
const gapExplicit=Smoother.smoothSeries(longGap,{maxGapSec:2,maxSpacingRatio:10});
assert.strictEqual(gapExplicit.smoothedSamples,1,'a finite explicit gap override remains supported');

console.log('metric trajectory smoother invalid options non-regression: PASS');
