(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./tracking_candidate_promotion_gate_v1.js'):root.CAYTrackingCandidatePromotionGate);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingCrossSegmentPromotionGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(baseGate){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const metric=(row,...keys)=>{for(const k of keys){if(finite(row&&row[k]))return Number(row[k]);}return null;};
  function crossSegmentEvidence(row){
    return {
      unsafe:metric(row,'unsafeCrossSegmentSameId'),
      validated:metric(row,'validatedCrossSegmentSameId'),
      rate:metric(row,'crossSegmentUnsafeCarryoverRate')
    };
  }
  function evaluate(baseline,candidate,options){
    const cfg=Object.assign({maxUnsafeCrossSegmentIncrease:0,maxUnsafeCrossSegmentRateIncrease:0},options||{});
    if(!baseGate||typeof baseGate.evaluate!=='function')return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'BASE_PROMOTION_GATE_UNAVAILABLE'};
    const base=baseGate.evaluate(baseline,candidate,cfg);
    if(!base.promote)return Object.assign({},base,{crossSegmentGuard:'NOT_REACHED'});
    const b=crossSegmentEvidence(baseline),c=crossSegmentEvidence(candidate);
    const missing=[];
    for(const k of ['unsafe','rate']){if(b[k]===null)missing.push(`baseline.${k}`);if(c[k]===null)missing.push(`candidate.${k}`);}
    if(missing.length)return Object.assign({},base,{status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'MISSING_CROSS_SEGMENT_IDENTITY_FIELDS',missing,crossSegmentGuard:'BLOCKED'});
    const delta={unsafeCrossSegmentSameId:c.unsafe-b.unsafe,crossSegmentUnsafeCarryoverRate:c.rate-b.rate};
    const blockers=[];
    if(delta.unsafeCrossSegmentSameId>cfg.maxUnsafeCrossSegmentIncrease)blockers.push('UNSAFE_CROSS_SEGMENT_IDENTITY_REGRESSION');
    if(delta.crossSegmentUnsafeCarryoverRate>cfg.maxUnsafeCrossSegmentRateIncrease)blockers.push('UNSAFE_CROSS_SEGMENT_RATE_REGRESSION');
    if(blockers.length)return Object.assign({},base,{status:'REJECT',promote:false,reason:'CROSS_SEGMENT_IDENTITY_GUARD_BLOCKED',delta:Object.assign({},base.delta,delta),blockers:[...(base.blockers||[]),...blockers],crossSegmentGuard:'BLOCKED'});
    return Object.assign({},base,{delta:Object.assign({},base.delta,delta),crossSegmentGuard:'PASSED',policy:`${base.policy}; CROSS_SEGMENT_IDENTITY_CARRYOVER_MUST_NOT_REGRESS_WITHOUT_EXPLICIT_CONTINUITY_VALIDATION`});
  }
  return {evaluate,crossSegmentEvidence};
});
