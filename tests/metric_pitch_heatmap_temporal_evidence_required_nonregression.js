'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

const projector={validated:true,confidence:1,project:p=>({x:p.x*105,y:p.y*68})};

// Metric-valid positions without timestamps are observations, not temporal occupancy.
const missingTime=Heat.build({fullPath:[
  {segment:1,x:.10,y:.10},
  {segment:1,x:.20,y:.20},
  {segment:1,x:.30,y:.30}
]},{1:projector},{});
assert.equal(missingTime.metricCoverage,1);
assert.equal(missingTime.observations,3);
assert.equal(missingTime.eligibleIntervalSeconds,0);
assert.equal(missingTime.projectedIntervalSeconds,0);
assert.equal(missingTime.temporalCoverage,null);
assert.equal(missingTime.defendableScore,0);
assert.equal(missingTime.status,'INDISPONIBLE');
assert.equal(missingTime.quality,'INDISPONIBLE');
assert.equal(missingTime.projectedPoints.length,0);
assert.match(missingTime.reason,/preuve temporelle continue/);
assert.equal(missingTime.qualityPolicy,'QUALITE_INDISPONIBLE_SANS_PREUVE_TEMPORELLE');

// Camera-plan cuts cannot create temporal evidence even with valid timestamps and calibration.
const cutsOnly=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:.5,segment:2,x:.20,y:.20},
  {time:1,segment:3,x:.30,y:.30}
]},{1:projector,2:projector,3:projector},{});
assert.equal(cutsOnly.metricCoverage,1);
assert.equal(cutsOnly.eligibleIntervalSeconds,0);
assert.equal(cutsOnly.projectedIntervalSeconds,0);
assert.equal(cutsOnly.temporalCoverage,null);
assert.equal(cutsOnly.status,'INDISPONIBLE');
assert.match(cutsOnly.reason,/preuve temporelle continue/);

// A normal same-plan timed sequence remains publishable.
const timed=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:.5,segment:1,x:.20,y:.20},
  {time:1,segment:1,x:.30,y:.30}
]},{1:projector},{});
assert.equal(timed.metricCoverage,1);
assert.equal(timed.eligibleIntervalSeconds,1);
assert.equal(timed.projectedIntervalSeconds,1);
assert.equal(timed.temporalCoverage,1);
assert.equal(timed.status,'DISPONIBLE');
assert.equal(timed.quality,'FIABLE');
assert.equal(timed.heatmapBasis,'TIME_SECONDS');

console.log('metric_pitch_heatmap_temporal_evidence_required_nonregression: OK');
