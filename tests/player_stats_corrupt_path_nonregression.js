'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const projectors={1:{validated:true,confidence:.95,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};

// Corrupt evidence must cut continuity instead of crashing the player card pipeline.
const corrupt={fullPath:[
  {time:0,segment:1,metricX:10,metricY:20},
  null,
  {time:2,segment:1,metricX:12,metricY:20},
  {time:3,segment:1,metricX:13,metricY:20}
]};
let metric;
assert.doesNotThrow(()=>{ metric=Stats.metricForTrack(corrupt,projectors); },'a null trajectory sample must never crash metric publication');
assert.equal(metric.rejectedInvalidPathPairs,2,'both pairs touching the corrupt sample must be explicitly audited');
assert.equal(metric.eligibleSeconds,1,'corrupt chronology must not enter the eligible denominator');
assert.equal(metric.metricCoveredSeconds,1,'the valid run after the cut remains measurable');
assert.equal(metric.distanceM,1,'no distance may bridge across the corrupt sample');
assert.equal(metric.avgSpeedKmh,3.6);
assert.equal(metric.sprintCount,0);
assert.ok(metric.distancePolicy.includes('ENTREE_TRAJECTOIRE_CORROMPUE'));

// Missing segment, invalid time and non-monotonic time are also structural cuts.
for(const bad of [
  {time:1,metricX:11,metricY:20},
  {time:'   ',segment:1,metricX:11,metricY:20},
  {time:0,segment:1,metricX:11,metricY:20}
]){
  const sample=Stats.metricForTrack({fullPath:[{time:0,segment:1,metricX:10,metricY:20},bad]},projectors);
  assert.equal(sample.rejectedInvalidPathPairs,1);
  assert.equal(sample.metricCoverage,0);
  assert.equal(sample.distanceM,null);
  assert.equal(sample.quality,'INDISPONIBLE');
}

console.log('player stats corrupt path non-regression: PASS');
