(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats,
    typeof module==='object'&&module.exports ? require('./metric_motion_plausibility_v1.js') : root.CAYMetricMotionPlausibility,
    typeof module==='object'&&module.exports ? require('./metric_trajectory_smoother_v1.js') : root.CAYMetricTrajectorySmoother
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricQualityGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Stats,Motion,MetricSmoother){
  'use strict';
  const hypot=(a,b)=>Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0));
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const median3=(a,b,c)=>a+b+c-Math.min(a,b,c)-Math.max(a,b,c);
  const SPRINT_THRESHOLD_KMH=25;
  const MIN_SPRINT_SECONDS=1;
  const RAW_SPIKE_THRESHOLD_KMH=Number.isFinite(Number(Motion?.RAW_SPIKE_THRESHOLD_KMH))?Number(Motion.RAW_SPIKE_THRESHOLD_KMH):55;
  const MAX_METRIC_GAP_SEC=Number.isFinite(Number(Stats?.MAX_METRIC_GAP_SEC))?Number(Stats.MAX_METRIC_GAP_SEC):1;
  const qualityFromEvidenceScore=score=>score>=.8?'FIABLE':score>0?'PARTIEL':'INDISPONIBLE';
  const insideMetricPitch=p=>!!MetricSmoother&&typeof MetricSmoother.insidePitch==='function'&&MetricSmoother.insidePitch(p);
  const validTimestampSample=p=>!!p&&typeof p==='object'&&finite(p.time);
  const validPathSample=p=>validTimestampSample(p)&&p.segment!==null&&p.segment!==undefined&&!(typeof p.segment==='string'&&p.segment.trim()==='');
  function smoothRun(run){
    if(!Array.isArray(run)||run.length<3)return (run||[]).map(p=>({...p}));
    return run.map((p,i)=>{
      if(i===0||i===run.length-1)return {...p};
      return {...p,x:median3(run[i-1].x,p.x,run[i+1].x),y:median3(run[i-1].y,p.y,run[i+1].y)};
    });
  }
  function splitRawSpikeRuns(run,maxRawSpeedKmh=RAW_SPIKE_THRESHOLD_KMH){
    if(Motion&&typeof Motion.splitRawSpikeRuns==='function')return Motion.splitRawSpikeRuns(run,maxRawSpeedKmh);
    return {runs:[],rejectedPairs:Array.isArray(run)&&run.length>1?run.length-1:0};
  }
  function projectorInfo(entry){
    if(Stats&&typeof Stats.projectorInfo==='function'){
      const info=Stats.projectorInfo(entry);
      const explicitConfidence=finite(entry?.confidence)?clamp(Number(entry.confidence),0,1):null;
      return {...info,confidence:explicitConfidence};
    }
    const validated=!!entry&&entry.validated===true&&typeof entry.project==='function';
    return {validated,project:validated?entry.project:null,confidence:finite(entry?.confidence)?clamp(Number(entry.confidence),0,1):null};
  }
  function robustMetricForTrack(track,projectors){
    const path=track?.fullPath||[];
    let eligibleDt=0,metricDt=0,distanceM=0,maxSpeedKmh=0,sprintCount=0,rejectedSpeedPairs=0,rejectedRawSpikePairs=0,confidenceDt=0,rejectedGapSeconds=0,gapBreaks=0,segmentBoundarySeconds=0,segmentBoundaryBreaks=0,rejectedOutsidePitchSamples=0,rejectedOutsidePitchSeconds=0,rejectedOutsidePitchIntervals=0,rejectedInvalidPathSamples=0,rejectedInvalidPathSeconds=0,rejectedInvalidPathIntervals=0,rejectedUnvalidatedProjectorSamples=0,rejectedProjectionFailureSamples=0,rejectedProjectionSeconds=0,rejectedProjectionIntervals=0;
    let sprintQualifiedSeconds=0,sprintCandidateSeconds=0,sprintEpisodeCounted=false;
    const speeds=[],runs=[],projectionRejectedIndexes=new Set(),outsidePitchRejectedIndexes=new Set();let current=[];
    const resetSprint=()=>{sprintCandidateSeconds=0;sprintEpisodeCounted=false;};
    const flush=()=>{if(current.length)runs.push(current);current=[];};
    for(let i=0;i<path.length;i++){
      const p=path[i];
      if(i>0){
        const a=path[i-1];
        if(validTimestampSample(a)&&validTimestampSample(p)){
          const dt=Number(p.time)-Number(a.time);
          if(dt>0){
            eligibleDt+=dt;
            if(!validPathSample(a)||!validPathSample(p)){rejectedInvalidPathSeconds+=dt;rejectedInvalidPathIntervals++;}
            else if(a.segment!==p.segment){segmentBoundarySeconds+=dt;segmentBoundaryBreaks++;}
            else if(dt>MAX_METRIC_GAP_SEC){rejectedGapSeconds+=dt;gapBreaks++;}
          }
        }
      }
      if(!validPathSample(p)){
        rejectedInvalidPathSamples++;
        flush();
        continue;
      }
      const info=projectorInfo(projectors&&projectors[p.segment]);
      if(!info.validated){rejectedUnvalidatedProjectorSamples++;projectionRejectedIndexes.add(i);flush();continue;}
      let projected=null;
      try{projected=info.project(p);}catch(_){rejectedProjectionFailureSamples++;projectionRejectedIndexes.add(i);flush();continue;}
      if(!projected||!finite(projected.x)||!finite(projected.y)){rejectedProjectionFailureSamples++;projectionRejectedIndexes.add(i);flush();continue;}
      const item={x:Number(projected.x),y:Number(projected.y),time:Number(p.time),segment:p.segment,calibrationConfidence:info.confidence};
      if(!insideMetricPitch(item)){rejectedOutsidePitchSamples++;outsidePitchRejectedIndexes.add(i);flush();continue;}
      const prev=current[current.length-1];
      if(prev&&(prev.segment!==item.segment||!(item.time-prev.time>0&&item.time-prev.time<=MAX_METRIC_GAP_SEC)))flush();
      current.push(item);
    }
    flush();
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i];
      if(!validPathSample(a)||!validPathSample(b)||a.segment!==b.segment)continue;
      const dt=Number(b.time)-Number(a.time);
      if(!(dt>0&&dt<=MAX_METRIC_GAP_SEC))continue;
      if(projectionRejectedIndexes.has(i-1)||projectionRejectedIndexes.has(i)){rejectedProjectionSeconds+=dt;rejectedProjectionIntervals++;}
      if(outsidePitchRejectedIndexes.has(i-1)||outsidePitchRejectedIndexes.has(i)){rejectedOutsidePitchSeconds+=dt;rejectedOutsidePitchIntervals++;}
    }
    for(const rawRun of runs){
      const rawSplit=splitRawSpikeRuns(rawRun);rejectedRawSpikePairs+=rawSplit.rejectedPairs;
      for(const safeRawRun of rawSplit.runs){
        const run=smoothRun(safeRawRun);resetSprint();
        for(let i=1;i<run.length;i++){
          const a=run[i-1],b=run[i],dt=b.time-a.time;
          const d=hypot(a,b),speedKmh=(d/dt)*3.6;
          if(!finite(d)||d<0||!finite(speedKmh)||speedKmh>45){resetSprint();rejectedSpeedPairs++;continue;}
          const pairConfidence=Math.min(finite(a.calibrationConfidence)?a.calibrationConfidence:0,finite(b.calibrationConfidence)?b.calibrationConfidence:0);
          metricDt+=dt;confidenceDt+=dt*clamp(pairConfidence,0,1);distanceM+=d;maxSpeedKmh=Math.max(maxSpeedKmh,speedKmh);
          if(i===1)speeds.push({time:a.time,segment:a.segment,kmh:speedKmh,calibrationConfidence:+clamp(pairConfidence,0,1).toFixed(3),sampleRole:'RUN_INTERVAL_ANCHOR'});
          speeds.push({time:b.time,segment:b.segment,kmh:speedKmh,calibrationConfidence:+clamp(pairConfidence,0,1).toFixed(3),sampleRole:'INTERVAL_END'});
          if(speedKmh>=SPRINT_THRESHOLD_KMH){
            sprintCandidateSeconds+=dt;
            if(!sprintEpisodeCounted&&sprintCandidateSeconds>=MIN_SPRINT_SECONDS){
              sprintCount++;sprintEpisodeCounted=true;sprintQualifiedSeconds+=sprintCandidateSeconds;
            }else if(sprintEpisodeCounted)sprintQualifiedSeconds+=dt;
          }else resetSprint();
        }
        resetSprint();
      }
    }
    const coverage=eligibleDt>0?metricDt/eligibleDt:0,avgSpeedKmh=metricDt>0?(distanceM/metricDt)*3.6:null;
    const avgCalibrationConfidence=metricDt>0?confidenceDt/metricDt:0;
    const defendableScore=coverage*avgCalibrationConfidence;
    const quality=qualityFromEvidenceScore(defendableScore);
    return {metricCoverage:+coverage.toFixed(4),metricCoveredSeconds:+metricDt.toFixed(3),eligibleSeconds:+eligibleDt.toFixed(3),distanceM:metricDt>0?+distanceM.toFixed(2):null,avgSpeedKmh:avgSpeedKmh===null?null:+avgSpeedKmh.toFixed(2),maxSpeedKmh:metricDt>0?+maxSpeedKmh.toFixed(2):null,sprintCount:metricDt>0?sprintCount:null,sprintQualifiedSeconds:metricDt>0?+sprintQualifiedSeconds.toFixed(3):null,sprintThresholdKmh:SPRINT_THRESHOLD_KMH,minSprintDurationSeconds:MIN_SPRINT_SECONDS,rawSpikeThresholdKmh:RAW_SPIKE_THRESHOLD_KMH,maxMetricGapSec:MAX_METRIC_GAP_SEC,quality,avgCalibrationConfidence:+avgCalibrationConfidence.toFixed(4),defendableScore:+defendableScore.toFixed(4),speedSamples:speeds,rejectedSpeedPairs,rejectedRawSpikePairs,rejectedOutsidePitchSamples,rejectedOutsidePitchSeconds:+rejectedOutsidePitchSeconds.toFixed(3),rejectedOutsidePitchIntervals,rejectedInvalidPathSamples,rejectedInvalidPathSeconds:+rejectedInvalidPathSeconds.toFixed(3),rejectedInvalidPathIntervals,rejectedUnvalidatedProjectorSamples,rejectedProjectionFailureSamples,rejectedProjectionSeconds:+rejectedProjectionSeconds.toFixed(3),rejectedProjectionIntervals,rejectedGapSeconds:+rejectedGapSeconds.toFixed(3),gapBreaks,segmentBoundarySeconds:+segmentBoundarySeconds.toFixed(3),segmentBoundaryBreaks,smoothing:'MEDIAN_3_POINTS_PAR_RUN_METRIQUE_APRES_VETO_SPIKE_BRUT',qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',calibrationConfidencePolicy:'CONFIANCE_EXPLICITE_REQUISE; ABSENTE_OU_INVALIDE = 0_POUR_DEFENDABILITE',projectionRejectionPolicy:'PROJECTEUR_NON_VALIDE = REJET_INDISPONIBLE; PROJECTEUR_VALIDE_QUI_LEVE_UNE_ERREUR_OU_RENVOIE_UNE_COORDONNEE_NON_FINIE = ECHEC_PROJECTION; LES_INTERVALLES_ADJACENTS_TOUCHES_RESTENT_DANS_LE_TEMPS_ELIGIBLE_ET_SONT_AUDITES_PAR rejectedProjectionSeconds/rejectedProjectionIntervals; DANS_TOUS_LES_CAS_COUPURE_DE_CONTINUITE_ET_AUCUNE_DISTANCE',speedSamplePolicy:'CHAQUE_RUN_EXPOSE_UNE_ANCRE_AU_DEBUT_DU_PREMIER_INTERVALLE_PUIS_LES_FINS_D_INTERVALLES_POUR_PRESERVER_LA_DUREE_REELLE_DE_PREUVE',coveragePolicy:'TOUT_INTERVALLE_CHRONOLOGIQUE_ADJACENT_AVEC_TIMESTAMPS_VALIDES_RESTE_DANS_LE_TEMPS_ELIGIBLE; ENTREE_STRUCTURELLEMENT_INVALIDE_CHANGEMENT_PLAN_TROU_TEMPOREL_COORDONNEE_HORS_TERRAIN_OU_SPIKE_BRUT_RESTE_NON_DEFENDABLE_ET_NE_CREE_JAMAIS_DE_DISTANCE',invalidPathPolicy:'ENTREE_TRAJECTOIRE_CORROMPUE = COUPURE_DE_CONTINUITE; SI_SES_TIMESTAMPS_ADJACENTS_SONT_VALIDES_LE_TEMPS_RESTE_ELIGIBLE_MAIS_NON_DEFENDABLE; JAMAIS_PROJETEE_JAMAIS_RELIEE_JAMAIS_COMPTEE_COMME_DISTANCE',rawSpikePolicy:'VETO_AVANT_LISSAGE_SI_VITESSE_BRUTE_SUPERIEURE_A_55_KMH; LE_LISSAGE_NE_PEUT_PAS_MASQUER_UN_TELEPORT_METRIQUE',pitchBoundsPolicy:'REUTILISE_METRIC_TRAJECTORY_SMOOTHER_INSIDE_PITCH_105_X_68; INTERVALLES_ADJACENTS_A_UN_ECHANTILLON_HORS_TERRAIN_AUDITES_PAR rejectedOutsidePitchSeconds/rejectedOutsidePitchIntervals; AUCUNE_DISTANCE_VITESSE_OU_SPRINT_A_TRAVERS_COORDONNEE_HORS_TERRAIN',sprintContinuityPolicy:'EPISODE >= 1S A >=25KMH; RESET_SUR_CUT_SEGMENT_GAP_TEMPOREL_SPIKE_BRUT_PAIRE_REJETEE_OU_RUN_METRIQUE'};
  }
  function metricUnavailableReason(metric){
    if(metric?.metricCoverage>0)return null;
    if((metric?.rejectedUnvalidatedProjectorSamples||0)>0)return 'projection terrain métrique indisponible ou non validée';
    if((metric?.rejectedProjectionFailureSamples||0)>0)return 'projection terrain métrique validée mais calcul impossible ou non fini';
    if((metric?.rejectedOutsidePitchSamples||0)>0)return 'projection terrain rejetée car hors limites métriques du terrain';
    if((metric?.rejectedInvalidPathSamples||0)>0)return 'trajectoire insuffisamment valide pour produire une métrique défendable';
    return 'aucun intervalle métrique défendable';
  }
  function patchTeamCalibrationEvidence(report){
    const frames=Array.isArray(report?.teamTimeline)?report.teamTimeline:[];
    let observedSlots=0,metricSlots=0,confidenceSlots=0;
    for(const frame of frames){
      if(frame?.valid===false)continue;
      const present=Math.max(0,Number(frame?.presentCount)||0);observedSlots+=present;
      if(frame?.metricProjectionValidated&&present>0){
        const confidence=finite(frame.metricCalibrationConfidence)?clamp(Number(frame.metricCalibrationConfidence),0,1):0;
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
        const metric=robustMetricForTrack(raw,projectors||{});p.metric={...metric,reason:metricUnavailableReason(metric)};
        if(p.quality){p.quality.metricDistance=metric.quality;p.quality.metricSpeed=metric.quality;p.quality.sprints=metric.quality;}
      }
      const measured=(report.players||[]).filter(p=>p.metric?.metricCoverage>0),all=report.players||[];
      if(report.team){report.team.playersWithMetricData=measured.length;report.team.measuredDistanceM=+measured.reduce((s,p)=>s+(p.metric.distanceM||0),0).toFixed(2);report.team.avgMetricCoverage=+(all.length?all.reduce((s,p)=>s+(p.metric?.metricCoverage||0),0)/all.length:0).toFixed(4);}
      patchTeamCalibrationEvidence(report);
      report.metricQualityGuard={version:'CAY_METRIC_QUALITY_GUARD_V1_11',smoothing:'MEDIAN_3_POINTS_PAR_RUN_METRIQUE_APRES_VETO_SPIKE_BRUT',qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',calibrationConfidencePolicy:'CONFIANCE_EXPLICITE_REQUISE; ABSENTE_OU_INVALIDE = 0_POUR_DEFENDABILITE',projectionRejectionPolicy:'PROJECTEUR_NON_VALIDE_ET_ECHEC_DE_PROJECTION_VALIDE_SONT_AUDITES_SEPAREMENT_PAR_ECHANTILLON_ET_LE_TEMPS_ADJACENT_AFFECTE_EST_AUDITE_SANS_SORTIR_DU_DENOMINATEUR; AUCUN_REJET_NE_PEUT_CREER_DISTANCE_VITESSE_OU_SPRINT',speedSamplePolicy:'ANCRE_DEBUT_PREMIER_INTERVALLE_PAR_RUN + FINS_INTERVALLES POUR_NE_PAS_PERDRE_LE_PREMIER_DT',coveragePolicy:'TOUT_INTERVALLE_ADJACENT_DONT_LES_TIMESTAMPS_SONT_VALIDES_RESTE_DANS_LE_DENOMINATEUR; ENTREE_STRUCTURELLEMENT_INVALIDE_CHANGEMENT_PLAN_TROU_TEMPOREL_COORDONNEE_HORS_TERRAIN_ET_SPIKE_BRUT_PENALISENT_EXPLICITEMENT_LA_COUVERTURE_SANS_CREER_DE_DISTANCE',invalidPathPolicy:'ENTREE_TRAJECTOIRE_CORROMPUE = COUPURE_DE_CONTINUITE; TIMESTAMPS_VALIDES_CONSERVENT_LE_TEMPS_ELIGIBLE_MAIS_NON_DEFENDABLE; JAMAIS_DE_DISTANCE_A_TRAVERS',rawSpikePolicy:'VETO_BRUT_AVANT_LISSAGE_A_55_KMH_MAX_VIA_METRIC_MOTION_PLAUSIBILITY_V1',pitchBoundsPolicy:'BORNE_TERRAIN_PARTAGEE_VIA_METRIC_TRAJECTORY_SMOOTHER_INSIDE_PITCH_105_X_68; TEMPS_ADJACENT_AUX_REJETS_HORS_TERRAIN_AUDITE_EXPLICITEMENT',sprintPolicy:'UN_SPRINT_COMPTE_SEULEMENT_APRES_1S_CONTINUE_A_AU_MOINS_25_KMH',maxMetricGapSec:MAX_METRIC_GAP_SEC,rawSpikeThresholdKmh:RAW_SPIKE_THRESHOLD_KMH,principle:'veto partagé des entrées trajectoire corrompues, changements de plan, téléports métriques bruts, projections indisponibles/échouées et coordonnées hors terrain avant tout lissage, puis filtre médian local, couverture qui conserve et audite les preuves temporelles non défendables, combinaison couverture × confiance calibration et durée minimale avant de compter un sprint'};
      return report;
    };
    Stats.__cayMetricQualityGuardPatched=true;return true;
  }
  patch();
  return {smoothRun,splitRawSpikeRuns,robustMetricForTrack,metricUnavailableReason,patch,patchTeamCalibrationEvidence,qualityFromEvidenceScore,SPRINT_THRESHOLD_KMH,MIN_SPRINT_SECONDS,RAW_SPIKE_THRESHOLD_KMH,MAX_METRIC_GAP_SEC};
});