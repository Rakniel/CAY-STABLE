(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricQualityGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Stats){
  'use strict';
  const hypot=(a,b)=>Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0));
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const median3=(a,b,c)=>a+b+c-Math.min(a,b,c)-Math.max(a,b,c);
  const SPRINT_THRESHOLD_KMH=25;
  const MIN_SPRINT_SECONDS=1;
  const qualityFromEvidenceScore=score=>score>=.8?'FIABLE':score>0?'PARTIEL':'INDISPONIBLE';
  function smoothRun(run){
    if(!Array.isArray(run)||run.length<3)return (run||[]).map(p=>({...p}));
    return run.map((p,i)=>{
      if(i===0||i===run.length-1)return {...p};
      return {...p,x:median3(run[i-1].x,p.x,run[i+1].x),y:median3(run[i-1].y,p.y,run[i+1].y)};
    });
  }
  function projectorInfo(entry){
    if(Stats&&typeof Stats.projectorInfo==='function'){
      const info=Stats.projectorInfo(entry);
      const explicitConfidence=finite(entry?.confidence)?clamp(Number(entry.confidence),0,1):null;
      return {...info,confidence:explicitConfidence!==null?explicitConfidence:(info?.validated?1:0)};
    }
    const validated=!!entry&&entry.validated===true&&typeof entry.project==='function';
    return {validated,project:validated?entry.project:null,confidence:validated?(finite(entry?.confidence)?clamp(Number(entry.confidence),0,1):1):0};
  }
  function robustMetricForTrack(track,projectors){
    const path=track?.fullPath||[];
    let eligibleDt=0,metricDt=0,distanceM=0,maxSpeedKmh=0,sprintCount=0,rejectedSpeedPairs=0,confidenceDt=0;
    let sprintQualifiedSeconds=0,sprintCandidateSeconds=0,sprintEpisodeCounted=false;
    const speeds=[],runs=[];let current=[];
    const resetSprint=()=>{sprintCandidateSeconds=0;sprintEpisodeCounted=false;};
    const flush=()=>{if(current.length)runs.push(current);current=[];};
    for(let i=0;i<path.length;i++){
      const p=path[i];
      if(i>0){const a=path[i-1];if(finite(a.time)&&finite(p.time)){const dt=Number(p.time)-Number(a.time);if(a.segment===p.segment&&dt>0&&dt<=3)eligibleDt+=dt;}}
      const info=projectorInfo(projectors&&projectors[p.segment]);
      let projected=null;
      if(info.validated){try{projected=info.project(p);}catch(_){projected=null;}}
      if(!projected||!finite(projected.x)||!finite(projected.y)||!finite(p.time)){flush();continue;}
      const item={x:Number(projected.x),y:Number(projected.y),time:Number(p.time),segment:p.segment,calibrationConfidence:info.confidence};
      const prev=current[current.length-1];
      if(prev&&(prev.segment!==item.segment||!(item.time-prev.time>0&&item.time-prev.time<=3)))flush();
      current.push(item);
    }
    flush();
    for(const rawRun of runs){
      const run=smoothRun(rawRun);resetSprint();
      for(let i=1;i<run.length;i++){
        const a=run[i-1],b=run[i],dt=b.time-a.time;
        const d=hypot(a,b),speedKmh=(d/dt)*3.6;
        if(!finite(d)||d<0||!finite(speedKmh)||speedKmh>45){resetSprint();rejectedSpeedPairs++;continue;}
        const pairConfidence=Math.min(finite(a.calibrationConfidence)?a.calibrationConfidence:1,finite(b.calibrationConfidence)?b.calibrationConfidence:1);
        metricDt+=dt;confidenceDt+=dt*clamp(pairConfidence,0,1);distanceM+=d;maxSpeedKmh=Math.max(maxSpeedKmh,speedKmh);speeds.push({time:b.time,segment:b.segment,kmh:speedKmh,calibrationConfidence:+clamp(pairConfidence,0,1).toFixed(3)});
        if(speedKmh>=SPRINT_THRESHOLD_KMH){
          sprintCandidateSeconds+=dt;
          if(!sprintEpisodeCounted&&sprintCandidateSeconds>=MIN_SPRINT_SECONDS){sprintCount++;sprintEpisodeCounted=true;}
          if(sprintEpisodeCounted)sprintQualifiedSeconds+=dt;
        }else resetSprint();
      }
      resetSprint();
    }
    const coverage=eligibleDt>0?metricDt/eligibleDt:0,avgSpeedKmh=metricDt>0?(distanceM/metricDt)*3.6:null;
    const avgCalibrationConfidence=metricDt>0?confidenceDt/metricDt:0;
    const defendableScore=coverage*avgCalibrationConfidence;
    const quality=qualityFromEvidenceScore(defendableScore);
    return {metricCoverage:+coverage.toFixed(4),metricCoveredSeconds:+metricDt.toFixed(3),eligibleSeconds:+eligibleDt.toFixed(3),distanceM:metricDt>0?+distanceM.toFixed(2):null,avgSpeedKmh:avgSpeedKmh===null?null:+avgSpeedKmh.toFixed(2),maxSpeedKmh:metricDt>0?+maxSpeedKmh.toFixed(2):null,sprintCount:metricDt>0?sprintCount:null,sprintQualifiedSeconds:metricDt>0?+sprintQualifiedSeconds.toFixed(3):null,sprintThresholdKmh:SPRINT_THRESHOLD_KMH,minSprintDurationSeconds:MIN_SPRINT_SECONDS,quality,avgCalibrationConfidence:+avgCalibrationConfidence.toFixed(4),defendableScore:+defendableScore.toFixed(4),speedSamples:speeds,rejectedSpeedPairs,smoothing:'MEDIAN_3_POINTS_PAR_RUN_METRIQUE',qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',sprintContinuityPolicy:'EPISODE >= 1S A >=25KMH; RESET_SUR_CUT_SEGMENT_GAP_TEMPOREL_PAIRE_REJETEE_OU_RUN_METRIQUE'};
  }
  function patchTeamCalibrationEvidence(report){
    const frames=Array.isArray(report?.teamTimeline)?report.teamTimeline:[];
    let observedSlots=0,metricSlots=0,confidenceSlots=0;
    for(const frame of frames){
      if(frame?.valid===false)continue;
      const present=Math.max(0,Number(frame?.presentCount)||0);observedSlots+=present;
      if(frame?.metricProjectionValidated&&present>0){
        const confidence=finite(frame.metricCalibrationConfidence)?clamp(Number(frame.metricCalibrationConfidence),0,1):1;
        metricSlots+=present;confidenceSlots+=present*confidence;
        frame.metricEvidenceScore=+confidence.toFixed(4);
        frame.metricQuality=qualityFromEvidenceScore(confidence);
      }else{
        frame.metricEvidenceScore=0;frame.metricQuality='INDISPONIBLE';
      }
    }
    const evidenceScore=observedSlots?confidenceSlots/observedSlots:0;
    const avgCalibrationConfidence=metricSlots?confidenceSlots/metricSlots:0;
    if(report?.teamCoverage){
      report.teamCoverage.metricEvidenceScore=+evidenceScore.toFixed(4);
      report.teamCoverage.metricAverageCalibrationConfidence=+avgCalibrationConfidence.toFixed(4);
      report.teamCoverage.metricQuality=qualityFromEvidenceScore(evidenceScore);
      report.teamCoverage.metricQualityPolicy='COUVERTURE_JOUEURS × CONFIANCE_CALIBRATION';
    }
    if(report?.team){
      report.team.instantaneousMetricEvidenceScore=+evidenceScore.toFixed(4);
      report.team.metricAverageCalibrationConfidence=+avgCalibrationConfidence.toFixed(4);
    }
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
      patchTeamCalibrationEvidence(report);
      report.metricQualityGuard={version:'CAY_METRIC_QUALITY_GUARD_V1',smoothing:'MEDIAN_3_POINTS_PAR_RUN_METRIQUE',qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',sprintPolicy:'UN_SPRINT_COMPTE_SEULEMENT_APRES_1S_CONTINUE_A_AU_MOINS_25_KMH',principle:'filtre médian local avant calcul distance/vitesse, combinaison explicite couverture × confiance calibration et durée minimale avant de compter un sprint'};
      return report;
    };
    Stats.__cayMetricQualityGuardPatched=true;return true;
  }
  patch();
  return {smoothRun,robustMetricForTrack,patch,patchTeamCalibrationEvidence,qualityFromEvidenceScore,SPRINT_THRESHOLD_KMH,MIN_SPRINT_SECONDS};
});