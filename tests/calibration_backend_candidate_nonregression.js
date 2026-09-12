'use strict';
const assert=require('assert');
const Candidate=require('../calibration_backend_candidate_v1.js');

const opencv={
  project:'opencv/opencv',
  sourceUrl:'https://github.com/opencv/opencv',
  version:'5.0.0',
  revision:'40738fb16ceddb5fb3fea747585f7ce6abb0605b',
  license:'Apache-2.0',
  capabilities:['homography','RANSAC','camera calibration','lens distortion'],
  runtime:'native-offline',
  codeImported:false,
  weightsBundled:false,
  optionalWeights:false
};

let r=Candidate.inspect(opencv);
assert.strictEqual(r.accepted,true);
assert.strictEqual(r.status,'ELIGIBLE_FOR_BENCHMARK');
assert.strictEqual(r.upstreamVersion,'5.0.0');
assert.strictEqual(r.revision,'40738fb16ceddb5fb3fea747585f7ce6abb0605b');
assert.deepStrictEqual(r.capabilities,['HOMOGRAPHY','RANSAC','CAMERA_CALIBRATION','LENS_DISTORTION']);
assert.strictEqual(r.requiresRealCayBenchmark,true);
assert.strictEqual(r.requiresMetricTrajectoryValidation,true);

r=Candidate.inspect({...opencv,license:''});
assert.strictEqual(r.accepted,false);
assert.strictEqual(r.reason,'PROVENANCE_INCOMPLETE');
assert(r.missing.includes('license'));

r=Candidate.inspect({...opencv,license:'GPL-3.0'});
assert.strictEqual(r.accepted,false);
assert.strictEqual(r.reason,'LICENSE_NOT_ALLOWLISTED');

r=Candidate.inspect({...opencv,runtime:'browser'});
assert.strictEqual(r.accepted,false);
assert.strictEqual(r.reason,'RUNTIME_BOUNDARY_NOT_EXPLICIT');

r=Candidate.inspect({...opencv,capabilities:['homography','magic-field-model']});
assert.strictEqual(r.accepted,false);
assert.strictEqual(r.reason,'CAPABILITY_NOT_SUPPORTED');

r=Candidate.inspect({...opencv,optionalWeights:true});
assert.strictEqual(r.accepted,false);
assert.strictEqual(r.reason,'WEIGHTS_LICENSE_AUDIT_REQUIRED');

r=Candidate.inspect({...opencv,optionalWeights:true,weightsLicense:'MIT'});
assert.strictEqual(r.accepted,true);

const soccernetWithoutLicense={
  project:'SoccerNet/sn-calibration',
  sourceUrl:'https://github.com/SoccerNet/sn-calibration',
  version:'main-audit-2026-09-12',
  revision:'unlicensed-source-reference-only',
  license:'',
  capabilities:['homography','camera calibration'],
  runtime:'external-python'
};
r=Candidate.inspect(soccernetWithoutLicense);
assert.strictEqual(r.accepted,false,'a useful repository without an explicit compatible code license must never be admitted for code reuse');
assert.strictEqual(r.reason,'PROVENANCE_INCOMPLETE');

assert.strictEqual(Candidate.VERSION,'CAY_CALIBRATION_BACKEND_CANDIDATE_V1_0');
console.log('calibration backend candidate non-regression: PASS');
