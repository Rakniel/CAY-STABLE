'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const baseTrack={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:1,segment:1},
  {x:10,y:0,time:2,segment:1}
]};

const nullProjectedX=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>p.time===1?{x:null,y:p.y}:{x:p.x,y:p.y}}});
assert.strictEqual(nullProjectedX.metricCoveredSeconds,0,'missing projected coordinate must break the metric run');
assert.strictEqual(nullProjectedX.distanceM,null,'missing projected coordinate must not invent metres');
assert.strictEqual(nullProjectedX.quality,'INDISPONIBLE','missing projected coordinate must stay unavailable');

const blankProjectedY=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>p.time===1?{x:p.x,y:'   '}:{x:p.x,y:p.y}}});
assert.strictEqual(blankProjectedY.metricCoveredSeconds,0,'blank projected coordinate must break the metric run');
assert.strictEqual(blankProjectedY.distanceM,null,'blank projected coordinate must not invent metres');

const nullTime={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:null,segment:1},
  {x:10,y:0,time:2,segment:1}
]};
const badTime=Guard.robustMetricForTrack(nullTime,{1:{validated:true,confidence:1,project:p=>({x:p.x,y:p.y})}});
assert.strictEqual(badTime.eligibleSeconds,0,'missing timestamp must not create eligible metric duration');
assert.strictEqual(badTime.metricCoveredSeconds,0,'missing timestamp must not create covered duration');
assert.strictEqual(badTime.distanceM,null,'missing timestamp must not create distance');

for(const confidence of [undefined,null,'   ','not-a-number']){
  const missingConfidence=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence,project:p=>({x:p.x,y:p.y})}});
  assert.strictEqual(missingConfidence.avgCalibrationConfidence,0,'missing or invalid calibration confidence must contribute zero defendability');
  assert.strictEqual(missingConfidence.defendableScore,0,'missing or invalid calibration confidence must not create a defendable score');
  assert.strictEqual(missingConfidence.quality,'INDISPONIBLE','physical metrics must stay unavailable without explicit calibration confidence');
  assert.strictEqual(missingConfidence.metricCoverage,1,'metric geometry coverage may remain observable internally');
  assert.strictEqual(missingConfidence.distanceM,10,'observed metric geometry may remain available internally without being publishable');
  assert.match(missingConfidence.calibrationConfidencePolicy,/EXPLICITE_REQUISE/,'quality output must expose the strict confidence contract');
}

const explicitZero=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:0,project:p=>({x:p.x,y:p.y})}});
assert.strictEqual(explicitZero.avgCalibrationConfidence,0,'explicit measured zero confidence remains zero');
assert.strictEqual(explicitZero.quality,'INDISPONIBLE');

console.log('metric quality missing values non-regression: PASS');
