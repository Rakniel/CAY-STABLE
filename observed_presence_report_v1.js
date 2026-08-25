(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./observed_presence_v1.js'),require('./player_stats_v1.js'));
  }else{
    root.CAYObservedPresenceReport=factory(root.CAYObservedPresence,root.CAYPlayerStats);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(ObservedPresence,PlayerStats){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const quality=c=>c>=.8?'FIABLE':c>0?'PARTIEL':'INDISPONIBLE';
  function ensureDeps(){
    if(!ObservedPresence||typeof ObservedPresence.summarize!=='function')throw new Error('CAYObservedPresence.summarize requis');
    if(!PlayerStats||typeof PlayerStats.projectorInfo!=='function')throw new Error('CAYPlayerStats.projectorInfo requis');
  }
  function buildPresenceReport(presenceState,playerCards,projectors){
    ensureDeps();
    const summary=ObservedPresence.summarize(presenceState);
    const cards=new Map((playerCards||[]).map(p=>[Number(p.id),p]));
    let observedSlots=0,reliableIdentitySlots=0,metricProjectionSlots=0,confidenceSum=0,confidenceSlots=0;
    const frames=(presenceState.frames||[]).map(frame=>{
      const ids=[...new Set((frame.observedIds||[]).map(Number).filter(Number.isInteger))].slice(0,11);
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
      if(calibration.validated)metricProjectionSlots+=presentCount;
      if(Number.isFinite(Number(frame.confidence))){confidenceSum+=Number(frame.confidence)*presentCount;confidenceSlots+=presentCount;}
      const identityCoverage=presentCount?reliableIdentityCount/presentCount:0;
      return {
        time:frame.time,segment:frame.segment,presentIds:ids,presentCount,
        presenceCoverage:+clamp01(presentCount/11).toFixed(4),presenceQuality:presentCount===11?'FIABLE':(presentCount?'PARTIEL':'INDISPONIBLE'),
        observationConfidence:Number.isFinite(Number(frame.confidence))?clamp01(frame.confidence):null,
        reliableIdentityCount,uncertainIdentityCount:presentCount-reliableIdentityCount,
        identityCoverage:+identityCoverage.toFixed(4),identityQuality:quality(identityCoverage),
        metricProjectionValidated:calibration.validated===true,
        metricCalibrationSource:calibration.source||null,
        metricCalibrationConfidence:Number.isFinite(calibration.confidence)?calibration.confidence:null,
        metricCalibrationReason:calibration.reason||null,
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
      frames,observedInstants:frameCount,observedPlayerSlots:observedSlots,possiblePlayerSlots:possibleSlots,
      presenceCoverage:+presenceCoverage.toFixed(4),presenceQuality:quality(presenceCoverage),
      identityCoverage:+identityCoverage.toFixed(4),identityQuality:quality(identityCoverage),
      metricProjectionCoverage:+metricProjectionCoverage.toFixed(4),metricProjectionQuality:quality(metricProjectionCoverage),
      observationConfidence:observationConfidence===null?null:+observationConfidence.toFixed(4),
      rejectedDuplicateIds:summary.rejectedDuplicateIds,rejectedOverflow:summary.rejectedOverflow,
      players:summary.players,
      policy:{
        source:'OBSERVED_PRESENCE_LEDGER',maxSimultaneousCAY:11,
        missingPlayer:'NOT_COUNTED_PRESENT_AT_INSTANT',substitutions:'NEVER_INFERRED_FROM_PRESENCE',
        denominator:'11_JOUEURS_MAX_PAR_INSTANT_OBSERVE',noSilentCompletion:true
      }
    };
  }
  function applyToReport(report,presenceState,projectors){
    if(!presenceState)return {...report,presenceEvidence:{quality:'INDISPONIBLE',reason:'registre de présence observée non fourni'}};
    const presence=buildPresenceReport(presenceState,report?.players||[],projectors||{});
    return {
      ...report,
      team:{
        ...(report.team||{}),observedInstants:presence.observedInstants,observedPlayerSlots:presence.observedPlayerSlots,
        instantaneousPresenceCoverage:presence.presenceCoverage,instantaneousIdentityCoverage:presence.identityCoverage,
        observedPresenceConfidence:presence.observationConfidence,
        presenceCalculation:'PAR_INSTANT_REGISTRE_OBSERVE_UNIQUEMENT'
      },
      teamTimeline:presence.frames,
      teamCoverage:{
        ...(report.teamCoverage||{}),presence:presence.presenceCoverage,presenceQuality:presence.presenceQuality,
        identity:presence.identityCoverage,identityQuality:presence.identityQuality,
        metricProjection:presence.metricProjectionCoverage,metricProjectionQuality:presence.metricProjectionQuality,
        calculation:'PAR_INSTANT_REGISTRE_OBSERVE_UNIQUEMENT'
      },
      presenceEvidence:presence
    };
  }
  return {buildPresenceReport,applyToReport};
});
