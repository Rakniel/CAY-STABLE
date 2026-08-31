'use strict';
const assert=require('assert');
const Registry=require('../tracking_backend_candidate_registry_v1.js');

assert.strictEqual(Registry.runtimeLicenseCompatible('roboflow-trackers-apache'),true,'Apache backend must be license-compatible');
assert.strictEqual(Registry.runtimeLicenseCompatible('sportslabkit-gpl'),false,'GPL backend must remain reference-only');
assert.strictEqual(Registry.runtimeLicenseCompatible('soccertrack-v2-benchmark'),false,'dataset/license bundle is not a runtime backend license');

let verdict=Registry.promotionVerdict('roboflow-trackers-apache',null,{compatible:true});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'REAL_VIDEO_GAIN_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',{beforeIdSwitchRate:.12,afterIdSwitchRate:.08,frames:1200},{compatible:false});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'DEPENDENCY_AUDIT_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',{beforeIdSwitchRate:.12,afterIdSwitchRate:.08,frames:1200},{compatible:true});
assert.strictEqual(verdict.allowed,true);
assert.strictEqual(verdict.reason,'OPTIONAL_BACKEND_ELIGIBLE');

verdict=Registry.promotionVerdict('sportslabkit-gpl',{beforeIdSwitchRate:.12,afterIdSwitchRate:.01,frames:1200},{compatible:true});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'LICENSE_REFERENCE_ONLY');

assert.strictEqual(Registry.benchmarkReportValid({beforeIdSwitchRate:.1,afterIdSwitchRate:.09,frames:299}),false,'short benchmark must be rejected');
assert.strictEqual(Registry.benchmarkReportValid({beforeIdSwitchRate:.1,afterIdSwitchRate:.11,frames:1000}),false,'no measurable gain must be rejected');

console.log('tracking backend candidate registry non-regression: PASS');
