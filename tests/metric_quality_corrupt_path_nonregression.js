'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const projectors={1:{validated:true,confidence:1,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};

// A corrupt sample must cut continuity instead of crashing or bridging metric distance.
const corrupt={fullPath:[
  {time:0,segment:1,metricX:10,metricY:20},
  null,
  {time:2,segment:1,metricX:12,metricY:20},
  {time:3,segment:1,metricX:13,metricY:20}
]};
let metric;
assert.doesNotThrow(()=>{metric=Guard.robustMetricForTrack(corrupt,projectors);},'robust metric publication must tolerate a null trajectory sample');
assert.equal(metric.rejectedInvalidPathSamples,1,'the corrupt sample must be explicitly audited');
assert.equal(metric.eligibleSeconds,1,'corrupt chronology must not enter the eligible denominator');
assert.equal(metric.metricCoveredSeconds,1,'the valid tail after the cut remains measurable');
assert.equal(metric.distanceM,1,'no distance may bridge across the corrupt sample');
assert.equal(metric.avgSpeedKmh,3.6);
assert.equal(metric.sprintCount,0);
assert.ok(metric.invalidPathPolicy.includes('ENTREE_TRAJECTOIRE_CORROMPUE'));

// Missing segment and blank/non-finite time are structural samples and must fail closed.
for(const bad of [
  {time:1,metricX:11,metricY:20},
  {time:'   ',segment:1,metricX:11,metricY:20},
  {time:Infinity,segment:1,metricX:11,metricY:20}
]){
  const sample=Guard.robustMetricForTrack({fullPath:[{time:0,segment:1,metricX:10,metricY:20},bad]},projectors);
  assert.equal(sample.rejectedInvalidPathSamples,1);
  assert.equal(sample.metricCoverage,0);
  assert.equal(sample.distanceM,null);
  assert.equal(sample.quality,'INDISPONIBLE');
}

console.log('metric quality corrupt path non-regression: PASS');
