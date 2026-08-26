(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./observed_presence_v1.js'),require('./player_stats_v1.js'));
  }else{
    root.CAYObservedPresenceReport=factory(root.CAYObservedPresence,root.CAYPlayerStats);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(ObservedPresence,PlayerStats){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const quality=c=>c>=.8?'FIABLE':c>0?'PARTIEL':'INDISPONIBLE';
  const presenceQuality=c=>c>=.999999?'FIABLE':c>0?'PARTIEL':'INDISPONIBLE';
  function ensureDeps(){
    if(!ObservedPresence||typeof ObservedPresence.summarize!=='function')throw new Error('CAYObservedPresence.summarize requis');
    if(!PlayerStats||typeof PlayerStats.projectorInfo!=='function')throw new Error('CAYPlayerStats.projectorInfo requis');
  }
  function frameIdentityAudit(frame){
    const raw=(frame&&Array.isArray(frame.observedIds)?frame.observedIds:[]).map(Number).filter(Number.isInteger);
    const unique=[...new Set(raw)];
    const duplicateCount=Math.max(0,raw.length-unique.length);
    const overflowCount=Math.max(0,unique.length-11);
    const valid=duplicateCount===0&&overflowCount===0;
    return {
      valid,rawCount:raw.length,uniqueCount:unique.length,duplicateCount,overflowCount,
      ids:valid?unique:[],
      reason:duplicateCount>0?'DUPLICATE_ID_SAME_FRAME':(overflowCount>0?'MORE_THAN_11_CAY_IDS':'OK')
    };
  }
  function buildPresenceReport(presenceState,playerCards,projectors){
    ensureDeps();
    const summary=ObservedPresence.summarize(presenceState);
    const cards=new Map((playerCards||[]).map(p=>[Number(p.id),p]));
    let observedSlots=0,reliableIdentitySlots=0,metricProjectionSlots=0,confidenceSum=0,confidenceSlots=0;
    let invalidFrames=0,duplicateFrameIds=0,overflowFrameIds=0;
    const frames=(presenceState.frames||[]).map(frame=>{
      const audit=frameIdentityAudit(frame);
      if(!audit.valid){ invalidFrames++; duplicateFrameIds+=audit.duplicateCount; overflowFrameIds+=audit.overflowCount; }
      const ids=audit.ids;
      const presentCount=ids.length;
      observedSlots+=presentCount;
      let reliableIdentityCount=0;
      for(const id of ids){
        const card=cards.get(id);
        const identityQuality=card?.identityQuality||card?.quality?.identity||'INDISPONIBLE';
        if(identityQuality==='FIABLE')reliableIdentityCount++;
      }
      reliableIdentitySlots+=reliableIdentityCount;
      const calibration=PlayerStats.projectorInfo((projectors||{})[frame.segment]);
      if(calibration.validated&&audit.valid)metricProjectionSlots+=presentCount;
      if(audit.valid&&Number.isFinite(Number(frame.confidence))){confidenceSum+=Number(frame.confidence)*presentCount;confidenceSlots+=presentCount;}
      const identityCoverage=presentCount?reliableIdentityCount/presentCount:0;
      return {
        time:frame.time,segment:frame.segment,presentIds:ids,presentCount,
        frameEvidenceValid:audit.valid,frameEvidenceReason:audit.reason,
        rejectedDuplicateIds:audit.duplicateCount,rejectedOverflowIds:audit.overflowCount,
        presenceCoverage:+clamp01(presentCount/11).toFixed(4),presenceQuality:audit.valid?(presentCount===11?'FIABLE':(presentCount?'PARTIEL':'INDISPONIBLE')):'INDISPONIBLE',
        observationConfidence:audit.valid&&Number.isFinite(Number(frame.confidence))?clamp01(frame.confidence):null,
        reliableIdentityCount,uncertainIdentityCount:presentCount-reliableIdentityCount,
        identityCoverage:+identityCoverage.toFixed(4),identityQuality:audit.valid?quality(identityCoverage):'INDISPONIBLE',
        metricProjectionValidated:audit.valid&&calibration.validated===true,
        metricCalibrationSource:calibration.source||null,
        metricCalibrationConfidence:Number.isFinite(calibration.confidence)?calibration.confidence:null,
        metricCalibrationReason:audit.valid?(calibration.reason||null):`frame rejetée: ${audit.reason}`,
        source:'OBSERVED_PRESENCE_LEDGER',
        rule:'JOUEURS_REELLEMENT_OBSERVES_SUR_CET_INSTANT_UNIQUEMENT'
      };
    });
    const frameCount=frames.length;
    const possibleSlots=frameCount*11;
    const presenceCoverage=possibleSlots?observedSlots/possibleSlots:0;
    const identityCoverage=observedSlots?reliableIdentitySlots/observedSlots:0;
    const metricProjectionCoverage=observedSlots?metricProjectionSlots/observedSlots:0;
    const observationConfidence=confidenceSlots?confidenceSum/confidenceSlots:null;
    return {
      rosterSize:summary.rosterSize,maxObservedSimultaneously:summary.maxObservedSimultaneously,
      frames,observedInstants:frameCount,validObservedInstants:frameCount-invalidFrames,invalidObservedInstants:invalidFrames,
      observedPlayerSlots:observedSlots,possiblePlayerSlots:possibleSlots,
      presenceCoverage:+presenceCoverage.toFixed(4),presenceQuality:presenceQuality(presenceCoverage),
      identityCoverage:+identityCoverage.toFixed(4),identityQuality:quality(identityCoverage),
      metricProjectionCoverage:+metricProjectionCoverage.toFixed(4),metricProjectionQuality:quality(metricProjectionCoverage),
      observationConfidence:observationConfidence===null?null:+observationConfidence.toFixed(4),
      rejectedDuplicateIds:(summary.rejectedDuplicateIds||0)+duplicateFrameIds,
      rejectedOverflow:(summary.rejectedOverflow||0)+overflowFrameIds,
      invalidFrameEvidence:{count:invalidFrames,duplicateIds:duplicateFrameIds,overflowIds:overflowFrameIds,policy:'INVALID_FRAME_NOT_TRUNCATED_OR_SILENTLY_DEDUPLICATED'},
      players:summary.players,
      policy:{
        source:'OBSERVED_PRESENCE_LEDGER',maxSimultaneousCAY:11,
        missingPlayer:'NOT_COUNTED_PRESENT_AT_INSTANT',substitutions:'NEVER_INFERRED_FROM_PRESENCE',
        denominator:'11_JOUEURS_MAX_PAR_INSTANT_OBSERVE',noSilentCompletion:true,noSilentTruncation:true,noSilentDeduplication:true,
        invalidFrame:'INDISPONIBLE_AND_EXCLUDED_FROM_OBSERVED_SLOTS'
      }
    };
  }
  function applyToReport(report,presenceState,projectors){
    if(!presenceState)return {...report,presenceEvidence:{quality:'INDISPONIBLE',reason:'registre de présence observée non fourni'}};
    const presence=buildPresenceReport(presenceState,report?.players||[],projectors||{});
    return {
      ...report,
      team:{
        ...(report.team||{}),observedInstants:presence.observedInstants,validObservedInstants:presence.validObservedInstants,
        invalidObservedInstants:presence.invalidObservedInstants,observedPlayerSlots:presence.observedPlayerSlots,
        instantaneousPresenceCoverage:presence.presenceCoverage,instantaneousIdentityCoverage:presence.identityCoverage,
        observedPresenceConfidence:presence.observationConfidence,
        presenceCalculation:'PAR_INSTANT_REGISTRE_OBSERVE_UNIQUEMENT'
      },
      teamTimeline:presence.frames,
      teamCoverage:{
        ...(report.teamCoverage||{}),presence:presence.presenceCoverage,presenceQuality:presence.presenceQuality,
        identity:presence.identityCoverage,identityQuality:presence.identityQuality,
        metricProjection:presence.metricProjectionCoverage,metricProjectionQuality:presence.metricProjectionQuality,
        invalidObservedInstants:presence.invalidObservedInstants,
        calculation:'PAR_INSTANT_REGISTRE_OBSERVE_UNIQUEMENT'
      },
      presenceEvidence:presence
    };
  }
  return {frameIdentityAudit,buildPresenceReport,applyToReport};
});
