'use strict';
const assert=require('assert');
const interchange=require('../detector_coco_interchange_v1.js');
const gate=require('../detector_cocoeval_gate_v1.js');

const spec={evaluationSet:'cay-det-001',frames:[
  {id:'f1',width:1920,height:1080,annotations:[{category:'person',bboxPx:[100,100,40,120]},{category:'ball',bboxPx:[500,300,18,18]}]},
  {id:'f2',width:1920,height:1080,annotations:[{category:'person',bboxPx:[200,120,42,118]}]}
]};
const gt=interchange.buildGroundTruth(spec);
assert.equal(gt.version,'CAY_DETECTOR_COCO_INTERCHANGE_V1');
assert.equal(gt.coco.images.length,2);
assert.equal(gt.coco.annotations.length,3);
assert.equal(gt.summary.annotationCoverage,1);
assert.deepEqual(gt.coco.categories.map(c=>c.name),['person','ball']);

const det=interchange.buildDetections(spec,[
  {frameId:'f1',category:'person',bboxPx:[101,101,40,120],score:.91},
  {frameId:'f1',category:'ball',bboxPx:[501,301,18,18],score:.83},
  {frameId:'f2',category:'person',bboxPx:[202,121,42,118],score:.88},
  {frameId:'unknown',category:'person',bboxPx:[1,1,10,10],score:.5}
]);
assert.equal(det.detections.length,3);
assert.equal(det.summary.rejectedDetectionCount,1);

assert.throws(()=>interchange.buildGroundTruth({evaluationSet:'bad',frames:[{id:'x',width:100,height:100,annotations:[{category:'person',bboxPx:[95,95,10,10]}]}]}),/COCO_BBOX_OUTSIDE_IMAGE/);

const baseline={evaluationSet:'cay-det-001',annotationCoverage:1,metrics:{AP:.51,AP50:.72,AP75:.54,personAP50:.80,ballAP50:.61}};
const better={evaluationSet:'cay-det-001',annotationCoverage:1,metrics:{AP:.53,AP50:.74,AP75:.56,personAP50:.81,ballAP50:.66}};
let result=gate.compareReports(baseline,better);
assert.equal(result.status,'VALIDE');
assert.equal(result.promotionAllowed,true);

const ballRegression={...better,metrics:{...better.metrics,ballAP50:.58}};
result=gate.compareReports(baseline,ballRegression);
assert.equal(result.status,'REJETE');
assert(result.failedMetrics.includes('ballAP50'));

result=gate.compareReports(baseline,{...better,annotationCoverage:.95});
assert.equal(result.status,'INDISPONIBLE');
assert.equal(result.reason,'DETECTOR_COCOEVAL_ANNOTATION_COVERAGE_INSUFFICIENT');

result=gate.compareReports(baseline,{...better,evaluationSet:'other'});
assert.equal(result.status,'INDISPONIBLE');
assert.equal(result.reason,'DETECTOR_COCOEVAL_SET_MISMATCH');

result=gate.compareReports(baseline,{...better,metrics:{AP:53,AP50:74,AP75:56,personAP50:81,ballAP50:66}});
assert.equal(result.status,'VALIDE');
assert.equal(result.candidate.metrics.ballAP50,.66);
console.log('detector COCOeval non-regression: PASS');
