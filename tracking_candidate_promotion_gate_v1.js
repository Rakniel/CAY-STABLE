(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingCandidatePromotionGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const n=v=>finite(v)?Number(v):null;
  const text=v=>v!==null&&v!==undefined&&String(v).trim()?String(v).trim():null;
  function metric(row,...keys){for(const k of keys){const v=n(row&&row[k]);if(v!==null)return v;}return null;}
  function normalizeSequenceIds(row){
    const raw=row&&(row.sequenceIds||row.sequencesEvaluated||row.sequenceNames);
    if(!Array.isArray(raw)||!raw.length)return null;
    const ids=[...new Set(raw.map(v=>String(v).trim()).filter(Boolean))].sort();
    return ids.length?ids:null;
  }
  function sequenceSetId(row){
    const explicit=row&&(row.sequenceSetId||row.sequenceManifestId||row.seqmapId);
    if(explicit!==null&&explicit!==undefined&&String(explicit).trim())return String(explicit).trim();
    const ids=normalizeSequenceIds(row);
    return ids?ids.join('\n'):null;
  }
  function benchmarkInputProtocol(row){
    const r=row&&typeof row==='object'?row:{};
    const timestampMode=text(r.timestampMode||r.timingMode);
    return {
      detectorArtifactId:text(r.detectorArtifactId||r.detectionsArtifactId||r.detectionManifestId),
      frameSetId:text(r.frameSetId||r.frameManifestId||r.frameSelectionId),
      timestampMode:timestampMode?timestampMode.toUpperCase():null,
      timestampSetId:text(r.timestampSetId||r.timestampManifestId||r.captureTimestampSetId),
      referenceFrameRate:metric(r,'referenceFrameRate','frameRate','fps')
    };
  }
  function compareBenchmarkInputs(baseline,candidate,options){
    const cfg=Object.assign({requireSameBenchmarkInputs:true},options||{});
    if(!cfg.requireSameBenchmarkInputs)return {pass:true,reason:'BENCHMARK_INPUT_PARITY_NOT_REQUIRED',baseline:benchmarkInputProtocol(baseline),candidate:benchmarkInputProtocol(candidate)};
    const b=benchmarkInputProtocol(baseline),c=benchmarkInputProtocol(candidate);
    const missing=[];
    for(const k of ['detectorArtifactId','frameSetId','timestampMode','referenceFrameRate']){
      if(b[k]===null)missing.push(`baseline.${k}`);
      if(c[k]===null)missing.push(`candidate.${k}`);
    }
    const dynamicModes=new Set(['CAPTURE_TIME','DYNAMIC_CAPTURE_TIME','DYNAMIC']);
    if(dynamicModes.has(b.timestampMode)&&b.timestampSetId===null)missing.push('baseline.timestampSetId');
    if(dynamicModes.has(c.timestampMode)&&c.timestampSetId===null)missing.push('candidate.timestampSetId');
    if(missing.length)return {pass:false,reason:'MISSING_BENCHMARK_INPUT_FIELDS',missing,baseline:b,candidate:c};
    const mismatch=[];
    if(b.detectorArtifactId!==c.detectorArtifactId)mismatch.push('DETECTOR_ARTIFACT_MISMATCH');
    if(b.frameSetId!==c.frameSetId)mismatch.push('FRAME_SET_MISMATCH');
    if(b.timestampMode!==c.timestampMode)mismatch.push('TIMESTAMP_MODE_MISMATCH');
    if(b.referenceFrameRate!==c.referenceFrameRate)mismatch.push('REFERENCE_FRAME_RATE_MISMATCH');
    if((dynamicModes.has(b.timestampMode)||dynamicModes.has(c.timestampMode))&&b.timestampSetId!==c.timestampSetId)mismatch.push('TIMESTAMP_SET_MISMATCH');
    return {pass:mismatch.length===0,reason:mismatch.length?'BENCHMARK_INPUT_MISMATCH':'BENCHMARK_INPUTS_MATCH',mismatch,baseline:b,candidate:c};
  }
  function evaluateLabelledIdentityEvidence(baseline,candidate,options){
    const cfg=Object.assign({
      minValidSamples:300,
      requireStrictIdSwitchReduction:true,
      maxCoverageDrop:0,
      maxFragmentIncrease:0,
      maxFalseCayIncrease:0,
      maxBenchSpectatorIncrease:0,
      requireSameSequenceSet:true,
      requireSameTotalSamples:true,
      requireSameBenchmarkInputs:true
    },options||{});
    const inputParity=compareBenchmarkInputs(baseline,candidate,cfg);
    if(!inputParity.pass)return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:inputParity.reason,inputParity};
    const shape=row=>({
      status:row&&row.status?String(row.status):null,
      totalSamples:metric(row,'totalSamples'),
      validSamples:metric(row,'validSamples'),
      comparableTransitions:metric(row,'comparableTransitions'),
      idSwitches:metric(row,'idSwitches','IDSW','idsw'),
      fragments:metric(row,'fragments','Frag','frag'),
      coverage:metric(row,'labelledCoverage','coverage'),
      falseCay:metric(row,'falseCay','falseCAY'),
      benchSpectatorFalseTracks:metric(row,'benchSpectatorFalseTracks','benchSpectatorFalsePositives'),
      sequenceSetId:sequenceSetId(row)
    });
    const b=shape(baseline),c=shape(candidate);
    const missing=[];
    for(const k of ['totalSamples','validSamples','comparableTransitions','idSwitches','fragments','coverage','falseCay','benchSpectatorFalseTracks']){
      if(b[k]===null)missing.push(`baseline.${k}`);
      if(c[k]===null)missing.push(`candidate.${k}`);
    }
    if(!b.status)missing.push('baseline.status');if(!c.status)missing.push('candidate.status');
    if(cfg.requireSameSequenceSet){if(b.sequenceSetId===null)missing.push('baseline.sequenceSetId|sequenceIds');if(c.sequenceSetId===null)missing.push('candidate.sequenceSetId|sequenceIds');}
    if(missing.length)return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:'MISSING_LABELLED_IDENTITY_FIELDS',missing,inputParity};
    if(b.status!=='DISPONIBLE'||c.status!=='DISPONIBLE')return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:'LABELLED_IDENTITY_BENCHMARK_UNAVAILABLE',baselineStatus:b.status,candidateStatus:c.status,inputParity};
    if(cfg.requireSameSequenceSet&&b.sequenceSetId!==c.sequenceSetId)return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:'CAY_SEQUENCE_SET_MISMATCH',baselineSequenceSetId:b.sequenceSetId,candidateSequenceSetId:c.sequenceSetId,inputParity};
    if(cfg.requireSameTotalSamples&&b.totalSamples!==c.totalSamples)return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:'CAY_LABELLED_SAMPLE_SET_MISMATCH',baselineTotalSamples:b.totalSamples,candidateTotalSamples:c.totalSamples,inputParity};
    const validFloor=Math.min(b.validSamples,c.validSamples);
    if(validFloor<cfg.minValidSamples)return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:'NOT_ENOUGH_LABELLED_CAY_SAMPLES',validFloor,minValidSamples:cfg.minValidSamples,inputParity};
    if(b.comparableTransitions<=0||c.comparableTransitions<=0)return {status:'INSUFFICIENT_EVIDENCE',pass:false,fullPromotion:false,reason:'NO_COMPARABLE_IDENTITY_TRANSITIONS',inputParity};
    const delta={idSwitches:c.idSwitches-b.idSwitches,fragments:c.fragments-b.fragments,coverage:c.coverage-b.coverage,falseCay:c.falseCay-b.falseCay,benchSpectatorFalseTracks:c.benchSpectatorFalseTracks-b.benchSpectatorFalseTracks};
    const blockers=[];
    if(delta.falseCay>cfg.maxFalseCayIncrease)blockers.push('FALSE_CAY_REGRESSION');
    if(delta.benchSpectatorFalseTracks>cfg.maxBenchSpectatorIncrease)blockers.push('BENCH_SPECTATOR_REGRESSION');
    if(delta.coverage<(-Math.abs(cfg.maxCoverageDrop)))blockers.push('IDENTITY_COVERAGE_REGRESSION');
    if(delta.fragments>cfg.maxFragmentIncrease)blockers.push('IDENTITY_FRAGMENTATION_REGRESSION');
    if(cfg.requireStrictIdSwitchReduction?delta.idSwitches>=0:delta.idSwitches>0)blockers.push('IDENTITY_SWITCH_NOT_IMPROVED');
    const pass=blockers.length===0;
    return {status:pass?'PRECHECK_PASS':'PRECHECK_REJECT',pass,fullPromotion:false,reason:pass?'LABELLED_IDENTITY_PRECHECK_PASSED':'LABELLED_IDENTITY_PRECHECK_BLOCKED',delta,blockers,validFloor,sequenceSetId:b.sequenceSetId,inputParity,thresholds:{...cfg},policy:'LABELLED_IDENTITY_PRECHECK_REQUIRES_IDENTICAL_DETECTIONS_FRAMES_AND_TIMEBASE_PLUS_NON_REGRESSING_FRAGMENTATION_AND_DOES_NOT_REPLACE_HOTA_IDF1_MOTA_PROMOTION_GATE'};
  }
  function evaluate(baseline,candidate,options){
    const cfg=Object.assign({minSequences:3,minHotaGain:0.5,minIdf1Gain:0,maxMotaDrop:0,maxIdSwitchIncrease:0,maxFalseCayIncrease:0,maxBenchSpectatorIncrease:0,requireSameSequenceSet:true,requireSameBenchmarkInputs:true},options||{});
    const inputParity=compareBenchmarkInputs(baseline,candidate,cfg);
    if(!inputParity.pass)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:inputParity.reason,inputParity};
    const required=['hota','idf1','mota','idSwitches','falseCay','benchSpectatorFalseTracks'];
    const b={
      hota:metric(baseline,'hota','HOTA'),idf1:metric(baseline,'idf1','IDF1'),mota:metric(baseline,'mota','MOTA'),
      idSwitches:metric(baseline,'idSwitches','IDSW','idsw'),falseCay:metric(baseline,'falseCay','falseCAY'),
      benchSpectatorFalseTracks:metric(baseline,'benchSpectatorFalseTracks','benchSpectatorFalsePositives'),sequences:metric(baseline,'sequences','sequenceCount'),
      sequenceSetId:sequenceSetId(baseline)
    };
    const c={
      hota:metric(candidate,'hota','HOTA'),idf1:metric(candidate,'idf1','IDF1'),mota:metric(candidate,'mota','MOTA'),
      idSwitches:metric(candidate,'idSwitches','IDSW','idsw'),falseCay:metric(candidate,'falseCay','falseCAY'),
      benchSpectatorFalseTracks:metric(candidate,'benchSpectatorFalseTracks','benchSpectatorFalsePositives'),sequences:metric(candidate,'sequences','sequenceCount'),
      sequenceSetId:sequenceSetId(candidate)
    };
    const missing=[];
    for(const k of required){if(b[k]===null)missing.push(`baseline.${k}`);if(c[k]===null)missing.push(`candidate.${k}`);}
    if(b.sequences===null)missing.push('baseline.sequences');if(c.sequences===null)missing.push('candidate.sequences');
    if(cfg.requireSameSequenceSet){if(b.sequenceSetId===null)missing.push('baseline.sequenceSetId|sequenceIds');if(c.sequenceSetId===null)missing.push('candidate.sequenceSetId|sequenceIds');}
    if(missing.length)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'MISSING_REQUIRED_BENCHMARK_FIELDS',missing,inputParity};
    if(cfg.requireSameSequenceSet&&b.sequenceSetId!==c.sequenceSetId)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'CAY_SEQUENCE_SET_MISMATCH',baselineSequenceSetId:b.sequenceSetId,candidateSequenceSetId:c.sequenceSetId,inputParity};
    const sequenceFloor=Math.min(b.sequences,c.sequences);
    if(sequenceFloor<cfg.minSequences)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'NOT_ENOUGH_CAY_SEQUENCES',sequenceFloor,minSequences:cfg.minSequences,inputParity};
    const delta={hota:c.hota-b.hota,idf1:c.idf1-b.idf1,mota:c.mota-b.mota,idSwitches:c.idSwitches-b.idSwitches,falseCay:c.falseCay-b.falseCay,benchSpectatorFalseTracks:c.benchSpectatorFalseTracks-b.benchSpectatorFalseTracks};
    const blockers=[];
    if(delta.falseCay>cfg.maxFalseCayIncrease)blockers.push('FALSE_CAY_REGRESSION');
    if(delta.benchSpectatorFalseTracks>cfg.maxBenchSpectatorIncrease)blockers.push('BENCH_SPECTATOR_REGRESSION');
    if(delta.idSwitches>cfg.maxIdSwitchIncrease)blockers.push('IDENTITY_SWITCH_REGRESSION');
    if(delta.hota<cfg.minHotaGain)blockers.push('HOTA_GAIN_TOO_SMALL');
    if(delta.idf1<cfg.minIdf1Gain)blockers.push('IDF1_REGRESSION');
    if(delta.mota<(-Math.abs(cfg.maxMotaDrop)))blockers.push('MOTA_REGRESSION');
    const promote=blockers.length===0;
    return {status:promote?'PROMOTE':'REJECT',promote,reason:promote?'CAY_BENCHMARK_GATE_PASSED':'CAY_BENCHMARK_GATE_BLOCKED',delta,blockers,sequenceFloor,sequenceSetId:b.sequenceSetId,inputParity,thresholds:{...cfg},policy:'TRACKER_CHANGES_REQUIRE_IDENTICAL_CAY_SEQUENCE_DETECTION_FRAME_AND_TIMEBASE_INPUTS_WITH_ZERO_TOLERANCE_FOR_FALSE_CAY_BENCH_SPECTATOR_OR_IDENTITY_REGRESSION_BY_DEFAULT'};
  }
  return {evaluate,evaluateLabelledIdentityEvidence,normalizeSequenceIds,sequenceSetId,benchmarkInputProtocol,compareBenchmarkInputs};
});
