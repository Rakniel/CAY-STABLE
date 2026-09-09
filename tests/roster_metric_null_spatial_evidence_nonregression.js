'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

assert.strictEqual(
  Pipeline.samePitch(
    {pitchLengthM:null,pitchWidthM:68},
    {pitchLengthM:105,pitchWidthM:68}
  ),
  false,
  'null pitch dimensions must never be coerced to metric zero'
);

assert.strictEqual(
  Pipeline.samePitch(
    {pitchLengthM:'',pitchWidthM:68},
    {pitchLengthM:105,pitchWidthM:68}
  ),
  false,
  'blank pitch dimensions must never be treated as finite geometry'
);

assert.strictEqual(
  Pipeline.matrixOk([[null]],1,1),
  false,
  'null heatmap cells must not be accepted as numeric evidence'
);

assert.strictEqual(
  Pipeline.matrixOk([['']],1,1),
  false,
  'blank heatmap cells must not be accepted as numeric evidence'
);

const malformedSpatial={
  status:'DISPONIBLE',
  rows:1,
  cols:1,
  pitchLengthM:null,
  pitchWidthM:68,
  temporalCoverage:1,
  cells:[[1]],
  timeCells:[[1]],
  trajectory:{status:'INDISPONIBLE',runs:[]}
};
assert.strictEqual(
  Pipeline.dominantGeometryGroup([{index:0,spatial:malformedSpatial}]),
  null,
  'a spatial window with missing metric geometry must be excluded from the dominant pitch geometry'
);

const malformedMatrix={
  status:'DISPONIBLE',
  pitchLengthM:105,
  pitchWidthM:68,
  rows:1,
  cols:1,
  cells:[[null]],
  timeCells:[[null]],
  windowIndex:0
};
assert.strictEqual(
  Pipeline.mergeHeatmaps([malformedMatrix]),
  null,
  'heatmap aggregation must fail closed when an evidence cell is null'
);

const valid={pitchLengthM:105,pitchWidthM:68};
assert.strictEqual(Pipeline.samePitch(valid,{pitchLengthM:105,pitchWidthM:68}),true,'valid pitch geometry remains accepted');
assert.strictEqual(Pipeline.matrixOk([[0,1],[2,3]],2,2),true,'finite heatmap matrices remain accepted');

console.log('roster metric null spatial evidence non-regression: ok');
