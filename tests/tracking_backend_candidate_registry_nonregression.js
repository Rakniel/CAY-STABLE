'use strict';
const assert=require('assert');
const Registry=require('../tracking_backend_candidate_registry_v1.js');

assert.strictEqual(Registry.runtimeLicenseCompatible('roboflow-trackers-apache'),true,'Apache backend must be license-compatible');
assert.strictEqual(Registry.runtimeLicenseCompatible('cameltrack-apache'),true,'CAMELTrack Apache code candidate must be license-compatible at repository level');
assert.strictEqual(Registry.runtimeLicenseCompatible('sportslabkit-gpl'),false,'GPL backend must remain reference-only');
assert.strictEqual(Registry.runtimeLicenseCompatible('soccertrack-v2-benchmark'),false,'dataset/license bundle is not a runtime backend license');
assert.strictEqual(Registry.runtimeLicenseCompatible({license:'MIT'}),true,'central guard must allow MIT tracking backends');
assert.strictEqual(Registry.runtimeLicenseCompatible({license:'ISC'}),true,'tracking registry must inherit new permissive licenses from the central guard');
assert.strictEqual(Registry.runtimeLicenseCompatible({license:'CAY-INTERNAL'}),true,'explicit CAY internal providers must remain allowed');
assert.strictEqual(Registry.runtimeLicenseCompatible({license:'Proprietary'}),false,'unknown/proprietary tracking licenses must fail closed');
assert.strictEqual(Registry.runtimeLicenseCompatible({license:''}),false,'missing tracking licenses must fail closed');
assert.strictEqual(Registry.runtimeLicenseCompatible({license:'MIT AND Unknown-1.0'}),false,'mixed unrecognized tracking license expressions must fail closed');
assert.strictEqual(Registry.runtimeLicenseVerdict({license:'Proprietary'}).reason,'LICENSE_NOT_ALLOWLISTED');

const roboflow=Registry.get('roboflow-trackers-apache');
assert.strictEqual(Registry.version,'1.5.0');
assert.strictEqual(roboflow.upstreamVersion,'2.6.0','registry must match the audited Roboflow release');
assert.strictEqual(roboflow.upstreamRevision,'0e839f348d8bf4ed09eea9f3bef58fd5f95dca3f','registry must pin the immutable audited revision');
assert.strictEqual(roboflow.releaseDate,'2026-08-06');
assert.strictEqual(roboflow.timestampSupport,true,'2.6.0 timestamp-aware update support must be explicit');
assert.strictEqual(roboflow.cameraMotionCapability,'CMC');
assert.deepStrictEqual(roboflow.algorithms,['ByteTrack','BoT-SORT','OC-SORT','SORT','CBIoU','McByte']);
assert.strictEqual(roboflow.runtimeDefaultAllowed,false,'external Python tracker remains benchmark-only');
assert.strictEqual(roboflow.requiresCanonicalPromotionGate,true,'benchmark backend must use the canonical full promotion chain');

const camel=Registry.get('cameltrack-apache');
assert.strictEqual(camel.status,'BENCHMARK_ONLY');
assert.strictEqual(camel.runtimeDefaultAllowed,false);
assert.strictEqual(camel.requiresDependencyAudit,true);
assert.strictEqual(camel.requiresIdentityBenchmark,true);
assert.strictEqual(camel.requiresCanonicalPromotionGate,true);
assert.strictEqual(camel.upstreamVersion,'46a74bb22a28d2d699b4c5c5e317a26d3b87f1e2');

const good={beforeIdSwitchRate:.12,afterIdSwitchRate:.08,frames:1200,reidAttempts:12,beforeReidRecoveryRate:.70,afterReidRecoveryRate:.83,beforeFailedReidentifications:4,afterFailedReidentifications:2,crossSegmentAttempts:5,beforeCrossSegmentRecoveryRate:.60,afterCrossSegmentRecoveryRate:.80};
const canonical={
  version:Registry.CANONICAL_PROMOTION_VERSION,
  status:'PROMOTE',promote:true,
  reason:'TRACKING_TRAJECTORY_AND_PERSISTENT_IDENTITY_GATES_PASSED',
  trackingAndTrajectory:{promote:true,tracking:{promote:true,inputParity:{pass:true}},trajectory:{pass:true}},
  persistentIdentity:{pass:true}
};
assert.strictEqual(Registry.canonicalPromotionValid(canonical),true,'canonical full promotion result must be accepted');

let verdict=Registry.promotionVerdict('roboflow-trackers-apache',null,{compatible:true});
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'CANONICAL_PROMOTION_GATE_REQUIRED');

verdict=Registry.promotionVerdict('cameltrack-apache',good,{compatible:false},canonical);
assert.strictEqual(verdict.allowed,false,'repository license alone must not bypass dependency/model audit');
assert.strictEqual(verdict.reason,'DEPENDENCY_AUDIT_REQUIRED');

verdict=Registry.promotionVerdict('cameltrack-apache',good,{compatible:true});
assert.strictEqual(verdict.allowed,false,'legacy real-video summary must not bypass the canonical promotion chain');
assert.strictEqual(verdict.reason,'CANONICAL_PROMOTION_GATE_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',good,{compatible:false},canonical);
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'DEPENDENCY_AUDIT_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',good,{compatible:true});
assert.strictEqual(verdict.allowed,false,'legacy short/long-term summary alone must not promote a tracker');
assert.strictEqual(verdict.reason,'CANONICAL_PROMOTION_GATE_REQUIRED');

verdict=Registry.promotionVerdict('roboflow-trackers-apache',good,{compatible:true},canonical);
assert.strictEqual(verdict.allowed,true);
assert.strictEqual(verdict.reason,'OPTIONAL_BACKEND_ELIGIBLE');
assert.strictEqual(verdict.candidate.status,'ELIGIBLE_AFTER_CANONICAL_BENCHMARK');
assert.strictEqual(verdict.candidate.upstreamVersion,'2.6.0');
assert.strictEqual(verdict.candidate.upstreamRevision,'0e839f348d8bf4ed09eea9f3bef58fd5f95dca3f');
assert.strictEqual(verdict.candidate.preferredProfiles.cameraMotion,'BoT-SORT');
assert.strictEqual(verdict.canonicalPromotionVersion,Registry.CANONICAL_PROMOTION_VERSION);

const missingParity={...canonical,trackingAndTrajectory:{...canonical.trackingAndTrajectory,tracking:{promote:true,inputParity:{pass:false}}}};
assert.strictEqual(Registry.canonicalPromotionValid(missingParity),false,'canonical evidence must retain benchmark input parity');
assert.strictEqual(Registry.promotionVerdict('roboflow-trackers-apache',good,{compatible:true},missingParity).reason,'CANONICAL_PROMOTION_GATE_REQUIRED');

const missingTrajectory={...canonical,trackingAndTrajectory:{...canonical.trackingAndTrajectory,trajectory:{pass:false}}};
assert.strictEqual(Registry.canonicalPromotionValid(missingTrajectory),false,'trajectory regression must not be bypassed by the backend registry');

const missingPersistentIdentity={...canonical,persistentIdentity:{pass:false}};
assert.strictEqual(Registry.canonicalPromotionValid(missingPersistentIdentity),false,'persistent identity regression must not be bypassed by the backend registry');

const identityRegression={...good,afterReidRecoveryRate:.65};
assert.strictEqual(Registry.identityBenchmarkValid(identityRegression),false,'legacy diagnostic helper must still detect persistent ReID regression');

const crossSegmentRegression={...good,afterCrossSegmentRecoveryRate:.40};
assert.strictEqual(Registry.identityBenchmarkValid(crossSegmentRegression),false,'camera-plan identity regression must remain visible in legacy diagnostics');

const tooFewReidEpisodes={...good,reidAttempts:2};
assert.strictEqual(Registry.identityBenchmarkValid(tooFewReidEpisodes),false,'too few ReID opportunities must remain non-evaluable');

verdict=Registry.promotionVerdict('sportslabkit-gpl',good,{compatible:true},canonical);
assert.strictEqual(verdict.allowed,false);
assert.strictEqual(verdict.reason,'LICENSE_REFERENCE_ONLY');
assert.strictEqual(verdict.licenseVerdict.allowed,false);
assert.strictEqual(verdict.licenseVerdict.reason,'LICENSE_NOT_ALLOWLISTED');

assert.strictEqual(Registry.shortTermBenchmarkValid({...good,frames:299}),false,'legacy diagnostic helper must reject short benchmark');
assert.strictEqual(Registry.shortTermBenchmarkValid({...good,afterIdSwitchRate:.13}),false,'legacy diagnostic helper must reject no measurable ID-switch gain');
assert.strictEqual(Registry.benchmarkReportValid(good),true,'legacy diagnostics remain available but are no longer sufficient for promotion');

console.log('tracking backend candidate registry non-regression: PASS');
