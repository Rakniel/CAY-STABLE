(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricQualityGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Stats){
  'use strict';
  const hypot=(a,b)=>Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0));
  const finite=v=>Number.isFinite(Number(v));
  const median3=(a,b,c)=>a+b+c-Math.min(a,b,c)-Math.max(a,b,c);
  function smoothRun(run){
    if(!Array.isArray(run)||run.length<3)return (run||[]).map(p=>({...p}));
    return run.map((p,i)=>{
      if(i===0||i===run.length-1)return {...p};
      return {...p,x:median3(run[i-1].x,p.x,run[i+1].x),y:median3(run[i-1].y,p.y,run[i+1].y)};
    });
  }
  function projectorInfo(entry){
    if(Stats&&typeof Stats.projectorInfo==='function')return Stats.projectorInfo(entry);
    const validated=!!entry&&entry.validated===true&&typeof entry.project==='function';
    return {validated,project:validated?entry.project:null};
  }
  function robustMetricForTrack(track,projectors){
    const path=track?.fullPath||[];
    let eligibleDt=0,metricDt=0,distanceM=0,maxSpeedKmh=0,sprintCount=0,rejectedSpeedPairs=0;
    const speeds=[],runs=[];let current=[];
    const flush=()=>{if(current.length)runs.push(current);current=[];};
    for(let i=0;i<path.length;i++){
      const p=path[i];
      if(i>0){const a=path[i-1],dt=Number(p.time)-Number(a.time);if(a.segment===p.segment&&dt>0&&dt<=3)eligibleDt+=dt;}
      const info=projectorInfo(projectors&&projectors[p.segment]);
      let projected=null;
      if(info.validated){try{projected=info.project(p);}catch(_){projected=null;}}
      if(!projected||!finite(projected.x)||!finite(projected.y)||!finite(p.time)){flush();continue;}
      const item={x:Number(projected.x),y:Number(projected.y),time:Number(p.time),segment:p.segment};
      const prev=current[current.length-1];
      if(prev&&(prev.segment!==item.segment||!(item.time-prev.time>0&&item.time-prev.time<=3)))flush();
      current.push(item);
    }
    flush();
    for(const rawRun of runs){
      const run=smoothRun(rawRun);let inSprint=false;
      for(let i=1;i<run.length;i++){
        const a=run[i-1],b=run[i],dt=b.time-a.time;
        const d=hypot(a,b),speedKmh=(d/dt)*3.6;
        if(!finite(d)||d<0||!finite(speedKmh)||speedKmh>45){inSprint=false;rejectedSpeedPairs++;continue;}
        metricDt+=dt;distanceM+=d;maxSpeedKmh=Math.max(maxSpeedKmh,speedKmh);speeds.push({time:b.time,segment:b.segment,kmh:speedKmh});
        const sprint=speedKmh>=25;if(sprint&&!inSprint)sprintCount++;inSprint=sprint;
      }
    }
    const coverage=eligibleDt>0?metricDt/eligibleDt:0,avgSpeedKmh=metricDt>0?(distanceM/metricDt)*3.6:null;
    const quality=Stats&&typeof Stats.qualityFromCoverage==='function'?Stats.qualityFromCoverage(coverage):(coverage>=.8?'FIABLE':coverage>0?'PARTIEL':'INDISPONIBLE');
    return {metricCoverage:+coverage.toFixed(4),metricCoveredSeconds:+metricDt.toFixed(3),eligibleSeconds:+eligibleDt.toFixed(3),distanceM:metricDt>0?+distanceM.toFixed(2):null,avgSpeedKmh:avgSpeedKmh===null?null:+avgSpeedKmh.toFixed(2),maxSpeedKmh:metricDt>0?+maxSpeedKmh.toFixed(2):null,sprintCount:metricDt>0?sprintCount:null,quality,speedSamples:speeds,rejectedSpeedPairs,smoothing:'MEDIAN_3_POINTS_PAR_RUN_METRIQUE',sprintContinuityPolicy:'RESET_SUR_CUT_SEGMENT_GAP_TEMPOREL_PAIRE_REJETEE_OU_RUN_METRIQUE'};
  }
  function patch(){
    if(!Stats||typeof Stats.buildReport!=='function'||Stats.__cayMetricQualityGuardPatched)return false;
    const originalBuildReport=Stats.buildReport.bind(Stats);
    Stats.buildReport=function(coreState,coreApi,projectors){
      const report=originalBuildReport(coreState,coreApi,projectors);
      const rawById=new Map([...(coreState?.archive||[]),...(coreState?.active||[])].map(t=>[t.globalId,t]));
      for(const p of report.players||[]){
        const raw=rawById.get(p.id);if(!raw)continue;
        const metric=robustMetricForTrack(raw,projectors||{});p.metric={...metric,reason:metric.metricCoverage>0?null:'aucun segment avec projection terrain métrique explicitement validée'};
        if(p.quality){p.quality.metricDistance=metric.quality;p.quality.metricSpeed=metric.quality;p.quality.sprints=metric.quality;}
      }
      const measured=(report.players||[]).filter(p=>p.metric?.metricCoverage>0),all=report.players||[];
      if(report.team){report.team.playersWithMetricData=measured.length;report.team.measuredDistanceM=+measured.reduce((s,p)=>s+(p.metric.distanceM||0),0).toFixed(2);report.team.avgMetricCoverage=+(all.length?all.reduce((s,p)=>s+(p.metric?.metricCoverage||0),0)/all.length:0).toFixed(4);}
      report.metricQualityGuard={version:'CAY_METRIC_QUALITY_GUARD_V1',smoothing:'MEDIAN_3_POINTS_PAR_RUN_METRIQUE',principle:'filtre médian local avant calcul distance/vitesse pour réduire le jitter de projection sans extrapoler les données manquantes'};
      return report;
    };
    Stats.__cayMetricQualityGuardPatched=true;return true;
  }
  patch();
  return {smoothRun,robustMetricForTrack,patch};
});
