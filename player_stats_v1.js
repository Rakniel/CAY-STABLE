(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerStats=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const hypot=(a,b)=>Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function qualityFromCoverage(c){ return c>=.8?'FIABLE':c>0?'PARTIEL':'INDISPONIBLE'; }
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
      const projector=projectors&&projectors[a.segment];
      if(typeof projector!=='function')continue;
      const pa=projector(a),pb=projector(b);
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
  function buildPlayerCard(trackSummary,trackRaw,projectors){
    const metric=metricForTrack(trackRaw,projectors||{});
    const hm=heatmap(trackRaw.fullPath||[]);
    return {
      id:trackSummary.id,cat:trackSummary.cat,segments:trackSummary.segments,
      firstTime:trackSummary.firstTime,lastTime:trackSummary.lastTime,
      observedDuration:trackSummary.observedDuration,observations:trackSummary.observations,
      reidentifications:trackSummary.reidentifications||0,mergedFrom:trackSummary.mergedFrom||[],
      identityConfidence:trackSummary.identityConfidence,identityQuality:trackSummary.dataQuality?.identity||trackSummary.quality,
      normalizedTravel:trackSummary.normalizedTravel,heatmap:hm,
      metric:{...metric,reason:metric.metricCoverage>0?null:'aucun segment avec projection terrain métrique validée'},
      quality:{
        identity:trackSummary.dataQuality?.identity||trackSummary.quality,
        heatmap:hm.observations>=2?(hm.observations>=10?'FIABLE':'PARTIEL'):'INDISPONIBLE',
        metricDistance:metric.quality,metricSpeed:metric.quality,sprints:metric.quality
      }
    };
  }
  function buildReport(coreState,coreApi,projectors){
    if(!coreState||!coreApi||typeof coreApi.summary!=='function')throw new Error('tracking core requis');
    const base=coreApi.summary(coreState);
    const rawById=new Map([...(coreState.archive||[]),...(coreState.active||[])].map(t=>[t.globalId,t]));
    const players=base.tracks.map(s=>buildPlayerCard(s,rawById.get(s.id),projectors||{}));
    const measuredPlayers=players.filter(p=>p.metric.metricCoverage>0);
    const totalDistanceM=measuredPlayers.reduce((s,p)=>s+(p.metric.distanceM||0),0);
    const avgMetricCoverage=players.length?players.reduce((s,p)=>s+p.metric.metricCoverage,0)/players.length:0;
    return {
      version:'STABLE_PLAYER_STATS_V1',segments:base.segments,rosterTotal:base.rosterTotal,maxVisible:base.maxVisible,
      players,team:{
        playersTracked:players.length,playersWithMetricData:measuredPlayers.length,
        measuredDistanceM:+totalDistanceM.toFixed(2),avgMetricCoverage:+avgMetricCoverage.toFixed(4),
        quality:qualityFromCoverage(avgMetricCoverage)
      },
      unavailable:{possession:'détecteur ballon/événements non validé',passes:'détecteur ballon/événements non validé',shots:'détecteur ballon/événements non validé'}
    };
  }
  return {heatmap,metricForTrack,buildPlayerCard,buildReport,qualityFromCoverage};
});
