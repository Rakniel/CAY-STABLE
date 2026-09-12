(function(root,factory){
  const base=root.CAYTrackingCandidatePromotionGate||(typeof require==='function'?require('./tracking_candidate_promotion_gate_v1.js'):null);
  const api=factory(base);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingMetricTrajectoryPromotionGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BaseGate){
  'use strict';

  const VERSION='CAY_TRACKING_METRIC_TRAJECTORY_PROMOTION_GATE_V1';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const metric=(row,...keys)=>{for(const k of keys){if(finite(row&&row[k]))return Number(row[k]);}return null;};
  const text=v=>String(v==null?'':v).trim();

  function normalizeSequenceIds(row){
    if(BaseGate&&typeof BaseGate.normalizeSequenceIds==='function')return BaseGate.normalizeSequenceIds(row);
    const raw=row&&(row.sequenceIds||row.sequencesEvaluated||row.sequenceNames);
    if(!Array.isArray(raw)||!raw.length)return null;
    const ids=[...new Set(raw.map(v=>String(v).trim()).filter(Boolean))].sort();
    return ids.length?ids:null;
  }

  function sequenceSetId(row){
    if(BaseGate&&typeof BaseGate.sequenceSetId==='function')return BaseGate.sequenceSetId(row);
    const explicit=row&&(row.sequenceSetId||row.sequenceManifestId||row.seqmapId);
    if(explicit!==null&&explicit!==undefined&&String(explicit).trim())return String(explicit).trim();
    const ids=normalizeSequenceIds(row);
    return ids?ids.join('\n'):null;
  }

  function trajectoryGroundTruthId(row){
    return text(row&&(row.trajectoryGroundTruthId||row.groundTruthFingerprint||row.gtFingerprint||row.datasetFingerprint))||null;
  }

  function shape(row){
    return {
      status:row&&row.status?String(row.status):null,
      totalGroundTruthPoints:metric(row,'totalGroundTruthPoints','groundTruthPoints','gtPoints'),
      comparablePoints:metric(row,'comparablePoints','matchedMetricPoints','validMetricPoints'),
      rmseM:metric(row,'rmseM','trajectoryRmseM','positionRmseM'),
      p95ErrorM:metric(row,'p95ErrorM','trajectoryP95ErrorM','positionP95ErrorM'),
      metricCoverage:metric(row,'metricCoverage','trajectoryCoverage','coverage'),
      outOfPitchFalsePoints:metric(row,'outOfPitchFalsePoints','falseOutOfPitchPoints'),
      sequenceSetId:sequenceSetId(row),
      trajectoryGroundTruthId:trajectoryGroundTruthId(row)
    };
  }

  function evaluateTrajectoryEvidence(baseline,candidate,options){
    const cfg=Object.assign({
      minComparablePoints:300,
      maxRmseIncreaseM:0,
      maxP95IncreaseM:0,
      maxCoverageDrop:0,
      maxOutOfPitchFalsePointIncrease:0,
      requireSameSequenceSet:true,
      requireSameGroundTruth:true,
      requireSameGroundTruthPointCount:true
    },options||{});
    const b=shape(baseline),c=shape(candidate);
    const missing=[];
    for(const k of ['totalGroundTruthPoints','comparablePoints','rmseM','p95ErrorM','metricCoverage','outOfPitchFalsePoints']){
      if(b[k]===null)missing.push(`baseline.${k}`);
      if(c[k]===null)missing.push(`candidate.${k}`);
    }
    if(!b.status)missing.push('baseline.status');
    if(!c.status)missing.push('candidate.status');
    if(cfg.requireSameSequenceSet){
      if(!b.sequenceSetId)missing.push('baseline.sequenceSetId|sequenceIds');
      if(!c.sequenceSetId)missing.push('candidate.sequenceSetId|sequenceIds');
    }
    if(cfg.requireSameGroundTruth){
      if(!b.trajectoryGroundTruthId)missing.push('baseline.trajectoryGroundTruthId|groundTruthFingerprint');
      if(!c.trajectoryGroundTruthId)missing.push('candidate.trajectoryGroundTruthId|groundTruthFingerprint');
    }
    if(missing.length)return {status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'MISSING_METRIC_TRAJECTORY_FIELDS',missing};
    if(b.status!=='DISPONIBLE'||c.status!=='DISPONIBLE')return {status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'METRIC_TRAJECTORY_BENCHMARK_UNAVAILABLE',baselineStatus:b.status,candidateStatus:c.status};
    if(cfg.requireSameSequenceSet&&b.sequenceSetId!==c.sequenceSetId)return {status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'CAY_SEQUENCE_SET_MISMATCH',baselineSequenceSetId:b.sequenceSetId,candidateSequenceSetId:c.sequenceSetId};
    if(cfg.requireSameGroundTruth&&b.trajectoryGroundTruthId!==c.trajectoryGroundTruthId)return {status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'TRAJECTORY_GROUND_TRUTH_MISMATCH',baselineGroundTruthId:b.trajectoryGroundTruthId,candidateGroundTruthId:c.trajectoryGroundTruthId};
    if(cfg.requireSameGroundTruthPointCount&&b.totalGroundTruthPoints!==c.totalGroundTruthPoints)return {status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'TRAJECTORY_GROUND_TRUTH_POINT_SET_MISMATCH',baselineTotalGroundTruthPoints:b.totalGroundTruthPoints,candidateTotalGroundTruthPoints:c.totalGroundTruthPoints};
    const comparableFloor=Math.min(b.comparablePoints,c.comparablePoints);
    if(comparableFloor<cfg.minComparablePoints)return {status:'INSUFFICIENT_EVIDENCE',pass:false,reason:'NOT_ENOUGH_METRIC_TRAJECTORY_POINTS',comparableFloor,minComparablePoints:cfg.minComparablePoints};
    const delta={
      rmseM:c.rmseM-b.rmseM,
      p95ErrorM:c.p95ErrorM-b.p95ErrorM,
      metricCoverage:c.metricCoverage-b.metricCoverage,
      outOfPitchFalsePoints:c.outOfPitchFalsePoints-b.outOfPitchFalsePoints,
      comparablePoints:c.comparablePoints-b.comparablePoints
    };
    const blockers=[];
    if(delta.rmseM>Math.abs(cfg.maxRmseIncreaseM))blockers.push('METRIC_TRAJECTORY_RMSE_REGRESSION');
    if(delta.p95ErrorM>Math.abs(cfg.maxP95IncreaseM))blockers.push('METRIC_TRAJECTORY_P95_REGRESSION');
    if(delta.metricCoverage<(-Math.abs(cfg.maxCoverageDrop)))blockers.push('METRIC_TRAJECTORY_COVERAGE_REGRESSION');
    if(delta.outOfPitchFalsePoints>cfg.maxOutOfPitchFalsePointIncrease)blockers.push('METRIC_TRAJECTORY_OUT_OF_PITCH_REGRESSION');
    const pass=blockers.length===0;
    return {
      version:VERSION,
      status:pass?'PASS':'REJECT',pass,
      reason:pass?'METRIC_TRAJECTORY_GATE_PASSED':'METRIC_TRAJECTORY_GATE_BLOCKED',
      delta,blockers,comparableFloor,sequenceSetId:b.sequenceSetId,trajectoryGroundTruthId:b.trajectoryGroundTruthId,
      thresholds:{...cfg},
      policy:'TRACKER_PROMOTION_MUST_NOT_IMPROVE_IMAGE_PLANE_MOT_AT_THE_COST_OF_DEFENSIBLE_PITCH_TRAJECTORIES'
    };
  }

  function evaluateCompletePromotion(baselineTracking,candidateTracking,baselineTrajectory,candidateTrajectory,options){
    if(!BaseGate||typeof BaseGate.evaluate!=='function')return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'BASE_TRACKING_PROMOTION_GATE_UNAVAILABLE'};
    const cfg=options||{};
    const tracking=BaseGate.evaluate(baselineTracking,candidateTracking,cfg.tracking);
    if(tracking.promote!==true)return {version:VERSION,status:'REJECT',promote:false,reason:'TRACKING_PROMOTION_GATE_BLOCKED',tracking,trajectory:null};
    const trajectory=evaluateTrajectoryEvidence(baselineTrajectory,candidateTrajectory,cfg.trajectory);
    const promote=trajectory.pass===true;
    return {version:VERSION,status:promote?'PROMOTE':'REJECT',promote,reason:promote?'TRACKING_AND_METRIC_TRAJECTORY_GATES_PASSED':'METRIC_TRAJECTORY_PROMOTION_GATE_BLOCKED',tracking,trajectory};
  }

  return {VERSION,normalizeSequenceIds,sequenceSetId,trajectoryGroundTruthId,evaluateTrajectoryEvidence,evaluateCompletePromotion};
});
