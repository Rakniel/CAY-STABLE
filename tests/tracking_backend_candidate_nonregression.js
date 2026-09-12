'use strict';
const assert=require('assert');
const Candidate=require('../tracking_backend_candidate_v1.js');

const roboflow={
  project:'roboflow/trackers',
  sourceUrl:'https://github.com/roboflow/trackers',
  version:'2.6.0',
  revision:'0e839f348d8bf4ed09eea9f3bef58fd5f95dca3f',
  license:'Apache-2.0',
  algorithms:['ByteTrack','BoT-SORT'],
  runtime:'external-python',
  timestampSupport:true,
  cameraMotion:'CMC',
  weightsBundled:false,
  optionalWeights:true
};

let r=Candidate.inspect(roboflow);
assert.equal(r.accepted,true);
assert.equal(r.status,'ELIGIBLE_FOR_BENCHMARK');
assert.deepEqual(r.algorithms,['BYTETRACK','BOT-SORT']);
assert.equal(r.timestampSupport,true);
assert.equal(r.requiresSeparateWeightAudit,true);

r=Candidate.inspect({...roboflow,license:'AGPL-3.0'});
assert.equal(r.accepted,false);
assert.equal(r.reason,'LICENSE_NOT_ALLOWLISTED');

r=Candidate.inspect({...roboflow,revision:''});
assert.equal(r.accepted,false);
assert.equal(r.reason,'PROVENANCE_INCOMPLETE');
assert(r.missing.includes('revision'));

r=Candidate.inspect({...roboflow,runtime:'browser'});
assert.equal(r.accepted,false);
assert.equal(r.reason,'RUNTIME_BOUNDARY_NOT_EXPLICIT');

r=Candidate.inspect({...roboflow,cameraMotion:'NONE'});
assert.equal(r.accepted,false);
assert.equal(r.reason,'BOTSORT_CAMERA_MOTION_CAPABILITY_MISSING');

r=Candidate.inspect({...roboflow,algorithms:['DeepOCSORT']});
assert.equal(r.accepted,false);
assert.equal(r.reason,'ALGORITHM_NOT_SUPPORTED');

assert.equal(Candidate.VERSION,'CAY_TRACKING_BACKEND_CANDIDATE_V1_0');
console.log('tracking backend candidate non-regression: PASS');
