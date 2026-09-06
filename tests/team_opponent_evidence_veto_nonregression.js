const assert=require('assert');
const Guard=require('../team_opponent_evidence_veto_v1.js');

{
  const r=Guard.evaluateCayEvidence({cayEvidence:true,cayEvidenceSources:['yellow-detail']});
  assert.strictEqual(r.reject,true);
  assert.strictEqual(r.cayEligible,false);
  assert.strictEqual(r.reason,'yellow_detail_cannot_prove_cay');
}

{
  const r=Guard.evaluateCayEvidence({teamClassification:'cay',teamEvidenceSources:['jaune-accent','yellow-pixel-cluster']});
  assert.strictEqual(r.reject,true,'plusieurs sources restent insuffisantes si elles ne prouvent que du jaune');
}

{
  const r=Guard.evaluateCayEvidence({cayEvidence:true,cayEvidenceSources:['yellow-detail','reid-cluster']});
  assert.strictEqual(r.reject,false,'une preuve indépendante non-jaune empêche le veto yellow-only');
}

{
  const r=Guard.evaluateCayEvidence({cayEvidence:true});
  assert.strictEqual(r.reject,false,'absence de provenance jaune explicite ne doit pas casser le pipeline historique');
}

{
  const r=Guard.evaluate({opponentEvidence:true,opponentEvidenceConfidence:.94,opponentEvidenceSources:['kit-cluster','reid-cluster']});
  assert.strictEqual(r.veto,true);
  assert.strictEqual(r.cayEligible,false);
}

{
  const r=Guard.evaluate({opponentEvidence:true,opponentEvidenceConfidence:.94,opponentEvidenceSources:['kit-cluster']});
  assert.strictEqual(r.veto,false);
  assert.strictEqual(r.reason,'opponent_evidence_not_independent_enough');
}

{
  const r=Guard.evaluate({opponentEvidence:true,opponentEvidenceConfidence:.62,opponentEvidenceSources:['kit-cluster','reid-cluster']});
  assert.strictEqual(r.veto,false);
  assert.strictEqual(r.reason,'opponent_evidence_confidence_too_low');
}

{
  const r=Guard.evaluate({opponentEvidence:true,cayEvidence:true,opponentEvidenceConfidence:.96,opponentEvidenceSources:['kit-cluster','reid-cluster']});
  assert.strictEqual(r.veto,false);
  assert.strictEqual(r.reason,'conflicting_team_evidence');
}

{
  const r=Guard.evaluate({opponentEvidence:true,role:'goalkeeper',opponentEvidenceConfidence:.98,opponentEvidenceSources:['kit-cluster','reid-cluster']});
  assert.strictEqual(r.veto,false);
  assert.strictEqual(r.reason,'goalkeeper_requires_explicit_policy');
}

{
  const r=Guard.apply({id:'p1',opponentEvidence:true,opponentEvidenceConfidence:.97,opponentEvidenceSources:['kit-cluster','appearance-cluster']});
  assert.strictEqual(r.cayEligible,false);
  assert.strictEqual(r.teamEvidenceValid,false);
  assert.strictEqual(r.opponentVetoDecision.policy,'opponent_veto_never_positive_cay');
}

{
  const r=Guard.apply({id:'yellow-false-cay',cayEvidence:true,cayEvidenceSources:['yellow-detail']});
  assert.strictEqual(r.cayEligible,false);
  assert.strictEqual(r.teamEvidenceValid,false);
  assert.strictEqual(r.cayEvidenceDecision.policy,'yellow_is_never_positive_cay_evidence');
  assert.strictEqual(r.rejectionReason,'yellow_detail_cannot_prove_cay');
}

{
  const r=Guard.filter([
    {id:'cay',cayEvidence:true,cayEvidenceSources:['manual-roster']},
    {id:'yellow',cayEvidence:true,cayEvidenceSources:['yellow-detail']},
    {id:'opp',opponentEvidence:true,opponentEvidenceConfidence:.95,opponentEvidenceSources:['kit','appearance']}
  ]);
  assert.deepStrictEqual(r.accepted.map(x=>x.id),['cay']);
  assert.deepStrictEqual(r.rejected.map(x=>x.id),['yellow','opp']);
}

console.log('team_opponent_evidence_veto_nonregression: OK');
