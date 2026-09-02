(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingCandidatePromotionGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const n=v=>finite(v)?Number(v):null;
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
  function evaluate(baseline,candidate,options){
    const cfg=Object.assign({minSequences:3,minHotaGain:0.5,minIdf1Gain:0,maxMotaDrop:0,maxIdSwitchIncrease:0,maxFalseCayIncrease:0,maxBenchSpectatorIncrease:0,requireSameSequenceSet:true},options||{});
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
    if(missing.length)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'MISSING_REQUIRED_BENCHMARK_FIELDS',missing};
    if(cfg.requireSameSequenceSet&&b.sequenceSetId!==c.sequenceSetId)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'CAY_SEQUENCE_SET_MISMATCH',baselineSequenceSetId:b.sequenceSetId,candidateSequenceSetId:c.sequenceSetId};
    const sequenceFloor=Math.min(b.sequences,c.sequences);
    if(sequenceFloor<cfg.minSequences)return {status:'INSUFFICIENT_EVIDENCE',promote:false,reason:'NOT_ENOUGH_CAY_SEQUENCES',sequenceFloor,minSequences:cfg.minSequences};
    const delta={hota:c.hota-b.hota,idf1:c.idf1-b.idf1,mota:c.mota-b.mota,idSwitches:c.idSwitches-b.idSwitches,falseCay:c.falseCay-b.falseCay,benchSpectatorFalseTracks:c.benchSpectatorFalseTracks-b.benchSpectatorFalseTracks};
    const blockers=[];
    if(delta.falseCay>cfg.maxFalseCayIncrease)blockers.push('FALSE_CAY_REGRESSION');
    if(delta.benchSpectatorFalseTracks>cfg.maxBenchSpectatorIncrease)blockers.push('BENCH_SPECTATOR_REGRESSION');
    if(delta.idSwitches>cfg.maxIdSwitchIncrease)blockers.push('IDENTITY_SWITCH_REGRESSION');
    if(delta.hota<cfg.minHotaGain)blockers.push('HOTA_GAIN_TOO_SMALL');
    if(delta.idf1<cfg.minIdf1Gain)blockers.push('IDF1_REGRESSION');
    if(delta.mota<(-Math.abs(cfg.maxMotaDrop)))blockers.push('MOTA_REGRESSION');
    const promote=blockers.length===0;
    return {status:promote?'PROMOTE':'REJECT',promote,reason:promote?'CAY_BENCHMARK_GATE_PASSED':'CAY_BENCHMARK_GATE_BLOCKED',delta,blockers,sequenceFloor,sequenceSetId:b.sequenceSetId,thresholds:{...cfg},policy:'TRACKER_CHANGES_REQUIRE_IDENTICAL_CAY_SEQUENCE_SET_GAINS_WITH_ZERO_TOLERANCE_FOR_FALSE_CAY_BENCH_SPECTATOR_OR_IDENTITY_REGRESSION_BY_DEFAULT'};
  }
  return {evaluate,normalizeSequenceIds,sequenceSetId};
});
