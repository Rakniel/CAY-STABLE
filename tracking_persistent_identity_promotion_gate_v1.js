(function(root,factory){
  const api=factory(
    root.CAYTrackingMetricTrajectoryPromotionGate||(typeof require==='function'?require('./tracking_metric_trajectory_promotion_gate_v1.js'):null)
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingPersistentIdentityPromotionGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(TrajectoryGate){
  'use strict';
  const VERSION='CAY_TRACKING_PERSISTENT_IDENTITY_PROMOTION_GATE_V1';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const metric=(row,...keys)=>{for(const k of keys){if(finite(row&&row[k]))return Number(row[k]);}return null;};

  function shape(row){
    return {
      quality:row&&row.groundTruthReentryQuality?String(row.groundTruthReentryQuality):null,
      attempts:metric(row,'groundTruthReentryAttempts'),
      recoveryRate:metric(row,'groundTruthReentryRecoveryRate'),
      longGapAttempts:metric(row,'groundTruthLongGapAttempts'),
      longGapRecoveryRate:metric(row,'groundTruthLongGapRecoveryRate'),
      crossSegmentAttempts:metric(row,'groundTruthCrossSegmentAttempts'),
      crossSegmentRecoveryRate:metric(row,'groundTruthCrossSegmentRecoveryRate'),
      failed:metric(row,'groundTruthFailedReidentifications')
    };
  }

  function evaluateIdentityEvidence(baseline,candidate,options){
    const cfg=Object.assign({
      minGroundTruthReentryAttempts:3,
      requireSameOpportunityCounts:true,
      maxRecoveryRateDrop:0,
      maxLongGapRecoveryRateDrop:0,
      maxCrossSegmentRecoveryRateDrop:0,
      maxFailedReidentificationIncrease:0
    },options||{});
    const b=shape(baseline),c=shape(candidate);
    const missing=[];
    for(const k of ['attempts','recoveryRate','longGapAttempts','crossSegmentAttempts','failed']){
      if(b[k]===null)missing.push(`baseline.${k}`);
      if(c[k]===null)missing.push(`candidate.${k}`);
    }
    if(!b.quality)missing.push('baseline.groundTruthReentryQuality');
    if(!c.quality)missing.push('candidate.groundTruthReentryQuality');
    if(missing.length)return {version:VERSION,status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'MISSING_PERSISTENT_IDENTITY_FIELDS',missing};
    if(b.quality!=='EVALUABLE'||c.quality!=='EVALUABLE')return {version:VERSION,status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'PERSISTENT_IDENTITY_BENCHMARK_UNAVAILABLE',baselineQuality:b.quality,candidateQuality:c.quality};
    if(cfg.requireSameOpportunityCounts&&(b.attempts!==c.attempts||b.longGapAttempts!==c.longGapAttempts||b.crossSegmentAttempts!==c.crossSegmentAttempts)){
      return {version:VERSION,status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'GROUND_TRUTH_REENTRY_OPPORTUNITY_MISMATCH',baseline:{attempts:b.attempts,longGapAttempts:b.longGapAttempts,crossSegmentAttempts:b.crossSegmentAttempts},candidate:{attempts:c.attempts,longGapAttempts:c.longGapAttempts,crossSegmentAttempts:c.crossSegmentAttempts}};
    }
    const opportunityFloor=Math.min(b.attempts,c.attempts);
    if(opportunityFloor<cfg.minGroundTruthReentryAttempts)return {version:VERSION,status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'NOT_ENOUGH_GROUND_TRUTH_REENTRY_OPPORTUNITIES',opportunityFloor,minGroundTruthReentryAttempts:cfg.minGroundTruthReentryAttempts};
    const delta={
      recoveryRate:c.recoveryRate-b.recoveryRate,
      longGapRecoveryRate:(b.longGapRecoveryRate===null||c.longGapRecoveryRate===null)?null:c.longGapRecoveryRate-b.longGapRecoveryRate,
      crossSegmentRecoveryRate:(b.crossSegmentRecoveryRate===null||c.crossSegmentRecoveryRate===null)?null:c.crossSegmentRecoveryRate-b.crossSegmentRecoveryRate,
      failed:c.failed-b.failed
    };
    const blockers=[];
    if(delta.recoveryRate<(-Math.abs(cfg.maxRecoveryRateDrop)))blockers.push('GROUND_TRUTH_REENTRY_RECOVERY_REGRESSION');
    if(b.longGapAttempts>0&&c.longGapAttempts>0){
      if(b.longGapRecoveryRate===null||c.longGapRecoveryRate===null)blockers.push('LONG_GAP_RECOVERY_RATE_MISSING');
      else if(delta.longGapRecoveryRate<(-Math.abs(cfg.maxLongGapRecoveryRateDrop)))blockers.push('LONG_GAP_IDENTITY_REGRESSION');
    }
    if(b.crossSegmentAttempts>0&&c.crossSegmentAttempts>0){
      if(b.crossSegmentRecoveryRate===null||c.crossSegmentRecoveryRate===null)blockers.push('CROSS_SEGMENT_RECOVERY_RATE_MISSING');
      else if(delta.crossSegmentRecoveryRate<(-Math.abs(cfg.maxCrossSegmentRecoveryRateDrop)))blockers.push('CROSS_SEGMENT_IDENTITY_REGRESSION');
    }
    if(delta.failed>cfg.maxFailedReidentificationIncrease)blockers.push('FAILED_REIDENTIFICATION_REGRESSION');
    const pass=blockers.length===0;
    return {version:VERSION,status:pass?'PASS':'REJECT',pass,reason:pass?'PERSISTENT_IDENTITY_GATE_PASSED':'PERSISTENT_IDENTITY_GATE_BLOCKED',delta,blockers,opportunityFloor,thresholds:{...cfg},policy:'TRACKER_PROMOTION_MUST_PRESERVE_PLAYER_ID_AFTER_GROUND_TRUTH_REENTRY_LONG_OCCLUSIONS_AND_CAMERA_SEGMENT_CHANGES'};
  }

  function evaluateCompletePromotion(baselineTracking,candidateTracking,baselineTrajectory,candidateTrajectory,baselineIdentity,candidateIdentity,options){
    if(!TrajectoryGate||typeof TrajectoryGate.evaluateCompletePromotion!=='function')return {version:VERSION,status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'TRACKING_TRAJECTORY_GATE_UNAVAILABLE'};
    const cfg=options||{};
    const base=TrajectoryGate.evaluateCompletePromotion(baselineTracking,candidateTracking,baselineTrajectory,candidateTrajectory,cfg.trackingAndTrajectory);
    if(base.promote!==true)return {version:VERSION,status:'REJECT',promote:false,reason:'TRACKING_OR_TRAJECTORY_GATE_BLOCKED',trackingAndTrajectory:base,persistentIdentity:null};
    const persistentIdentity=evaluateIdentityEvidence(baselineIdentity,candidateIdentity,cfg.identity);
    const promote=persistentIdentity.pass===true;
    return {version:VERSION,status:promote?'PROMOTE':'REJECT',promote,reason:promote?'TRACKING_TRAJECTORY_AND_PERSISTENT_IDENTITY_GATES_PASSED':'PERSISTENT_IDENTITY_PROMOTION_GATE_BLOCKED',trackingAndTrajectory:base,persistentIdentity};
  }

  return {VERSION,evaluateIdentityEvidence,evaluateCompletePromotion};
});
