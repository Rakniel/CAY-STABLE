'use strict';
const assert=require('assert');
const gate=require('../tracking_benchmark_gate_v1.js');

const baseline={evaluationSet:'cay-clip-001',tracker:'baseline',bboxEvidenceCoverage:1,metrics:{HOTA:0.62,DetA:0.70,AssA:0.56,IDF1:0.60}};
const better={evaluationSet:'cay-clip-001',tracker:'candidate',bboxEvidenceCoverage:1,metrics:{HOTA:0.64,DetA:0.71,AssA:0.60,IDF1:0.63}};
let result=gate.compareTrackingReports(baseline,better);
assert.equal(result.status,'VALIDE');
assert.equal(result.promotionAllowed,true);
assert(result.deltas.AssA>0);

const identityRegression={evaluationSet:'cay-clip-001',tracker:'candidate',bboxEvidenceCoverage:1,metrics:{HOTA:0.625,DetA:0.72,AssA:0.53,IDF1:0.57}};
result=gate.compareTrackingReports(baseline,identityRegression);
assert.equal(result.status,'REJETE');
assert.equal(result.promotionAllowed,false);
assert(result.failedMetrics.includes('AssA'));
assert(result.failedMetrics.includes('IDF1'));

const lowCoverage={...better,bboxEvidenceCoverage:0.92};
result=gate.compareTrackingReports(baseline,lowCoverage);
assert.equal(result.status,'INDISPONIBLE');
assert.equal(result.reason,'TRACKING_BENCHMARK_COVERAGE_INSUFFICIENT');

result=gate.compareTrackingReports(baseline,{...better,evaluationSet:'other-clip'});
assert.equal(result.status,'INDISPONIBLE');
assert.equal(result.reason,'TRACKING_BENCHMARK_SET_MISMATCH');

result=gate.compareTrackingReports(baseline,{...better,metrics:{HOTA:64,DetA:71,AssA:60,IDF1:63}});
assert.equal(result.status,'VALIDE');
assert.equal(result.candidate.metrics.HOTA,0.64);

result=gate.compareTrackingReports(baseline,{...better,metrics:{HOTA:0.64,DetA:0.71,AssA:null,IDF1:0.63}});
assert.equal(result.status,'INDISPONIBLE');
assert.equal(result.reason,'TRACKING_BENCHMARK_AssA_REQUIRED');

console.log('tracking benchmark gate non-regression: PASS');
