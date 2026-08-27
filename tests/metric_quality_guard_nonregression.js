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

const segmented={fullPath:[{x:0,y:0,time:0,segment:1},{x:5,y:0,time:1,segment:1},{x:50,y:0,time:2,segment:2},{x:55,y:0,time:3,segment:2}]};
const projectors={1:projector[1],2:{validated:true,project:p=>({x:p.x,y:p.y})}};
const seg=Guard.robustMetricForTrack(segmented,projectors);
assert.strictEqual(seg.distanceM,10,'segment cut must never connect trajectories across camera plans');

const unavailable=Guard.robustMetricForTrack(track([[0,0],[5,0],[10,0]]),{1:{validated:false,project:null}});
assert.strictEqual(unavailable.metricCoverage,0,'unvalidated calibration must stay unavailable');
assert.strictEqual(unavailable.distanceM,null,'unvalidated calibration must not invent metres');

console.log('metric quality guard non-regression: PASS');
