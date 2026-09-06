'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

const track={fullPath:[
  {time:0,segment:1,x:.100,y:.100},
  {time:.5,segment:1,x:.105,y:.105},
  {time:1,segment:2,x:.700,y:.700},
  {time:1.5,segment:2,x:.705,y:.705}
]};
const projector=confidence=>({validated:true,confidence,project:p=>({x:p.x*105,y:p.y*68})});

// Regression target: averaging .9 and .1 used to produce .5, allowing the weak
// segment into a metric trajectory. Each segment must now clear the gate itself.
const guarded=Heat.build(track,{1:projector(.9),2:projector(.1)},{
  minCalibrationConfidence:.5,
  minMetricCoverage:.4,
  minTemporalCoverage:.3,
  maxDwellGapSec:1
});
assert.equal(guarded.status,'DISPONIBLE');
assert.equal(guarded.observations,2);
assert.equal(guarded.rejectedObservations,2);
assert.equal(guarded.metricCoverage,.5);
assert.equal(guarded.avgCalibrationConfidence,.9);
assert.equal(guarded.trajectory.status,'DISPONIBLE');
assert.equal(guarded.trajectory.points.length,2);
assert(guarded.trajectory.points.every(p=>p.segment===1));
assert.equal(guarded.projectedIntervalSeconds,.5);
assert.equal(guarded.eligibleIntervalSeconds,1.5);
assert.equal(guarded.segmentBoundarySeconds,.5);
assert.equal(guarded.segmentBoundaryBreaks,1);
assert.equal(guarded.temporalCoverage,.3333);

const tooStrict=Heat.build(track,{1:projector(.9),2:projector(.1)},{
  minCalibrationConfidence:.5,
  minMetricCoverage:.6
});
assert.equal(tooStrict.status,'INDISPONIBLE');
assert.equal(tooStrict.metricCoverage,.5);
assert.equal(tooStrict.projectedPoints.length,0);

// Unknown confidence remains fail-closed rather than silently becoming trusted.
const unknown=Heat.build({fullPath:[{time:0,segment:1,x:.2,y:.2}]},{1:{validated:true,project:p=>({x:p.x*105,y:p.y*68})}},{minMetricCoverage:0});
assert.equal(unknown.status,'INDISPONIBLE');
assert.equal(unknown.trajectory.status,'INDISPONIBLE');

console.log('metric_segment_confidence_gate_nonregression: OK');
