'use strict';
const assert=require('assert');
const R=require('../detector_candidate_registry_v1.js');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};

const pass={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:true}};
const fail={version:'CAY_DETECTOR_BENCHMARK_V1',summary:{promotionEligible:false}};
const provenance={source:'https://example.invalid/model',license:'Apache-2.0',weightId:'sha256:abc123'};
const browserExport={version:'CAY_RFDETR_BROWSER_EXPORT_V1',contractVerified:true,weightId:'sha256:abc123'};

ok(R.get('legacy-lukasiktar11-yolo').status==='REJECTED','legacy AGPL candidate remains rejected');
ok(R.promotionVerdict('legacy-lukasiktar11-yolo',pass,provenance).allowed===false,'rejected detector cannot be promoted by a passing benchmark');
ok(R.promotionVerdict('rfdetr-core-apache',fail,provenance).reason==='REAL_VIDEO_BENCHMARK_REQUIRED','failed real-video benchmark blocks RF-DETR');
ok(R.promotionVerdict('rfdetr-core-apache',pass,null).reason==='WEIGHT_PROVENANCE_REQUIRED','missing weight provenance blocks RF-DETR');
ok(R.promotionVerdict('rfdetr-core-apache',pass,provenance).allowed===true,'Apache RF-DETR can become eligible only after benchmark + provenance');
ok(R.promotionVerdict('dfine-football-rudrasinghm',pass,provenance).allowed===true,'D-FINE follows the same benchmark gate');
ok(R.promotionVerdict('rfdetr-soccernet-julianzu9612',pass,{...provenance,license:'AGPL-3.0'}).reason==='PROVENANCE_LICENSE_REJECTED','actual weight provenance overrides registry model-card declaration');

const soccer=R.get('rfdetr-soccernet-julianzu9612');
ok(soccer.status==='BENCHMARK_READY','SoccerNet candidate is explicitly benchmark-ready, not runtime default');
ok(soccer.license==='Apache-2.0','SoccerNet model-level licence is pinned');
ok(soccer.modelRevision==='7e567611ea77efd3a6144b3a61eced5a8c8df8d7','audited model-card revision is pinned');
ok(soccer.classMap[0]==='ball'&&soccer.classMap[1]==='player'&&soccer.classMap[2]==='referee'&&soccer.classMap[3]==='goalkeeper','documented four-class map is pinned');
ok(R.promotionVerdict('rfdetr-soccernet-julianzu9612',pass,provenance).reason==='BROWSER_EXPORT_VERIFICATION_REQUIRED','SoccerNet cannot become runtime eligible from model-card metadata alone');
ok(R.promotionVerdict('rfdetr-soccernet-julianzu9612',pass,provenance,{browserExportReport:{...browserExport,weightId:'sha256:other'}}).reason==='BROWSER_EXPORT_WEIGHT_MISMATCH','browser export must match the exact benchmarked/provenance weight');
ok(R.promotionVerdict('rfdetr-soccernet-julianzu9612',pass,provenance,{browserExportReport:browserExport}).allowed===true,'exact verified browser export + provenance + real-video benchmark can become eligible');
ok(R.promotionVerdict('unknown',pass,provenance).reason==='UNKNOWN_CANDIDATE','unknown detector is never silently accepted');
assert.throws(()=>R.assertPromotable('rfdetr-core-apache',fail,provenance),e=>e&&e.code==='CAY_DETECTOR_PROMOTION_BLOCKED');checks++;

console.log(`${checks}/${checks} detector candidate registry non-regression: PASS`);
