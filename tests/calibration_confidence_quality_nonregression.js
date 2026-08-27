'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');
const Guard=require('../metric_quality_guard_v1.js');

const track={fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:1,segment:1,x:.20,y:.10},
  {time:2,segment:1,x:.30,y:.10},
  {time:3,segment:1,x:.40,y:.10},
  {time:4,segment:1,x:.50,y:.10}
]};
const projector=confidence=>({1:{validated:true,confidence,source:'test',project:p=>({x:p.x*100,y:p.y*60})}});

const strongMetric=Guard.robustMetricForTrack(track,projector(1));
assert.equal(strongMetric.metricCoverage,1);
assert.equal(strongMetric.avgCalibrationConfidence,1);
assert.equal(strongMetric.defendableScore,1);
assert.equal(strongMetric.quality,'FIABLE');

const marginalMetric=Guard.robustMetricForTrack(track,projector(.5));
assert.equal(marginalMetric.metricCoverage,1,'coverage alone must remain observable');
assert.equal(marginalMetric.avgCalibrationConfidence,.5);
assert.equal(marginalMetric.defendableScore,.5,'defendable score must combine coverage and calibration confidence');
assert.equal(marginalMetric.quality,'PARTIEL','100% coverage must not be FIABLE when calibration confidence is only 50%');

const strongHeat=Heat.build(track,projector(1),{});
assert.equal(strongHeat.status,'DISPONIBLE');
assert.equal(strongHeat.quality,'FIABLE');
assert.equal(strongHeat.defendableScore,1);

const marginalHeat=Heat.build(track,projector(.5),{});
assert.equal(marginalHeat.status,'DISPONIBLE');
assert.equal(marginalHeat.quality,'PARTIEL');
assert.equal(marginalHeat.defendableScore,.5);

const weakHeat=Heat.build(track,projector(.3),{});
assert.equal(weakHeat.status,'INDISPONIBLE','weak calibration must not publish a pitch heatmap');
assert.match(weakHeat.reason,/confiance calibration insuffisante/);
assert.equal(weakHeat.projectedPoints.length,0,'unavailable heatmap must not expose projected points as defendable output');

console.log('calibration_confidence_quality_nonregression: PASS');
