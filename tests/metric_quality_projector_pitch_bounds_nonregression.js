'use strict';

const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const track={
  fullPath:[
    {x:106,y:69,time:0,segment:0},
    {x:107,y:69,time:.5,segment:0},
    {x:108,y:69,time:1,segment:0}
  ]
};

const projector=(lengthM,widthM)=>({
  validated:true,
  confidence:.9,
  pitch:{lengthM,widthM},
  project:p=>({x:p.x,y:p.y})
});

const customPitch=Guard.robustMetricForTrack(track,{0:projector(110,70)});
assert.strictEqual(customPitch.rejectedOutsidePitchSamples,0,'positions inside an explicit 110x70 pitch must not be rejected by a fixed 105x68 bound');
assert.strictEqual(customPitch.metricCoverage,1,'explicit projector pitch geometry must preserve full metric coverage for valid samples');
assert.strictEqual(customPitch.distanceM,2,'distance must remain measurable inside the explicit projector pitch');
assert.strictEqual(customPitch.quality,'FIABLE','valid custom-pitch evidence with strong calibration confidence must remain reliable');

const smallerPitch=Guard.robustMetricForTrack(track,{0:projector(105,68)});
assert.strictEqual(smallerPitch.rejectedOutsidePitchSamples,3,'the same positions must be rejected when they exceed the explicit projector pitch');
assert.strictEqual(smallerPitch.metricCoverage,0,'out-of-pitch samples must not create metric coverage');
assert.strictEqual(smallerPitch.distanceM,null,'out-of-pitch samples must never create distance');

const legacy=Guard.projectorInfo({validated:true,confidence:.9,project:p=>({x:p.x,y:p.y})});
assert.strictEqual(legacy.pitchGeometryExplicit,false,'legacy projectors without pitch metadata must be identifiable as fallback geometry');
assert.strictEqual(legacy.pitchLengthM,105);
assert.strictEqual(legacy.pitchWidthM,68);

console.log('metric quality projector pitch bounds non-regression: OK');
