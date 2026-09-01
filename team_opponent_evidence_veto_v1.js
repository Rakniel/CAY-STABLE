(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTeamOpponentEvidenceVeto=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));

  function normalizeSources(input){
    if(!Array.isArray(input))return [];
    return [...new Set(input.map(x=>String(x||'').trim().toLowerCase()).filter(Boolean))];
  }

  function evaluate(detection,options){
    const d=detection||{},opts=options||{};
    const minConfidence=Math.max(.5,Math.min(.99,Number.isFinite(Number(opts.minConfidence))?Number(opts.minConfidence):.86));
    const minIndependentSources=Math.max(2,Math.min(4,Number.isFinite(Number(opts.minIndependentSources))?Math.round(Number(opts.minIndependentSources)):2));
    const sources=normalizeSources(d.opponentEvidenceSources||d.teamEvidenceSources);
    const confidence=clamp01(d.opponentEvidenceConfidence);
    const explicitOpponent=d.opponentEvidence===true||d.teamClassification==='opponent'||d.teamLabel==='opponent';
    const explicitCay=d.cayEvidence===true||d.teamClassification==='cay'||d.teamLabel==='cay';
    const protectedRole=d.isGoalkeeper===true||String(d.role||'').toLowerCase()==='goalkeeper';

    if(!explicitOpponent)return {veto:false,reason:null,confidence,sources,policy:'negative_evidence_only'};
    if(explicitCay)return {veto:false,reason:'conflicting_team_evidence',confidence,sources,policy:'manual_review_on_conflict'};
    if(protectedRole&&opts.allowGoalkeeperVeto!==true)return {veto:false,reason:'goalkeeper_requires_explicit_policy',confidence,sources,policy:'goalkeeper_guard'};
    if(confidence<minConfidence)return {veto:false,reason:'opponent_evidence_confidence_too_low',confidence,sources,policy:'negative_evidence_only'};
    if(sources.length<minIndependentSources)return {veto:false,reason:'opponent_evidence_not_independent_enough',confidence,sources,policy:'multi_source_required'};

    return {
      veto:true,
      reason:'strong_multi_source_opponent_evidence',
      confidence,
      sources,
      policy:'opponent_veto_never_positive_cay',
      cayEligible:false,
      teamEvidenceValid:false
    };
  }

  function apply(detection,options){
    const d=detection||{},decision=evaluate(d,options);
    if(!decision.veto)return {...d,opponentVetoDecision:decision};
    return {
      ...d,
      cayEligible:false,
      teamEvidenceValid:false,
      opponentVetoDecision:decision,
      rejectionReason:'strong_multi_source_opponent_evidence'
    };
  }

  function filter(detections,options){
    const accepted=[],rejected=[];
    for(const raw of (detections||[])){
      const decorated=apply(raw,options);
      if(decorated.opponentVetoDecision&&decorated.opponentVetoDecision.veto)rejected.push(decorated);
      else accepted.push(decorated);
    }
    return {accepted,rejected};
  }

  return {evaluate,apply,filter,version:'1.0.0'};
});