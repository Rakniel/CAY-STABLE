const assert=require('assert');
const {evaluate,sequenceSetId}=require('../tracking_candidate_promotion_gate_v1.js');

const sequenceIds=['cay-wide-pan-01','cay-zoom-02','cay-crowded-03','cay-multiplan-04'];
const baseline={hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds};

{
  const r=evaluate(baseline,{hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds:[...sequenceIds].reverse()});
  assert.equal(r.status,'PROMOTE');
  assert.equal(r.promote,true);
  assert.equal(r.delta.hota,1);
  assert.equal(r.delta.idSwitches,-2);
  assert.equal(r.sequenceSetId,sequenceSetId(baseline));
}

{
  const r=evaluate(baseline,{hota:75,idf1:76,mota:73,idSwitches:6,falseCay:1,benchSpectatorFalseTracks:0,sequences:4,sequenceIds});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('FALSE_CAY_REGRESSION'));
}

{
  const r=evaluate(baseline,{hota:72,idf1:73,mota:70,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:1,sequences:4,sequenceIds});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('BENCH_SPECTATOR_REGRESSION'));
}

{
  const r=evaluate(baseline,{hota:70.2,idf1:72.3,mota:68.2,idSwitches:9,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('HOTA_GAIN_TOO_SMALL'));
}

{
  const shortIds=sequenceIds.slice(0,2);
  const r=evaluate({...baseline,sequences:2,sequenceIds:shortIds},{hota:72,idf1:73,mota:69,idSwitches:9,falseCay:0,benchSpectatorFalseTracks:0,sequences:2,sequenceIds:shortIds});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'NOT_ENOUGH_CAY_SEQUENCES');
}

{
  const r=evaluate(baseline,{hota:72,idf1:73,mota:69,idSwitches:9,falseCay:0,sequences:4,sequenceIds});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.missing.includes('candidate.benchSpectatorFalseTracks'));
}

{
  const easierSet=['cay-wide-pan-01','cay-zoom-02','cay-clean-05','cay-clean-06'];
  const r=evaluate(baseline,{hota:80,idf1:80,mota:80,idSwitches:2,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds:easierSet});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'CAY_SEQUENCE_SET_MISMATCH');
}

{
  const noManifest={hota:80,idf1:80,mota:80,idSwitches:2,falseCay:0,benchSpectatorFalseTracks:0,sequences:4};
  const r=evaluate(baseline,noManifest);
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.missing.includes('candidate.sequenceSetId|sequenceIds'));
}

{
  const byManifest={hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceSetId:'cay-benchmark-v1'};
  const r=evaluate(byManifest,{hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceManifestId:'cay-benchmark-v1'});
  assert.equal(r.status,'PROMOTE');
}

console.log('tracking_candidate_promotion_gate_nonregression: PASS');
