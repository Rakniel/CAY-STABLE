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

  function isYellowOnlySource(source){
    const s=String(source||'').trim().toLowerCase();
    return s.includes('yellow')||s.includes('jaune');
  }

  function evaluateCayEvidence(detection){
    const d=detection||{};
    const explicitCay=d.cayEvidence===true||d.teamClassification==='cay'||d.teamLabel==='cay';
    const sources=normalizeSources(d.cayEvidenceSources||d.teamEvidenceSources);
    const explicitYellowOnly=d.yellowDetailOnly===true||d.falseCAYYellowDetail===true;
    const yellowOnlySources=explicitCay&&sources.length>0&&sources.every(isYellowOnlySource);
    if(!explicitCay)return {reject:false,reason:null,sources,policy:'no_positive_cay_inference'};
    if(explicitYellowOnly||yellowOnlySources){
      return {
        reject:true,
        reason:'yellow_detail_cannot_prove_cay',
        sources,
        policy:'yellow_is_never_positive_cay_evidence',
        cayEligible:false,
        teamEvidenceValid:false
      };
    }
    return {reject:false,reason:null,sources,policy:'positive_cay_evidence_not_yellow_only'};
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
    const d=detection||{};
    const cayDecision=evaluateCayEvidence(d);
    if(cayDecision.reject){
      return {
        ...d,
        cayEligible:false,
        teamEvidenceValid:false,
        cayEvidenceDecision:cayDecision,
        rejectionReason:cayDecision.reason
      };
    }
    const decision=evaluate(d,options);
    if(!decision.veto)return {...d,cayEvidenceDecision:cayDecision,opponentVetoDecision:decision};
    return {
      ...d,
      cayEligible:false,
      teamEvidenceValid:false,
      cayEvidenceDecision:cayDecision,
      opponentVetoDecision:decision,
      rejectionReason:'strong_multi_source_opponent_evidence'
    };
  }

  function filter(detections,options){
    const accepted=[],rejected=[];
    for(const raw of (detections||[])){
      const decorated=apply(raw,options);
      if((decorated.cayEvidenceDecision&&decorated.cayEvidenceDecision.reject)||(decorated.opponentVetoDecision&&decorated.opponentVetoDecision.veto))rejected.push(decorated);
      else accepted.push(decorated);
    }
    return {accepted,rejected};
  }

  return {evaluateCayEvidence,evaluate,apply,filter,version:'1.1.0'};
});