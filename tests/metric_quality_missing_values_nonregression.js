'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const baseTrack={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:1,segment:1},
  {x:10,y:0,time:2,segment:1}
]};

const nullProjectedX=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,project:p=>p.time===1?{x:null,y:p.y}:{x:p.x,y:p.y}}});
assert.strictEqual(nullProjectedX.metricCoveredSeconds,0,'missing projected coordinate must break the metric run');
assert.strictEqual(nullProjectedX.distanceM,null,'missing projected coordinate must not invent metres');
assert.strictEqual(nullProjectedX.quality,'INDISPONIBLE','missing projected coordinate must stay unavailable');

const blankProjectedY=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,project:p=>p.time===1?{x:p.x,y:'   '}:{x:p.x,y:p.y}}});
assert.strictEqual(blankProjectedY.metricCoveredSeconds,0,'blank projected coordinate must break the metric run');
assert.strictEqual(blankProjectedY.distanceM,null,'blank projected coordinate must not invent metres');

const nullTime={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:null,segment:1},
  {x:10,y:0,time:2,segment:1}
]};
const badTime=Guard.robustMetricForTrack(nullTime,{1:{validated:true,project:p=>({x:p.x,y:p.y})}});
assert.strictEqual(badTime.eligibleSeconds,0,'missing timestamp must not create eligible metric duration');
assert.strictEqual(badTime.metricCoveredSeconds,0,'missing timestamp must not create covered duration');
assert.strictEqual(badTime.distanceM,null,'missing timestamp must not create distance');

const missingConfidence=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:null,project:p=>({x:p.x,y:p.y})}});
assert.strictEqual(missingConfidence.avgCalibrationConfidence,1,'missing optional confidence must use validated-projector fallback instead of coercing null to zero');
assert.strictEqual(missingConfidence.metricCoverage,1,'valid metric path must remain fully covered');
assert.strictEqual(missingConfidence.distanceM,10,'valid metric path must remain unchanged');

console.log('metric quality missing values non-regression: PASS');
