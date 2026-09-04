(function(root,factory){
  const api=factory(
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./app_domain_models_v1.js'):root.CAYAppDomainModels,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./track_roster_binding_v1.js'):root.CAYTrackRosterBinding,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./player_stats_v1.js'):root.CAYPlayerStats
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYRosterMetricPipeline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Domain,Binding,PlayerStats){
  const finite=v=>Number.isFinite(Number(v));
  const sum=(rows,key)=>rows.reduce((acc,row)=>acc+(finite(row?.[key])?Number(row[key]):0),0);

  function unavailable(reason,extra={}){
    return {status:'INDISPONIBLE',reason,playerId:null,metric:null,windows:[],...extra,source:'ROSTER_METRIC_PIPELINE_V1'};
  }

  function ensureDependencies(){
    if(!Domain||typeof Domain.splitTrackEvidenceByParticipation!=='function')throw new Error('ROSTER_METRIC_DOMAIN_REQUIRED');
    if(!Binding||typeof Binding.resolve!=='function')throw new Error('ROSTER_METRIC_BINDING_REQUIRED');
    if(!PlayerStats||typeof PlayerStats.metricForTrack!=='function')throw new Error('ROSTER_METRIC_PLAYER_STATS_REQUIRED');
  }

  function aggregateMetrics(rows){
    const eligibleSeconds=sum(rows,'eligibleSeconds');
    const metricCoveredSeconds=sum(rows,'metricCoveredSeconds');
    const distanceM=sum(rows,'distanceM');
    const rawDistanceM=sum(rows,'rawDistanceM');
    const sprintCount=rows.some(row=>row?.sprintCount!==null&&row?.sprintCount!==undefined)?sum(rows,'sprintCount'):null;
    const maxSpeedValues=rows.map(row=>Number(row?.maxSpeedKmh)).filter(Number.isFinite);
    const metricCoverage=eligibleSeconds>0?metricCoveredSeconds/eligibleSeconds:0;
    const avgSpeedKmh=metricCoveredSeconds>0?(distanceM/metricCoveredSeconds)*3.6:null;
    return {
      metricCoverage:+metricCoverage.toFixed(4),
      metricCoveredSeconds:+metricCoveredSeconds.toFixed(3),
      eligibleSeconds:+eligibleSeconds.toFixed(3),
      distanceM:metricCoveredSeconds>0?+distanceM.toFixed(2):null,
      rawDistanceM:metricCoveredSeconds>0?+rawDistanceM.toFixed(2):null,
      avgSpeedKmh:avgSpeedKmh===null?null:+avgSpeedKmh.toFixed(2),
      maxSpeedKmh:maxSpeedValues.length?+Math.max(...maxSpeedValues).toFixed(2):null,
      sprintCount:metricCoveredSeconds>0?sprintCount:null,
      quality:PlayerStats.qualityFromCoverage(metricCoverage),
      participationWindowCount:rows.length,
      policy:'AGGREGATE_ONLY_WITHIN_CONFIRMED_PARTICIPATION_WINDOWS_NO_CROSS_WINDOW_JOIN'
    };
  }

  function build(input={}){
    ensureDependencies();
    const trackId=input.trackId??input.trackRaw?.globalId??input.trackRaw?.id;
    const resolved=Binding.resolve(input.bindingState||{},trackId);
    if(resolved.status!=='FIABLE')return unavailable(resolved.reason||'association track-joueur non fiable',{binding:resolved,trackId:String(trackId??'')});
    if(!input.participation?.byPlayerId)return unavailable('fenêtres de participation indisponibles',{binding:resolved,trackId:String(trackId??'')});

    let split;
    try{
      split=Domain.splitTrackEvidenceByParticipation(input.participation,resolved.playerId,input.trackRaw||{},{timeScaleMs:input.timeScaleMs==null?1000:input.timeScaleMs});
    }catch(error){
      return unavailable(error&&error.message?error.message:'filtrage participation impossible',{binding:resolved,trackId:String(trackId??'')});
    }

    const windows=split.windows.map(window=>{
      const metric=PlayerStats.metricForTrack(window.track,input.projectors||{});
      return {index:window.index,startMs:window.startMs,endMs:window.endMs,observations:window.track.fullPath.length,metric};
    });
    const metric=aggregateMetrics(windows.map(window=>window.metric));
    const status=metric.metricCoveredSeconds>0?'FIABLE':'INDISPONIBLE';
    return {
      status,
      reason:status==='FIABLE'?null:'aucune métrique terrain défendable dans les fenêtres de participation confirmées',
      playerId:resolved.playerId,
      trackId:String(trackId??''),
      binding:resolved,
      participation:{acceptedObservations:split.acceptedObservations,rejectedObservations:split.rejectedObservations,invalidTimeObservations:split.invalidTimeObservations,totalObservations:split.totalObservations,timeScaleMs:split.timeScaleMs},
      windows,
      metric,
      source:'ROSTER_METRIC_PIPELINE_V1',
      policy:'TRACK_BINDING_FIABLE_ET_PARTICIPATION_CONFIRMEE_REQUISES_AVANT_PUBLICATION_METRIQUE'
    };
  }

  return {build,aggregateMetrics,unavailable};
});
