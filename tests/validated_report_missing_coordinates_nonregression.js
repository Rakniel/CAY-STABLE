'use strict';
const assert=require('assert');
const report=require('../validated_report_bridge_v1.js');

const invalidOnly={archive:[],active:[{
  globalId:'CAY-missing',
  fullPath:[
    {time:0,segment:1,x:null,y:.2},
    {time:1,segment:1,x:'',y:.2},
    {time:2,segment:1,x:'   ',y:.2},
    {time:3,segment:1,x:.2,y:null},
    {time:4,segment:'',x:.2,y:.2},
    {time:null,segment:1,x:.2,y:.2}
  ]
}]};

const visual=report.buildSegmentVisuals(invalidOnly).get('CAY-missing');
assert.deepStrictEqual(visual,[],'missing/blank trajectory evidence must not become segment-0 or coordinate-0 observations');
assert.strictEqual(report.segmentHeatmap([{x:null,y:.5},{x:'',y:.5},{x:'   ',y:.5}]).observations,0,'missing coordinates must not enter image heatmaps');

const mixed={archive:[],active:[{
  globalId:'CAY-guard',
  fullPath:[
    {time:0,segment:2,x:.10,y:.20},
    {time:1,segment:2,x:null,y:.20},
    {time:2,segment:2,x:.12,y:.20}
  ]
}]};
const projectors={2:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x*10,y:p.y*10})}};
const metric=report.buildMetricSegmentProvenance(mixed,projectors).get('CAY-guard')[0];
assert.strictEqual(metric.observations,2,'missing raw coordinates must be removed before metric projection');
assert.strictEqual(metric.eligibleSeconds,2,'remaining real observations keep their real temporal gap');
assert.strictEqual(metric.measuredSeconds,0,'a gap above the metric continuity threshold must not be converted into measured motion');
assert.strictEqual(metric.distanceM,null,'missing middle coordinate must never fabricate distance');
assert.strictEqual(metric.rejectionReasons.GAP_TEMPOREL_NON_OBSERVE,1,'loss of evidence remains explicit as an unobserved temporal gap');
assert.strictEqual(metric.quality,'INDISPONIBLE','no defensible metric pair stays unavailable');

const valid={archive:[],active:[{
  globalId:'CAY-valid',
  fullPath:[
    {time:0,segment:3,x:.10,y:.20},
    {time:1,segment:3,x:.11,y:.20}
  ]
}]};
const validMetric=report.buildMetricSegmentProvenance(valid,{3:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x*10,y:p.y*10})}}).get('CAY-valid')[0];
assert.strictEqual(validMetric.measuredSeconds,1,'valid metric evidence remains accepted');
assert.strictEqual(validMetric.distanceM,0.1,'valid distance remains unchanged');

console.log('validated_report_missing_coordinates_nonregression: PASS');
