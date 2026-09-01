'use strict';
const assert=require('assert');
const Registry=require('../tracking_backend_candidate_registry_v1.js');

assert.strictEqual(Registry.runtimeLicenseCompatible('roboflow-trackers-apache'),true,'Apache backend must be license-compatible');
assert.strictEqual(Registry.runtimeLicenseCompatible('sportslabkit-gpl'),false,'GPL backend must remain reference-only');
assert.strictEqual(Registry.runtimeLicenseCompatible('soccertrack-v2-benchmark'),false,'dataset/license bundle is not a runtime backend license');

const good={beforeIdSwitchRate:.12,afterIdSwitchRate:.08,frames:1200,reidAttempts:12,beforeReidRecoveryRate:.70,afterReidRecoveryRate:.83,beforeFailedReidentifications:4,afterFailedReidentifications:2,crossSegmentAttempts:5,beforeCrossSegmentRecoveryRate:.60,afterCrossSegmentRecoveryRate:.80};

let verdict=Registry.promotionVerdict('roboflow-trackers-apache',null,{compatible:true});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'REAL_VIDEO_GAIN_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',good,{compatible:false});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'DEPENDENCY_AUDIT_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',{beforeIdSwitchRate:.12,afterIdSwitchRate:.08,frames:1200},{compatible:true});
assert.strictEqual(verdict.allowed,false,'short-term gain alone must not promote a tracker');
assert.strictEqual(verdict.reason,'PERSISTENT_IDENTITY_GAIN_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',good,{compatible:true});
assert.strictEqual(verdict.allowed,true);
assert.strictEqual(verdict.reason,'OPTIONAL_BACKEND_ELIGIBLE');
assert.strictEqual(verdict.candidate.upstreamVersion,'2.4.0');
assert.strictEqual(verdict.candidate.preferredProfiles.cameraMotion,'BoT-SORT');

const identityRegression={...good,afterReidRecoveryRate:.65};
assert.strictEqual(Registry.identityBenchmarkValid(identityRegression),false,'persistent ReID regression must block promotion');
assert.strictEqual(Registry.promotionVerdict('roboflow-trackers-apache',identityRegression,{compatible:true}).reason,'PERSISTENT_IDENTITY_GAIN_REQUIRED');

const crossSegmentRegression={...good,afterCrossSegmentRecoveryRate:.40};
assert.strictEqual(Registry.identityBenchmarkValid(crossSegmentRegression),false,'camera-plan identity regression must block promotion');

const tooFewReidEpisodes={...good,reidAttempts:2};
assert.strictEqual(Registry.identityBenchmarkValid(tooFewReidEpisodes),false,'too few ReID opportunities must remain non-evaluable');

verdict=Registry.promotionVerdict('sportslabkit-gpl',good,{compatible:true});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'LICENSE_REFERENCE_ONLY');

assert.strictEqual(Registry.shortTermBenchmarkValid({...good,frames:299}),false,'short benchmark must be rejected');
assert.strictEqual(Registry.shortTermBenchmarkValid({...good,afterIdSwitchRate:.13}),false,'no measurable ID-switch gain must be rejected');
assert.strictEqual(Registry.benchmarkReportValid(good),true,'combined short and long-term benchmark must be accepted');

console.log('tracking backend candidate registry non-regression: PASS');
