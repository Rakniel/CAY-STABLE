'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

const projector={validated:true,confidence:1,project:p=>({x:p.x*105,y:p.y*68})};

function assertMissingTimestampIsNotTemporalEvidence(timeValue,label){
  const result=Heat.build({fullPath:[
    {time:timeValue,segment:1,x:.10,y:.10},
    {time:1,segment:1,x:.11,y:.11}
  ]},{1:projector},{});
  assert.equal(result.metricCoverage,1,label+' keeps valid spatial observations');
  assert.equal(result.eligibleIntervalSeconds,0,label+' must not create an eligible temporal interval');
  assert.equal(result.projectedIntervalSeconds,0,label+' must not allocate dwell seconds');
  assert.equal(result.temporalCoverage,null,label+' must keep temporal coverage unavailable');
  assert.equal(result.status,'INDISPONIBLE',label+' must remain unavailable');
  assert.equal(result.projectedPoints.length,0,label+' must not publish pitch points as a defensible timed product');
  assert.equal(result.trajectory.status,'INDISPONIBLE',label+' must not create a trajectory run');
}

assertMissingTimestampIsNotTemporalEvidence(null,'null timestamp');
assertMissingTimestampIsNotTemporalEvidence('','empty timestamp');
assertMissingTimestampIsNotTemporalEvidence('   ','whitespace timestamp');

const timed=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:1,segment:1,x:.11,y:.11}
]},{1:projector},{});
assert.equal(timed.eligibleIntervalSeconds,1);
assert.equal(timed.projectedIntervalSeconds,1);
assert.equal(timed.temporalCoverage,1);
assert.equal(timed.status,'DISPONIBLE');
assert.equal(timed.trajectory.status,'DISPONIBLE');

console.log('metric_pitch_heatmap_missing_timestamp_values_nonregression: OK');
