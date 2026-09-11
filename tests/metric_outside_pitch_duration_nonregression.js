'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const baseTrack={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:1,segment:1},
  {x:10,y:0,time:2,segment:1}
]};

const middleOutside=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>p.x===5?{x:106,y:20}:{x:p.x,y:20}}});
assert.equal(middleOutside.eligibleSeconds,2,'known chronology must stay in the denominator');
assert.equal(middleOutside.rejectedOutsidePitchSamples,1);
assert.equal(middleOutside.rejectedOutsidePitchSeconds,2,'a middle out-of-pitch projection must account for both adjacent seconds');
assert.equal(middleOutside.rejectedOutsidePitchIntervals,2);
assert.equal(middleOutside.metricCoverage,0,'no bridge may be created across the rejected pitch position');
assert.equal(middleOutside.distanceM,null);
assert.equal(middleOutside.sprintCount,null);

const edgeOutside=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>p.x===0?{x:-1,y:20}:{x:p.x,y:20}}});
assert.equal(edgeOutside.rejectedOutsidePitchSamples,1);
assert.equal(edgeOutside.rejectedOutsidePitchSeconds,1,'an endpoint pitch rejection affects only its adjacent interval');
assert.equal(edgeOutside.rejectedOutsidePitchIntervals,1);
assert.equal(edgeOutside.metricCoveredSeconds,1,'the clean tail remains measurable');
assert.equal(edgeOutside.metricCoverage,0.5);
assert.equal(edgeOutside.distanceM,5);

const gapTrack={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:3,segment:1}
]};
const gapOutside=Guard.robustMetricForTrack(gapTrack,{1:{validated:true,confidence:1,project:p=>p.x===5?{x:106,y:20}:{x:p.x,y:20}}});
assert.equal(gapOutside.rejectedGapSeconds,3,'large chronology gap remains owned by the gap audit');
assert.equal(gapOutside.rejectedOutsidePitchSeconds,0,'outside-pitch duration audit must not double-count temporal gaps');
assert.equal(gapOutside.rejectedOutsidePitchIntervals,0);

const projectionFailure=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>p.x===5?{x:Infinity,y:20}:{x:p.x,y:20}}});
assert.equal(projectionFailure.rejectedProjectionSeconds,2);
assert.equal(projectionFailure.rejectedOutsidePitchSeconds,0,'non-finite projection remains owned by projection-failure audit');
assert.equal(projectionFailure.rejectedOutsidePitchIntervals,0);

const clean=Guard.robustMetricForTrack(baseTrack,{1:{validated:true,confidence:1,project:p=>({x:p.x,y:20})}});
assert.equal(clean.rejectedOutsidePitchSeconds,0);
assert.equal(clean.rejectedOutsidePitchIntervals,0);
assert.equal(clean.metricCoverage,1);
assert.equal(clean.distanceM,10);

console.log('metric outside-pitch duration non-regression: PASS');
