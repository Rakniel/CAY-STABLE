(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerStats=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const hypot=(a,b)=>Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function qualityFromCoverage(c){ return c>=.8?'FIABLE':c>0?'PARTIEL':'INDISPONIBLE'; }
  function projectorInfo(entry){
    if(!entry)return {validated:false,project:null,source:null,confidence:null,reason:'aucune projection terrain fournie'};
    if(typeof entry==='function')return {validated:false,project:null,source:'legacy_function',confidence:null,reason:'projection fournie sans validation explicite'};
    const validated=entry.validated===true&&typeof entry.project==='function';
    return {
      validated,
      project:validated?entry.project:null,
      source:entry.source||entry.method||null,
      confidence:Number.isFinite(Number(entry.confidence))?clamp(Number(entry.confidence),0,1):null,
      reason:validated?null:(entry.reason||'projection terrain non validée')
    };
  }
  function heatmap(points,cols=6,rows=4){
    const cells=Array.from({length:rows},()=>Array(cols).fill(0));
    for(const p of points||[]){
      const x=clamp(Number(p.x)||0,0,.999999),y=clamp(Number(p.y)||0,0,.999999);
      cells[Math.floor(y*rows)][Math.floor(x*cols)]++;
    }
    return {cols,rows,cells,max:cells.reduce((m,r)=>Math.max(m,...r),0),observations:(points||[]).length};
  }
  function metricForTrack(track,projectors){
    const path=track.fullPath||[];
    let eligibleDt=0,metricDt=0,distanceM=0,maxSpeedKmh=0,sprintCount=0;
    const speeds=[]; let inSprint=false;
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i];
      if(a.segment!==b.segment)continue;
      const dt=b.time-a.time;
      if(!(dt>0&&dt<=3))continue;
      eligibleDt+=dt;
      const info=projectorInfo(projectors&&projectors[a.segment]);
      if(!info.validated)continue;
      const pa=info.project(a),pb=info.project(b);
      if(!pa||!pb||![pa.x,pa.y,pb.x,pb.y].every(Number.isFinite))continue;
      const d=hypot(pa,pb);
      if(!Number.isFinite(d)||d<0)continue;
      const speedKmh=(d/dt)*3.6;
      if(speedKmh>45)continue;
      metricDt+=dt; distanceM+=d; speeds.push({time:b.time,segment:b.segment,kmh:speedKmh});
      maxSpeedKmh=Math.max(maxSpeedKmh,speedKmh);
      const sprint=speedKmh>=25;
      if(sprint&&!inSprint)sprintCount++;
      inSprint=sprint;
    }
    const coverage=eligibleDt>0?metricDt/eligibleDt:0;
    const avgSpeedKmh=metricDt>0?(distanceM/metricDt)*3.6:null;
    return {
      metricCoverage:+coverage.toFixed(4),metricCoveredSeconds:+metricDt.toFixed(3),eligibleSeconds:+eligibleDt.toFixed(3),
      distanceM:metricDt>0?+distanceM.toFixed(2):null,
      avgSpeedKmh:avgSpeedKmh===null?null:+avgSpeedKmh.toFixed(2),
      maxSpeedKmh:metricDt>0?+maxSpeedKmh.toFixed(2):null,
      sprintCount:metricDt>0?sprintCount:null,
      quality:qualityFromCoverage(coverage),speedSamples:speeds
    };
  }
  function rosterState(trackSummary,trackRaw,analysisStart){
    const uncertain=(trackSummary.dataQuality?.identity||trackSummary.quality)!=='FIABLE';
    const active=trackRaw&&trackRaw.archived!==true;
    const presentAtStart=Number.isFinite(analysisStart)&&trackSummary.firstTime<=analysisStart+2.5;
    return {
      visibility:uncertain?'IDENTITE_INCERTAINE':(active?'ACTIF_TRACKING':'HORS_CHAMP_OU_SORTI'),
      entry:presentAtStart?'PRESENT_AU_DEBUT_ANALYSE':'APPARU_PLUS_TARD',
      replacementConfirmed:false,
      replacementReason:'aucun événement de remplacement validé',
      exitReason:trackSummary.exitReason||null
    };
  }
  function buildPlayerCard(trackSummary,trackRaw,projectors,analysisStart){
    const metric=metricForTrack(trackRaw,projectors||{});
    const hm=heatmap(trackRaw.fullPath||[]);
    return {
      id:trackSummary.id,cat:trackSummary.cat,segments:trackSummary.segments,
      firstTime:trackSummary.firstTime,lastTime:trackSummary.lastTime,
      observedDuration:trackSummary.observedDuration,observations:trackSummary.observations,
      presenceIntervals:trackSummary.presenceIntervals||[],
      reidentifications:trackSummary.reidentifications||0,mergedFrom:trackSummary.mergedFrom||[],
      identityConfidence:trackSummary.identityConfidence,identityQuality:trackSummary.dataQuality?.identity||trackSummary.quality,
      normalizedTravel:trackSummary.normalizedTravel,heatmap:hm,
      rosterState:rosterState(trackSummary,trackRaw,analysisStart),
      metric:{...metric,reason:metric.metricCoverage>0?null:'aucun segment avec projection terrain métrique explicitement validée'},
      quality:{
        identity:trackSummary.dataQuality?.identity||trackSummary.quality,
        heatmap:hm.observations>=2?(hm.observations>=10?'FIABLE':'PARTIEL'):'INDISPONIBLE',
        metricDistance:metric.quality,metricSpeed:metric.quality,sprints:metric.quality
      }
    };
  }
  function buildInstantTeamTimeline(coreState,base,projectors){
    const summaryById=new Map((base.tracks||[]).map(t=>[t.id,t]));
    const frames=new Map();
    for(const tr of [...(coreState.archive||[]),...(coreState.active||[])]){
      const summary=summaryById.get(tr.globalId)||null;
      const identityQuality=summary?.dataQuality?.identity||summary?.quality||'PARTIEL';
      for(const p of tr.fullPath||[]){
        if(!Number.isFinite(p.time)||!Number.isFinite(p.segment))continue;
        const rounded=+p.time.toFixed(3),key=`${p.segment}:${rounded}`;
        if(!frames.has(key))frames.set(key,{time:rounded,segment:p.segment,players:new Map()});
        frames.get(key).players.set(tr.globalId,{id:tr.globalId,identityQuality});
      }
    }
    const timeline=[...frames.values()].sort((a,b)=>a.time-b.time||a.segment-b.segment).map(frame=>{
      const players=[...frame.players.values()].slice(0,11);
      const reliable=players.filter(p=>p.identityQuality==='FIABLE').length;
      const present=players.length;
      const identityCoverage=present?reliable/present:0;
      const calibration=projectorInfo((projectors||{})[frame.segment]);
      const metricProjectionValidated=calibration.validated;
      return {
        time:frame.time,segment:frame.segment,presentIds:players.map(p=>p.id),presentCount:present,
        reliableIdentityCount:reliable,uncertainIdentityCount:present-reliable,
        identityCoverage:+identityCoverage.toFixed(4),identityQuality:qualityFromCoverage(identityCoverage),
        metricProjectionValidated,
        metricCalibrationSource:calibration.source,
        metricCalibrationConfidence:calibration.confidence,
        metricCalibrationReason:calibration.reason,
        metricPlayerCoverage:metricProjectionValidated&&present?1:0,
        metricQuality:metricProjectionValidated&&present?'FIABLE':'INDISPONIBLE'
      };
    });
    const observedPlayerSlots=timeline.reduce((s,f)=>s+f.presentCount,0);
    const reliablePlayerSlots=timeline.reduce((s,f)=>s+f.reliableIdentityCount,0);
    const metricPlayerSlots=timeline.reduce((s,f)=>s+(f.metricProjectionValidated?f.presentCount:0),0);
    const identityCoverage=observedPlayerSlots?reliablePlayerSlots/observedPlayerSlots:0;
    const metricCoverage=observedPlayerSlots?metricPlayerSlots/observedPlayerSlots:0;
    return {
      frames:timeline,
      observedInstants:timeline.length,
      observedPlayerSlots,
      reliablePlayerSlots,
      metricPlayerSlots,
      identityCoverage:+identityCoverage.toFixed(4),
      metricCoverage:+metricCoverage.toFixed(4),
      identityQuality:qualityFromCoverage(identityCoverage),
      metricQuality:qualityFromCoverage(metricCoverage),
      calculation:'PAR_INSTANT_JOUEURS_OBSERVES_UNIQUEMENT'
    };
  }
  function buildReport(coreState,coreApi,projectors){
    if(!coreState||!coreApi||typeof coreApi.summary!=='function')throw new Error('tracking core requis');
    const base=coreApi.summary(coreState);
    const rawById=new Map([...(coreState.archive||[]),...(coreState.active||[])].map(t=>[t.globalId,t]));
    const starts=base.tracks.map(t=>t.firstTime).filter(Number.isFinite);
    const analysisStart=starts.length?Math.min(...starts):null;
    const players=base.tracks.map(s=>buildPlayerCard(s,rawById.get(s.id),projectors||{},analysisStart));
    const measuredPlayers=players.filter(p=>p.metric.metricCoverage>0);
    const totalDistanceM=measuredPlayers.reduce((s,p)=>s+(p.metric.distanceM||0),0);
    const avgMetricCoverage=players.length?players.reduce((s,p)=>s+p.metric.metricCoverage,0)/players.length:0;
    const instant=buildInstantTeamTimeline(coreState,base,projectors||{});
    return {
      version:'STABLE_PLAYER_STATS_V1',segments:base.segments,rosterTotal:base.rosterTotal,maxVisible:base.maxVisible,analysisStart,
      players,team:{
        playersTracked:players.length,playersWithMetricData:measuredPlayers.length,
        activeTracking:players.filter(p=>p.rosterState.visibility==='ACTIF_TRACKING').length,
        uncertainIdentity:players.filter(p=>p.rosterState.visibility==='IDENTITE_INCERTAINE').length,
        appearedLater:players.filter(p=>p.rosterState.entry==='APPARU_PLUS_TARD').length,
        confirmedReplacements:0,
        measuredDistanceM:+totalDistanceM.toFixed(2),avgMetricCoverage:+avgMetricCoverage.toFixed(4),
        instantaneousIdentityCoverage:instant.identityCoverage,
        instantaneousMetricCoverage:instant.metricCoverage,
        observedInstants:instant.observedInstants,
        observedPlayerSlots:instant.observedPlayerSlots,
        quality:instant.identityQuality,
        calculation:instant.calculation
      },
      teamTimeline:instant.frames,
      teamCoverage:{identity:instant.identityCoverage,metric:instant.metricCoverage,identityQuality:instant.identityQuality,metricQuality:instant.metricQuality,calculation:instant.calculation},
      unavailable:{possession:'détecteur ballon/événements non validé',passes:'détecteur ballon/événements non validé',shots:'détecteur ballon/événements non validé',confirmedReplacements:'aucun détecteur de remplacement validé'}
    };
  }
  return {heatmap,metricForTrack,rosterState,buildPlayerCard,buildInstantTeamTimeline,buildReport,qualityFromCoverage,projectorInfo};
});
