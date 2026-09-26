(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingCandidatePromotionGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='CAY_TRACKING_CANDIDATE_PROMOTION_GATE_V1_0';
  const finite=v=>Number.isFinite(Number(v));
  function decideTrackingCandidatePromotion(comparison,options){
    const cfg={minReidGain:0,minLongGapGain:0,maxUnsafeCarryoverRate:0,maxUnsafeCarryoverIncrease:0,...(options||{})};
    const before=comparison&&comparison.before||{},after=comparison&&comparison.after||{},delta=comparison&&comparison.delta||{};
    const reasons=[];
    if(after.quality!=='EVALUABLE')reasons.push('candidate_identity_not_evaluable');
    if(after.crossSegmentSafetyQuality!=='EVALUABLE')reasons.push('candidate_cross_segment_safety_not_evaluable');
    if(!finite(after.crossSegmentUnsafeCarryoverRate))reasons.push('unsafe_carryover_rate_missing');
    else if(Number(after.crossSegmentUnsafeCarryoverRate)>cfg.maxUnsafeCarryoverRate)reasons.push('unsafe_cross_segment_carryover');
    if(finite(delta.crossSegmentUnsafeCarryoverRate)&&Number(delta.crossSegmentUnsafeCarryoverRate)>cfg.maxUnsafeCarryoverIncrease)reasons.push('unsafe_carryover_regression');
    if(finite(delta.unsafeCrossSegmentSameId)&&Number(delta.unsafeCrossSegmentSameId)>0)reasons.push('unsafe_same_id_count_regression');
    if(finite(delta.failedReidentifications)&&Number(delta.failedReidentifications)>0)reasons.push('failed_reidentification_regression');
    const gains=[];
    if(finite(delta.reidRecoveryRate)&&Number(delta.reidRecoveryRate)>cfg.minReidGain)gains.push('reid_recovery');
    if(finite(delta.longGapRecoveryRate)&&Number(delta.longGapRecoveryRate)>cfg.minLongGapGain)gains.push('long_gap_recovery');
    if(finite(delta.groundTruthReentryRecoveryRate)&&Number(delta.groundTruthReentryRecoveryRate)>0)gains.push('ground_truth_reentry');
    if(!gains.length)reasons.push('no_predeclared_identity_gain');
    return {version:VERSION,status:reasons.length?'REJECTED':'PROMOTABLE',promotable:reasons.length===0,reasons,gains,beforeQuality:before.quality||'INDISPONIBLE',afterQuality:after.quality||'INDISPONIBLE',rule:'FAIL_CLOSED; GENERIC_TRACKING_GAIN_NEVER_OVERRIDES_UNSAFE_CROSS_SEGMENT_IDENTITY_CONTINUITY'};
  }
  return {VERSION,decideTrackingCandidatePromotion};
});
