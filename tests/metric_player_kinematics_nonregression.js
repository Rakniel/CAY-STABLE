'use strict';
const assert=require('assert');
const K=require('../metric_player_kinematics_v1.js');

const point=(time,x,y)=>({time,x,y,segment:1,calibrationConfidence:.9});
const trajectory=(runs,coverage=.9,confidence=.9)=>({status:'DISPONIBLE',runs,metricCoverage:coverage,avgCalibrationConfidence:confidence});

{
  const out=K.build(null);
  assert.equal(out.status,'INDISPONIBLE');
  assert.equal(out.distanceM,null);
}
{
  const out=K.build(trajectory([[point(0,0,0),point(1,3,4)]],.2,.9));
  assert.equal(out.status,'INDISPONIBLE');
  assert.match(out.reason,/couverture/);
}
{
  const out=K.build(trajectory([[point(0,0,0),point(1,3,4)]],.9,.2));
  assert.equal(out.status,'INDISPONIBLE');
  assert.match(out.reason,/confiance/);
}
{
  const out=K.build(trajectory([[point(0,0,0),point(1,3,4),point(2,6,8)]]));
  assert.equal(out.status,'DISPONIBLE');
  assert.equal(out.distanceM,10);
  assert.equal(out.avgSpeedKmh,18);
  assert.equal(out.maxSpeedKmh,18);
  assert.equal(out.sprintCount,0);
}
{
  const out=K.build(trajectory([[point(0,0,0),point(1,8,0),point(2,16,0),point(3,16,0)]]),{sprintThresholdKmh:25,minSprintDurationSec:2});
  assert.equal(out.status,'DISPONIBLE');
  assert.equal(out.sprintCount,1);
  assert.equal(out.sprintDistanceM,16);
  assert.equal(out.sprintSeconds,2);
}
{
  const out=K.build(trajectory([[point(0,0,0),point(1,20,0),point(2,21,0)]]));
  assert.equal(out.status,'DISPONIBLE');
  assert.equal(out.distanceM,1);
  assert.equal(out.rejectedPairs,1);
}
{
  const out=K.build(trajectory([[point(0,0,0),point(3,3,0)]]),{maxGapSec:1});
  assert.equal(out.status,'INDISPONIBLE');
}
{
  // Regression guard: adjacent trajectory runs are separate evidence windows and
  // must never be stitched into one sprint merely because their timestamps touch.
  const out=K.build(trajectory([
    [point(0,0,0),point(.6,5,0)],
    [point(.6,5,0),point(1.2,10,0)]
  ]),{sprintThresholdKmh:25,minSprintDurationSec:1});
  assert.equal(out.status,'DISPONIBLE');
  assert.equal(out.distanceM,10);
  assert.equal(out.sprintCount,0);
  assert.equal(out.sprintDistanceM,0);
  assert.equal(out.sprintSeconds,0);
}
console.log('metric_player_kinematics_nonregression: PASS');
