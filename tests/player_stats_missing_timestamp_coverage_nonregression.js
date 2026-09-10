'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const projectors={
  1:{validated:true,confidence:.95,source:'test',project:p=>({x:p.x,y:p.y})}
};

function metricFor(firstTime){
  return Stats.metricForTrack({fullPath:[
    {time:firstTime,segment:1,x:0,y:0},
    {time:1,segment:1,x:1,y:0},
    {time:2,segment:1,x:2,y:0}
  ]},projectors);
}

for(const missing of [null,undefined,'','   ','\t ']){
  const metric=metricFor(missing);
  assert.equal(metric.eligibleSeconds,1,'missing timestamp evidence must not inflate the eligible-time denominator');
  assert.equal(metric.metricCoveredSeconds,1,'the later valid interval must remain measurable');
  assert.equal(metric.metricCoverage,1,'coverage must be computed only from temporally defensible intervals');
  assert.equal(metric.distanceM,1,'only the valid 1s interval may contribute distance');
  assert.equal(metric.avgSpeedKmh,3.6,'valid later speed remains available');
}

const explicitZero=metricFor(0);
assert.equal(explicitZero.eligibleSeconds,2,'an explicit t=0 is valid temporal evidence');
assert.equal(explicitZero.metricCoveredSeconds,2);
assert.equal(explicitZero.metricCoverage,1);
assert.equal(explicitZero.distanceM,2);
assert.equal(explicitZero.avgSpeedKmh,3.6);

console.log('player stats missing timestamp coverage non-regression: PASS');
