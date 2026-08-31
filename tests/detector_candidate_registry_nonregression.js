'use strict';
const assert=require('assert');
const R=require('../detector_candidate_registry_v1.js');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};

const pass={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:true}};
const fail={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:false}};
const provenance={source:'https://example.invalid/model',license:'Apache-2.0',weightId:'sha256:abc123'};

ok(R.get('legacy-lukasiktar11-yolo').status==='REJECTED','legacy AGPL candidate remains rejected');
ok(R.promotionVerdict('legacy-lukasiktar11-yolo',pass,provenance).allowed===false,'rejected detector cannot be promoted by a passing benchmark');
ok(R.promotionVerdict('rfdetr-core-apache',fail,provenance).reason==='REAL_VIDEO_BENCHMARK_REQUIRED','failed real-video benchmark blocks RF-DETR');
ok(R.promotionVerdict('rfdetr-core-apache',pass,null).reason==='WEIGHT_PROVENANCE_REQUIRED','missing weight provenance blocks RF-DETR');
ok(R.promotionVerdict('rfdetr-core-apache',pass,provenance).allowed===true,'Apache RF-DETR can become eligible only after benchmark + provenance');
ok(R.promotionVerdict('dfine-football-rudrasinghm',pass,provenance).allowed===true,'D-FINE follows the same benchmark gate');
ok(R.promotionVerdict('rfdetr-soccernet-julianzu9612',pass,{...provenance,license:'AGPL-3.0'}).reason==='PROVENANCE_LICENSE_REJECTED','actual weight provenance overrides optimistic registry declaration');
ok(R.promotionVerdict('unknown',pass,provenance).reason==='UNKNOWN_CANDIDATE','unknown detector is never silently accepted');
assert.throws(()=>R.assertPromotable('rfdetr-core-apache',fail,provenance),e=>e&&e.code==='CAY_DETECTOR_PROMOTION_BLOCKED');checks++;

console.log(`${checks}/${checks} detector candidate registry non-regression: PASS`);
