const assert=require('assert');
const {evaluate}=require('../tracking_candidate_promotion_gate_v1.js');

const baseline={hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4};

{
  const r=evaluate(baseline,{hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4});
  assert.equal(r.status,'PROMOTE');
  assert.equal(r.promote,true);
  assert.equal(r.delta.hota,1);
  assert.equal(r.delta.idSwitches,-2);
}

{
  const r=evaluate(baseline,{hota:75,idf1:76,mota:73,idSwitches:6,falseCay:1,benchSpectatorFalseTracks:0,sequences:4});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('FALSE_CAY_REGRESSION'));
}

{
  const r=evaluate(baseline,{hota:72,idf1:73,mota:70,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:1,sequences:4});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('BENCH_SPECTATOR_REGRESSION'));
}

{
  const r=evaluate(baseline,{hota:70.2,idf1:72.3,mota:68.2,idSwitches:9,falseCay:0,benchSpectatorFalseTracks:0,sequences:4});
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('HOTA_GAIN_TOO_SMALL'));
}

{
  const r=evaluate(baseline,{hota:72,idf1:73,mota:69,idSwitches:9,falseCay:0,benchSpectatorFalseTracks:0,sequences:2});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'NOT_ENOUGH_CAY_SEQUENCES');
}

{
  const r=evaluate(baseline,{hota:72,idf1:73,mota:69,idSwitches:9,falseCay:0,sequences:4});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert(r.missing.includes('candidate.benchSpectatorFalseTracks'));
}

console.log('tracking_candidate_promotion_gate_nonregression: PASS');
