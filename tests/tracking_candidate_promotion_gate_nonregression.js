const assert=require('assert');
const {evaluate,evaluateLabelledIdentityEvidence,sequenceSetId,compareBenchmarkInputs}=require('../tracking_candidate_promotion_gate_v1.js');

const sequenceIds=['cay-wide-pan-01','cay-zoom-02','cay-crowded-03','cay-multiplan-04'];
const benchmarkInputs={detectorArtifactId:'cay-detector-rfdetr-v1-fixture-a',frameSetId:'cay-frame-set-20260912-a',timestampMode:'FIXED_RATE',referenceFrameRate:25};
const baseline={...benchmarkInputs,hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds};

{
  const r=evaluate(baseline,{...benchmarkInputs,hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds:[...sequenceIds].reverse()});
  assert.equal(r.status,'PROMOTE');
  assert.equal(r.promote,true);
  assert.equal(r.delta.hota,1);
  assert.equal(r.delta.idSwitches,-2);
  assert.equal(r.sequenceSetId,sequenceSetId(baseline));
  assert.equal(r.inputParity.pass,true);
}

{
  const r=evaluate(baseline,{...baseline,hota:75,idf1:76,mota:73,idSwitches:6,falseCay:1});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('FALSE_CAY_REGRESSION'));
}

{
  const r=evaluate(baseline,{...baseline,hota:72,idf1:73,mota:70,idSwitches:8,benchSpectatorFalseTracks:1});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('BENCH_SPECTATOR_REGRESSION'));
}

{
  const r=evaluate(baseline,{...baseline,hota:70.2,idf1:72.3,mota:68.2,idSwitches:9});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('HOTA_GAIN_TOO_SMALL'));
}

{
  const shortIds=sequenceIds.slice(0,2);
  const r=evaluate({...baseline,sequences:2,sequenceIds:shortIds},{...baseline,hota:72,idf1:73,mota:69,idSwitches:9,sequences:2,sequenceIds:shortIds});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'NOT_ENOUGH_CAY_SEQUENCES');
}

{
  const r=evaluate(baseline,{...baseline,hota:72,idf1:73,mota:69,idSwitches:9,benchSpectatorFalseTracks:undefined});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.missing.includes('candidate.benchSpectatorFalseTracks'));
}

{
  const easierSet=['cay-wide-pan-01','cay-zoom-02','cay-clean-05','cay-clean-06'];
  const r=evaluate(baseline,{...baseline,hota:80,idf1:80,mota:80,idSwitches:2,sequenceIds:easierSet});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'CAY_SEQUENCE_SET_MISMATCH');
}

{
  const noManifest={...benchmarkInputs,hota:80,idf1:80,mota:80,idSwitches:2,falseCay:0,benchSpectatorFalseTracks:0,sequences:4};
  const r=evaluate(baseline,noManifest);
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.missing.includes('candidate.sequenceSetId|sequenceIds'));
}

{
  const byManifest={...benchmarkInputs,hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceSetId:'cay-benchmark-v1'};
  const r=evaluate(byManifest,{...benchmarkInputs,hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceManifestId:'cay-benchmark-v1'});
  assert.equal(r.status,'PROMOTE');
}

{
  const r=evaluate(baseline,{...baseline,hota:90,idf1:90,mota:90,idSwitches:1,detectorArtifactId:'different-detector-output'});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'BENCHMARK_INPUT_MISMATCH');
  assert(r.inputParity.mismatch.includes('DETECTOR_ARTIFACT_MISMATCH'));
}

{
  const r=evaluate(baseline,{...baseline,hota:90,idf1:90,mota:90,idSwitches:1,timestampMode:'CAPTURE_TIME',timestampSetId:'cay-capture-clock-a'});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.inputParity.mismatch.includes('TIMESTAMP_MODE_MISMATCH'));
}

{
  const dynamicA={...benchmarkInputs,timestampMode:'CAPTURE_TIME',timestampSetId:'cay-capture-clock-a'};
  const dynamicB={...dynamicA,timestampSetId:'cay-capture-clock-b'};
  const r=compareBenchmarkInputs(dynamicA,dynamicB);
  assert.equal(r.pass,false);
  assert(r.mismatch.includes('TIMESTAMP_SET_MISMATCH'));
}

{
  const missingTiming={detectorArtifactId:'det',frameSetId:'frames',timestampMode:'FIXED_RATE'};
  const r=compareBenchmarkInputs(missingTiming,missingTiming);
  assert.equal(r.pass,false);
  assert(r.missing.includes('baseline.referenceFrameRate'));
}

const labelledBaseline={...benchmarkInputs,status:'DISPONIBLE',totalSamples:320,validSamples:320,comparableTransitions:300,idSwitches:6,fragments:4,labelledCoverage:1,coverage:1,falseCay:0,benchSpectatorFalseTracks:0,sequenceIds};

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3});
  assert.equal(r.status,'PRECHECK_PASS');
  assert.equal(r.pass,true);
  assert.equal(r.fullPromotion,false);
  assert.equal(r.delta.idSwitches,-3);
  assert.equal(r.delta.fragments,0);
  assert.equal(r.inputParity.pass,true);
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3,fragments:5});
  assert.equal(r.status,'PRECHECK_REJECT');
  assert.equal(r.pass,false);
  assert.equal(r.delta.idSwitches,-3);
  assert.equal(r.delta.fragments,1);
  assert(r.blockers.includes('IDENTITY_FRAGMENTATION_REGRESSION'));
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:6});
  assert.equal(r.status,'PRECHECK_REJECT');
  assert(r.blockers.includes('IDENTITY_SWITCH_NOT_IMPROVED'));
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,validSamples:310,labelledCoverage:310/320,coverage:310/320,idSwitches:3});
  assert.equal(r.status,'PRECHECK_REJECT');
  assert(r.blockers.includes('IDENTITY_COVERAGE_REGRESSION'));
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3,falseCay:1});
  assert.equal(r.status,'PRECHECK_REJECT');
  assert(r.blockers.includes('FALSE_CAY_REGRESSION'));
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3,benchSpectatorFalseTracks:1});
  assert.equal(r.status,'PRECHECK_REJECT');
  assert(r.blockers.includes('BENCH_SPECTATOR_REGRESSION'));
}

{
  const small={...labelledBaseline,totalSamples:299,validSamples:299,comparableTransitions:280};
  const r=evaluateLabelledIdentityEvidence(small,{...small,idSwitches:3});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'NOT_ENOUGH_LABELLED_CAY_SAMPLES');
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,totalSamples:321,validSamples:321,comparableTransitions:301,idSwitches:3,coverage:1,labelledCoverage:1});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'CAY_LABELLED_SAMPLE_SET_MISMATCH');
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3,sequenceIds:['different-set']});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'CAY_SEQUENCE_SET_MISMATCH');
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3,fragments:undefined});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.missing.includes('candidate.fragments'));
}

{
  const r=evaluateLabelledIdentityEvidence(labelledBaseline,{...labelledBaseline,idSwitches:3,frameSetId:'different-frames'});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'BENCHMARK_INPUT_MISMATCH');
  assert(r.inputParity.mismatch.includes('FRAME_SET_MISMATCH'));
}

console.log('tracking_candidate_promotion_gate_nonregression: PASS');
