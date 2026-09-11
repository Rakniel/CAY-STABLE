'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const baseTrack={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:1,segment:1},
  {x:10,y:0,time:2,segment:1}
]};

const unavailable=Guard.robustMetricForTrack(baseTrack,{1:{validated:false,project:null}});
assert.equal(unavailable.eligibleSeconds,2,'known chronology must stay in the denominator');
assert.equal(unavailable.rejectedProjectionSeconds,2,'all adjacent seconds touching unavailable projection must be audited');
assert.equal(unavailable.rejectedProjectionIntervals,2,'both adjacent intervals are affected');
assert.equal(unavailable.metricCoverage,0);
assert.equal(unavailable.distanceM,null);

const throwing=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>{if(p.x===5)throw new Error('synthetic projection failure');return {x:p.x,y:p.y};}}});
assert.equal(throwing.eligibleSeconds,2);
assert.equal(throwing.rejectedProjectionFailureSamples,1);
assert.equal(throwing.rejectedProjectionSeconds,2,'a failed middle projection must account for both adjacent seconds');
assert.equal(throwing.rejectedProjectionIntervals,2);
assert.equal(throwing.metricCoverage,0,'no bridge may be created across the failed projection');
assert.equal(throwing.distanceM,null);

const edgeFailure=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>p.x===0?{x:Infinity,y:0}:{x:p.x,y:p.y}}});
assert.equal(edgeFailure.rejectedProjectionSeconds,1,'an endpoint projection failure affects only its adjacent interval');
assert.equal(edgeFailure.rejectedProjectionIntervals,1);
assert.equal(edgeFailure.metricCoveredSeconds,1,'the clean tail remains measurable');
assert.equal(edgeFailure.distanceM,5);

const gapTrack={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:3,segment:1}
]};
const gapFailure=Guard.robustMetricForTrack(gapTrack,{1:{validated:false,project:null}});
assert.equal(gapFailure.rejectedGapSeconds,3,'large chronology gap remains owned by the gap audit');
assert.equal(gapFailure.rejectedProjectionSeconds,0,'projection-duration audit must not double-count intervals already classified as temporal gaps');
assert.equal(gapFailure.rejectedProjectionIntervals,0);

const clean=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>({x:p.x,y:p.y})}});
assert.equal(clean.rejectedProjectionSeconds,0);
assert.equal(clean.rejectedProjectionIntervals,0);
assert.equal(clean.metricCoverage,1);
assert.equal(clean.distanceM,10);

console.log('metric projection rejection duration non-regression: PASS');
