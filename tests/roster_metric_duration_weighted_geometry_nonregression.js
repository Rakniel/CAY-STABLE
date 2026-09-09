'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

function spatialWindow(index,startMs,endMs,pitchLengthM,pitchWidthM){
  return {index,startMs,endMs,spatial:{
    status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,rows:2,cols:2,observations:2,
    cells:[[2,0],[0,0]],timeCells:[[1,0],[0,0]],normalizedCells:[[1,0],[0,0]],heatmapBasis:'TIME_SECONDS',
    temporalCoverage:1,metricCoverage:1,quality:'FIABLE',
    trajectory:{status:'DISPONIBLE',metricCoverage:1,runs:[[{x:1,y:1,time:0},{x:2,y:1,time:1}]]}
  }};
}

const longReliable=spatialWindow(0,0,30000,105,68);
const shortA=spatialWindow(1,30000,32000,100,64);
const shortB=spatialWindow(2,32000,34000,100,64);

const durationWeighted=Pipeline.dominantGeometryGroup([longReliable,shortA,shortB]);
assert.ok(durationWeighted);
assert.strictEqual(durationWeighted.first.spatial.pitchLengthM,105,'30 defendable seconds must beat two 2-second windows on an incompatible geometry');
assert.strictEqual(durationWeighted.items.length,1);
assert.strictEqual(durationWeighted.evidenceWeight,30);
assert.strictEqual(durationWeighted.evidenceWeightBasis,'DEFENDABLE_SECONDS');

const summary=Pipeline.summarizeSpatial([longReliable,shortA,shortB]);
assert.strictEqual(summary.geometry.pitchLengthM,105);
assert.deepStrictEqual(summary.geometry.sourceWindowIndexes,[0]);
assert.strictEqual(summary.geometry.evidenceWeightBasis,'DEFENDABLE_SECONDS');
assert.strictEqual(summary.geometry.evidenceWeight,30);

const missingBounds=[
  {...longReliable,startMs:null,endMs:null},
  {...shortA,startMs:null,endMs:null},
  {...shortB,startMs:null,endMs:null}
];
const fallback=Pipeline.dominantGeometryGroup(missingBounds);
assert.strictEqual(fallback.first.spatial.pitchLengthM,100,'without complete temporal bounds, retain the explicit legacy coverage-equivalent selection');
assert.strictEqual(fallback.items.length,2);
assert.strictEqual(fallback.evidenceWeightBasis,'COVERAGE_EQUIVALENT');

assert.strictEqual(Pipeline.windowDurationSeconds({startMs:0,endMs:2500}),2.5);
assert.strictEqual(Pipeline.windowDurationSeconds({startMs:null,endMs:2500}),null);
assert.strictEqual(Pipeline.windowDurationSeconds({startMs:2500,endMs:2500}),null);

console.log('roster_metric_duration_weighted_geometry_nonregression: PASS');
