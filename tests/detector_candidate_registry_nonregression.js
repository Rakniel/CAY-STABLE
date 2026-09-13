'use strict';
const assert=require('assert');
const R=require('../detector_candidate_registry_v1.js');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};

const pass={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:true}};
const fail={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:false}};
const sha='0123456789abcdef'.repeat(4);
const provenance={source:'https://example.invalid/model',license:'Apache-2.0',sha256:sha};

ok(R.get('legacy-lukasiktar11-yolo').status==='REJECTED','legacy AGPL candidate remains rejected');
ok(R.promotionVerdict('legacy-lukasiktar11-yolo',pass,provenance).allowed===false,'rejected detector cannot be promoted by a passing benchmark');
ok(R.promotionVerdict('rfdetr-core-apache',fail,provenance).reason==='REAL_VIDEO_BENCHMARK_REQUIRED','failed real-video benchmark blocks RF-DETR');
ok(R.promotionVerdict('rfdetr-core-apache',pass,null).reason==='WEIGHT_PROVENANCE_REQUIRED','missing weight provenance blocks RF-DETR');
ok(R.promotionVerdict('rfdetr-core-apache',pass,{source:provenance.source,license:'Apache-2.0',revision:'repo-commit'}).reason==='WEIGHT_SHA256_REQUIRED','repository revision cannot stand in for the exact weight artifact');
ok(R.promotionVerdict('rfdetr-core-apache',pass,{source:provenance.source,license:'Apache-2.0',weightId:'model-v1'}).reason==='WEIGHT_SHA256_REQUIRED','mutable weight identifier cannot stand in for an immutable checksum');
ok(R.promotionVerdict('rfdetr-core-apache',pass,{source:provenance.source,license:'Apache-2.0',sha256:'abc123'}).reason==='WEIGHT_SHA256_REQUIRED','malformed checksum is rejected');
ok(R.normalizedSha256('sha256:'+sha)===sha,'sha256 prefix is normalized without weakening validation');
ok(R.provenanceValid({...provenance,sha256:'sha256:'+sha})===true,'prefixed exact weight checksum is accepted');
const promoted=R.promotionVerdict('rfdetr-core-apache',pass,provenance);
ok(promoted.allowed===true,'Apache RF-DETR can become eligible only after benchmark + immutable weight provenance');
ok(promoted.weightSha256===sha,'promotion verdict carries normalized exact weight checksum');
ok(R.promotionVerdict('dfine-football-rudrasinghm',pass,provenance).allowed===true,'D-FINE follows the same benchmark and checksum gate');
ok(R.promotionVerdict('rfdetr-soccernet-julianzu9612',pass,{...provenance,license:'AGPL-3.0'}).reason==='PROVENANCE_LICENSE_REJECTED','actual weight provenance overrides optimistic registry declaration');
ok(R.promotionVerdict('rfdetr-core-apache',pass,{...provenance,license:'Proprietary'}).reason==='PROVENANCE_LICENSE_REJECTED','proprietary detector provenance is fail-closed');
ok(R.promotionVerdict('rfdetr-core-apache',pass,{...provenance,license:'Unknown'}).reason==='PROVENANCE_LICENSE_REJECTED','unknown detector provenance is fail-closed');
ok(R.promotionVerdict('rfdetr-core-apache',pass,{...provenance,license:'Apache-2.0 AND Unknown'}).reason==='PROVENANCE_LICENSE_REJECTED','mixed provenance with unknown terms is fail-closed');
ok(R.promotionVerdict('unknown',pass,provenance).reason==='UNKNOWN_CANDIDATE','unknown detector is never silently accepted');
assert.throws(()=>R.assertPromotable('rfdetr-core-apache',fail,provenance),e=>e&&e.code==='CAY_DETECTOR_PROMOTION_BLOCKED');checks++;

console.log(`${checks}/${checks} detector candidate registry non-regression: PASS`);
