'use strict';
const assert=require('assert');
const Guard=require('../team_opponent_evidence_veto_v1.js');
const Bridge=require('../stable_tracking_bridge_v1.js');
const conflict={id:'conflict',cayEvidence:true,opponentEvidence:true,opponentEvidenceConfidence:.98,opponentEvidenceSources:['kit','appearance']};
{
 const r=Guard.evaluate(conflict);
 assert.strictEqual(r.veto,false);
 assert.strictEqual(r.reason,'conflicting_team_evidence');
}
{
 const r=Guard.apply(conflict);
 assert.strictEqual(r.cayEligible,false);
 assert.strictEqual(r.teamEvidenceValid,false);
 assert.strictEqual(r.teamEvidenceConflict,true);
 assert.strictEqual(r.teamReviewStatus,'A_VERIFIER');
 assert.strictEqual(r.rejectionReason,'conflicting_team_evidence');
 assert.strictEqual(r.opponentVetoDecision.veto,false);
 assert.deepStrictEqual(Bridge.detectionEligibility(conflict),{accepted:false,reason:'conflicting_team_evidence'});
}
{
 const rows=Guard.filter([
  {id:'cay',cayEvidence:true,cayEvidenceSources:['manual-roster']},
  conflict,
  {id:'yellow',cayEvidence:true,cayEvidenceSources:['yellow-detail']},
  {id:'opponent',opponentEvidence:true,opponentEvidenceConfidence:.96,opponentEvidenceSources:['kit','appearance']},
  {id:'uncertain',opponentEvidence:true,opponentEvidenceConfidence:.51,opponentEvidenceSources:['kit','appearance']}
 ]);
 assert.deepStrictEqual(rows.accepted.map(x=>x.id),['cay','uncertain']);
 assert.deepStrictEqual(rows.rejected.map(x=>x.id),['conflict','yellow','opponent']);
}
{
 const gk=Guard.apply({...conflict,id:'gk',isGoalkeeper:true});
 assert.strictEqual(gk.teamEvidenceConflict,true);
 assert.strictEqual(Bridge.detectionEligibility(gk).accepted,false);
}
{
 assert.strictEqual(Bridge.detectionEligibility({cayEvidence:true,cayEvidenceSources:['manual-roster']}).accepted,true);
 assert.strictEqual(Bridge.detectionEligibility({cayEvidence:true,cayEvidenceSources:['yellow-detail']}).accepted,false);
 assert.strictEqual(Bridge.detectionEligibility({opponentEvidence:true,opponentEvidenceConfidence:.96,opponentEvidenceSources:['kit','appearance']}).accepted,false);
 assert.strictEqual(Bridge.detectionEligibility({isBench:true}).accepted,false);
 assert.strictEqual(Bridge.detectionEligibility({isSpectator:true}).accepted,false);
}
console.log('team_opponent_conflict_quarantine_nonregression: PASS');
