const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');
const AuditRollup=require('../roster_metric_audit_rollup_v1.js');

function spatialWindow(index,quality){
  return {
    index,startMs:index*10000,endMs:index*10000+9000,
    spatial:{
      status:'DISPONIBLE',quality,coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:2,cols:2,
      observations:1,cells:[[1,0],[0,0]],timeCells:[[1,0],[0,0]],normalizedCells:[[1,0],[0,0]],
      heatmapBasis:'TIME_SECONDS',metricCoverage:1,temporalCoverage:1,
      trajectory:{status:'DISPONIBLE',metricCoverage:1,runs:[[{x:10+index,y:20,time:index*10,segment:index},{x:11+index,y:20,time:index*10+.5,segment:index}]]}
    }
  };
}

const mixed=Pipeline.summarizeSpatial([spatialWindow(0,'FIABLE'),spatialWindow(1,'PARTIEL')]);
assert.strictEqual(mixed.status,'PARTIEL','a partial source heatmap must downgrade the source spatial summary before downstream rollup');
assert.strictEqual(mixed.heatmap.quality,'PARTIEL');
assert.strictEqual(mixed.heatmap.reliableWindowCount,1);
assert.strictEqual(mixed.heatmap.sourceWindowCount,2);
assert.match(mixed.coverageNote,/qualité de preuve insuffisante/i);

const guarded=AuditRollup.guardSpatialQuality(mixed);
assert.strictEqual(guarded.status,'PARTIEL','the audit rollup must preserve the source verdict instead of applying a competing rule');
assert.strictEqual(guarded.heatmap.quality,'PARTIEL');
assert.strictEqual(guarded.heatmap.reliableWindowCount,1);

const reliable=Pipeline.summarizeSpatial([spatialWindow(0,'FIABLE'),spatialWindow(1,'FIABLE')]);
assert.strictEqual(reliable.status,'FIABLE','all reliable source heatmaps on one coherent geometry remain reliable');
assert.strictEqual(reliable.heatmap.quality,'FIABLE');
assert.strictEqual(reliable.heatmap.reliableWindowCount,2);
assert.strictEqual(reliable.heatmap.sourceWindowCount,2);
assert.strictEqual(reliable.coverageNote,null);

const missingQuality=Pipeline.summarizeSpatial([spatialWindow(0,'FIABLE'),spatialWindow(1,null)]);
assert.strictEqual(missingQuality.status,'PARTIEL','missing source quality must never be interpreted as reliable');
assert.strictEqual(missingQuality.heatmap.quality,'PARTIEL');

console.log('roster_metric_source_heatmap_quality_nonregression: ok');
