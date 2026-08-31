'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const projector={1:{validated:true,source:'test',project:p=>({x:p.x,y:p.y})}};
const track=points=>({fullPath:points.map((p,i)=>({x:p[0],y:p[1],time:i,segment:1}))});

const jitter=Guard.robustMetricForTrack(track([[10,10],[10.25,9.8],[9.8,10.2],[10.2,9.85],[10,10]]),projector);
assert.strictEqual(jitter.metricCoverage,1,'jitter path must remain covered');
assert.ok(jitter.distanceM<1,'median guard must strongly reduce stationary projection jitter');
assert.ok(jitter.maxSpeedKmh<2,'jitter must not create a fake high speed');

const linear=Guard.robustMetricForTrack(track([[0,0],[5,0],[10,0],[15,0],[20,0]]),projector);
assert.strictEqual(linear.distanceM,20,'clean linear distance must be preserved');
assert.strictEqual(linear.avgSpeedKmh,18,'clean linear speed must be preserved');
assert.strictEqual(linear.maxSpeedKmh,18,'clean max speed must be preserved');
assert.strictEqual(linear.sprintCount,0,'18 km/h must not create a sprint');

const sprint=Guard.robustMetricForTrack(track([[0,0],[8,0],[16,0],[24,0],[32,0]]),projector);
assert.strictEqual(sprint.sprintCount,1,'continuous 28.8 km/h run must count as one sprint episode');
assert.strictEqual(sprint.sprintQualifiedSeconds,4,'full qualified sprint duration must include the interval that reaches the duration threshold');
assert.strictEqual(sprint.sprintThresholdKmh,25,'sprint threshold must stay explicit');
assert.strictEqual(sprint.minSprintDurationSeconds,1,'sprint duration guard must stay explicit');

const subsecondSamples={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:3.2,y:0,time:0.4,segment:1},
  {x:6.4,y:0,time:0.8,segment:1},
  {x:9.6,y:0,time:1.2,segment:1}
]};
const subsecondSprint=Guard.robustMetricForTrack(subsecondSamples,projector);
assert.strictEqual(subsecondSprint.sprintCount,1,'sub-second samples sustained beyond one second must form one sprint episode');
assert.strictEqual(subsecondSprint.sprintQualifiedSeconds,1.2,'qualified duration must include all pre-qualification sprint candidate intervals');

const shortSpike={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:2,y:0,time:1,segment:1},
  {x:6,y:0,time:1.5,segment:1},
  {x:8,y:0,time:2.5,segment:1}
]};
const spike=Guard.robustMetricForTrack(shortSpike,projector);
assert.strictEqual(spike.sprintCount,0,'sub-second high-speed spike must not count as a sprint');

const twoSprints={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:8,y:0,time:1,segment:1},
  {x:16,y:0,time:2,segment:1},
  {x:18,y:0,time:3,segment:1},
  {x:26,y:0,time:4,segment:1},
  {x:34,y:0,time:5,segment:1}
]};
const doubleSprint=Guard.robustMetricForTrack(twoSprints,projector);
assert.strictEqual(doubleSprint.sprintCount,2,'two sustained sprint runs separated by low speed must count as two episodes');

const segmented={fullPath:[{x:0,y:0,time:0,segment:1},{x:5,y:0,time:1,segment:1},{x:50,y:0,time:2,segment:2},{x:55,y:0,time:3,segment:2}]};
const projectors={1:projector[1],2:{validated:true,project:p=>({x:p.x,y:p.y})}};
const seg=Guard.robustMetricForTrack(segmented,projectors);
assert.strictEqual(seg.distanceM,10,'segment cut must never connect trajectories across camera plans');

const unavailable=Guard.robustMetricForTrack(track([[0,0],[5,0],[10,0]]),{1:{validated:false,project:null}});
assert.strictEqual(unavailable.metricCoverage,0,'unvalidated calibration must stay unavailable');
assert.strictEqual(unavailable.distanceM,null,'unvalidated calibration must not invent metres');

console.log('metric quality guard non-regression: PASS');