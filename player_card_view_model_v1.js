(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./stable_tracking_bridge_v1.js'):root.CAYStableTrackingBridge,
    typeof module==='object'&&module.exports?require('./player_card_roster_binding_v1.js'):root.CAYPlayerCardRosterBinding,
    root
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerCardViewModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Bridge,RosterBinding,root){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const pct=v=>finite(v)?Math.max(0,Math.min(100,Math.round(Number(v)*100))):0;
  const unavailable=reason=>({status:'INDISPONIBLE',value:null,reason:reason||'preuve insuffisante'});
  function metricValue(metric,key,label){
    if(!metric||metric.rosterBound!==true)return unavailable('liaison roster fiable et participation confirmée requises');
    const scoped=metric?.publication?.fieldStatus?.[key];
    if(scoped?.status==='INDISPONIBLE')return unavailable(scoped.reason||'preuve spécifique insuffisante pour cette métrique');
    if(!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0||!finite(metric[key]))return unavailable(scoped?.reason||'projection terrain métrique non défendable');
    const status=scoped?.status==='FIABLE'?'FIABLE':metric.quality==='FIABLE'?'FIABLE':'PARTIEL';
    return {status,value:Number(metric[key]),label,coverage:pct(metric.metricCoverage),reason:null};
  }
  function legacySpatialCoveragePct(spatial){
    const total=Number(spatial?.participationWindowCount||0),rendered=Number(spatial?.renderedWindowCount||0);
    if(!Number.isFinite(total)||total<=0||!Number.isFinite(rendered)||rendered<=0)return 0;
    return pct(Math.max(0,Math.min(total,rendered))/total);
  }
  function windowDurationSeconds(window){
    if(!finite(window?.startMs)||!finite(window?.endMs))return null;
    const start=Number(window.startMs),end=Number(window.endMs);
    return end>start?(end-start)/1000:null;
  }
  function windowSpatialEvidenceCoverage(window){
    const spatial=window?.spatial;
    if(finite(spatial?.temporalCoverage))return clamp01(spatial.temporalCoverage);
    if(finite(spatial?.trajectory?.metricCoverage))return clamp01(spatial.trajectory.metricCoverage);
    if(spatial?.status==='DISPONIBLE'||spatial?.trajectory?.status==='DISPONIBLE')return 1;
    return 0;
  }
  function spatialCoverageEvidence(spatial,windows){
    const input=Array.isArray(windows)?windows:[];
    const sourceIndexes=Array.isArray(spatial?.geometry?.sourceWindowIndexes)?spatial.geometry.sourceWindowIndexes:[];
    const allDurations=input.map(windowDurationSeconds);
    const temporalReady=input.length>0&&allDurations.every(duration=>finite(duration)&&Number(duration)>0)&&sourceIndexes.length>0;
    if(temporalReady){
      const coherent=new Set(sourceIndexes.map(value=>String(value)));
      const participationSeconds=allDurations.reduce((sum,value)=>sum+Number(value),0);
      const renderedSeconds=input.reduce((sum,window,index)=>{
        if(!coherent.has(String(window?.index??index)))return sum;
        return sum+Number(allDurations[index])*windowSpatialEvidenceCoverage(window);
      },0);
      if(participationSeconds>0){
        return {
          pct:pct(Math.min(participationSeconds,Math.max(0,renderedSeconds))/participationSeconds),
          basis:'TEMPORAL_SECONDS',
          participationSeconds:+participationSeconds.toFixed(3),
          renderedSeconds:+Math.min(participationSeconds,Math.max(0,renderedSeconds)).toFixed(3)
        };
      }
    }
    return {pct:legacySpatialCoveragePct(spatial),basis:'WINDOW_EQUIVALENT',participationSeconds:null,renderedSeconds:null};
  }
  function spatialCoveragePct(spatial,windows){return spatialCoverageEvidence(spatial,windows).pct;}
  function metricAvailable(metric){return !!metric&&metric.status!=='INDISPONIBLE'&&finite(metric.value);}
  function firstResultsReadiness(card){
    const tracking=Number(card?.presence?.observations||0)>0||card?.observedVisuals?.status==='DISPONIBLE';
    const trajectory=card?.pitchVisuals?.trajectory?.status==='DISPONIBLE';
    const heatmap=card?.pitchVisuals?.heatmap?.status==='DISPONIBLE';
    const distance=metricAvailable(card?.metrics?.distanceM);
    const avgSpeed=metricAvailable(card?.metrics?.avgSpeedKmh);
    const maxSpeed=metricAvailable(card?.metrics?.maxSpeedKmh);
    const sprints=metricAvailable(card?.metrics?.sprintCount);
    const physical=distance||avgSpeed||maxSpeed||sprints;
    const pitch=trajectory||heatmap||physical;
    const status=pitch?'TERRAIN_DISPONIBLE':tracking?'TRACKING_DISPONIBLE':'INDISPONIBLE';
    return {status,tracking,trajectory,heatmap,distance,avgSpeed,maxSpeed,sprints,physicalMetrics:physical,pitchResults:pitch};
  }
  function readinessSummary(cards){
    const readiness=(cards||[]).map(firstResultsReadiness),count=key=>readiness.filter(r=>r[key]===true).length;
    const withTracking=count('tracking'),withPitchTrajectory=count('trajectory'),withPitchHeatmap=count('heatmap'),withMetricDistance=count('distance'),withMetricAvgSpeed=count('avgSpeed'),withMetricMaxSpeed=count('maxSpeed'),withMetricSprints=count('sprints'),withPhysicalMetrics=count('physicalMetrics'),withPitchResults=count('pitchResults');
    const status=withPitchResults?'TERRAIN_DISPONIBLE':withTracking?'TRACKING_DISPONIBLE':'INDISPONIBLE';
    return {status,players:readiness.length,withTracking,withPitchTrajectory,withPitchHeatmap,withMetricDistance,withMetricAvgSpeed,withMetricMaxSpeed,withMetricSprints,withPhysicalMetrics,withPitchResults,policy:'PREMIERS_RESULTATS_SEPARENT_TRACKING_CAMERA_VISUELS_TERRAIN_ET_METRIQUES_PHYSIQUES; AUCUNE_DISPONIBILITE_DEDUITE_SANS_PREUVE_PUBLIEE'};
  }
  function rosterPitchVisuals(player){
    const rm=player&&player.rosterMetric||null,spatial=rm&&rm.spatial||null;
    const rosterEvidenceAvailable=rm&&(rm.status==='FIABLE'||rm.status==='PARTIEL');
    if(!rosterEvidenceAvailable||!spatial||spatial.status==='INDISPONIBLE')return {status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:null,pitchWidthM:null,trajectory:null,heatmap:null,metricCoverage:0,physicalMetricCoverage:0,spatialCoverage:0,spatialCoverageBasis:null,participationSeconds:null,renderedSeconds:null,reason:rm?.reason||spatial?.reason||'liaison roster fiable et participation confirmées pour les visuels terrain',source:'ROSTER_METRIC_PIPELINE_V1'};

    const heatmap=spatial?.heatmap&&spatial.heatmap.status==='DISPONIBLE'?spatial.heatmap:null;
    const geometry=spatial?.geometry||null;
    const pitchLengthM=finite(geometry?.pitchLengthM)?Number(geometry.pitchLengthM):(finite(heatmap?.pitchLengthM)?Number(heatmap.pitchLengthM):null);
    const pitchWidthM=finite(geometry?.pitchWidthM)?Number(geometry.pitchWidthM):(finite(heatmap?.pitchWidthM)?Number(heatmap.pitchWidthM):null);
    const rawRuns=Array.isArray(spatial?.trajectory?.runs)?spatial.trajectory.runs:[];
    const runs=rawRuns.map(run=>Array.isArray(run)?run:(Array.isArray(run?.points)?run.points:[])).filter(run=>run.length);
    const trajectory=runs.length&&finite(pitchLengthM)&&finite(pitchWidthM)?{
      status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',runs,
      sourceWindowIndexes:Array.isArray(spatial?.trajectory?.sourceWindowIndexes)?[...spatial.trajectory.sourceWindowIndexes]:[],
      policy:spatial?.trajectory?.policy||'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION_ET_AUCUN_MELANGE_DE_GEOMETRIES_TERRAIN'
    }:{status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',runs:[],sourceWindowIndexes:[],policy:'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION_ET_AUCUN_MELANGE_DE_GEOMETRIES_TERRAIN'};
    if(!heatmap&&trajectory.status==='INDISPONIBLE')return {status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:null,pitchWidthM:null,trajectory,heatmap:null,metricCoverage:0,physicalMetricCoverage:0,spatialCoverage:0,spatialCoverageBasis:null,participationSeconds:null,renderedSeconds:null,reason:spatial?.reason||'aucun visuel terrain défendable dans les fenêtres de participation confirmées',source:'ROSTER_METRIC_PIPELINE_V1'};

    const participationWindowCount=Number(spatial.participationWindowCount||0);
    const availableWindowCount=Number(spatial.availableWindowCount||0);
    const renderedWindowCount=Number(spatial.renderedWindowCount||0);
    const excludedGeometryWindowCount=Number(spatial.excludedGeometryWindowCount||0);
    const coverageEvidence=spatialCoverageEvidence(spatial,rm?.windows);
    const spatialCoverage=coverageEvidence.pct;
    const physicalMetricCoverage=pct(player?.metric?.metricCoverage);
    const quality=rm.status==='FIABLE'&&spatial.status==='FIABLE'?'FIABLE':'PARTIEL';
    return {
      status:'DISPONIBLE',quality,coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,trajectory,heatmap,
      metricCoverage:spatialCoverage,spatialCoverage,spatialCoverageBasis:coverageEvidence.basis,participationSeconds:coverageEvidence.participationSeconds,renderedSeconds:coverageEvidence.renderedSeconds,physicalMetricCoverage,participationWindowCount,availableWindowCount,renderedWindowCount,
      excludedGeometryWindowCount,coverageNote:spatial.coverageNote||rm.reason||null,reason:null,source:'ROSTER_METRIC_PIPELINE_V1',
      coveragePolicy:'COUVERTURE_TERRAIN = SECONDES_SPATIALES_DEFENDABLES / SECONDES_DE_PARTICIPATION_QUAND_LES_BORNES_TEMPORELLES_SONT_COMPLETES; SINON_FALLBACK_EXPLICITE_EN_EQUIVALENT_FENETRES; LA_COUVERTURE_DES_METRIQUES_PHYSIQUES_RESTE_SEPAREE',
      policy:'VISUELS_TERRAIN_CONSOMMES_EXCLUSIVEMENT_DEPUIS_LE_CONTRAT_SPATIAL_CENTRALISE_ROSTER_METRIC_PIPELINE_V1; UN_STATUT_PARENT_PARTIEL_PEUT_ETRE_AFFICHE_MAIS_JAMAIS_PROMU_EN_QUALITE_FIABLE'
    };
  }
  function buildCard(player){
    const observed=player&&player.observedVisuals||null,metric=player&&player.metric||null;
    const observedOk=observed&&observed.status==='DISPONIBLE';
    const pitchVisuals=rosterPitchVisuals(player);
    const card={
      id:player?.id??null,
      category:player?.cat||null,
      identity:{status:player?.identityQuality||'INDISPONIBLE',confidence:finite(player?.identityConfidence)?Number(player.identityConfidence):null,reidentifications:Number(player?.reidentifications||0)},
      presence:{observedDuration:finite(player?.observedDuration)?Number(player.observedDuration):null,observations:Number(player?.observations||0),segments:Array.isArray(player?.segments)?player.segments:[],intervals:Array.isArray(player?.presenceIntervals)?player.presenceIntervals:[],trackingCoverage:observedOk?pct(observed.observationCoverage):0},
      observedVisuals:{status:observedOk?'DISPONIBLE':'INDISPONIBLE',coordinateSystem:'IMAGE_NORMALIZED',semantic:'PRESENCE_DANS_LE_CADRE_CAMERA',trajectory:observedOk?observed.trajectory:null,heatmap:observedOk?observed.heatmap:null,physicalMetricsAllowed:false,reason:observedOk?null:(observed?.reason||'visualisation observée indisponible')},
      pitchVisuals,
      metrics:{distanceM:metricValue(metric,'distanceM','Distance'),avgSpeedKmh:metricValue(metric,'avgSpeedKmh','Vitesse moyenne'),maxSpeedKmh:metricValue(metric,'maxSpeedKmh','Vitesse max'),sprintCount:metricValue(metric,'sprintCount','Sprints')},
      rosterState:player?.rosterState||null,
      policies:{imageSpace:'VISUEL_OBSERVE_UNIQUEMENT; JAMAIS_UTILISE_POUR_METRES_KMH_SPRINTS',metricSpace:'STATISTIQUES_ET_VISUELS_TERRAIN_UNIQUEMENT_SUR_PROJECTION_VALIDEE_ET_LIAISON_ROSTER_FIABLE'}
    };
    return {...card,firstResults:firstResultsReadiness(card)};
  }
  function build(report,rosterContext){
    const players=Array.isArray(report?.players)?report.players:[];
    const cards=players.map(buildCard);
    const readiness=readinessSummary(cards);
    const model={version:'CAY_PLAYER_CARD_VIEW_MODEL_V1',status:cards.length?'DISPONIBLE':'INDISPONIBLE',players:cards,summary:{players:cards.length,withObservedVisuals:cards.filter(c=>c.observedVisuals.status==='DISPONIBLE').length,withPitchVisuals:cards.filter(c=>c.pitchVisuals.status==='DISPONIBLE').length,withMetricDistance:cards.filter(c=>c.metrics.distanceM.status!=='INDISPONIBLE').length,...readiness},policy:'FICHE_JOUEUR_CAY_SEPARE_STRICTEMENT_OBSERVATION_CAMERA_ET_METRIQUES_TERRAIN; METRIQUES_ET_VISUELS_TERRAIN PUBLIES_UNIQUEMENT_APRES_LIAISON_ROSTER_FIABLE_ET_PARTICIPATION_CONFIRMEE'};
    return RosterBinding&&typeof RosterBinding.enrichModel==='function'&&rosterContext?RosterBinding.enrichModel(model,rosterContext):model;
  }
  function attach(report,rosterContext){return report?{...report,playerCards:build(report,rosterContext)}:report;}
  function patchBridge(){
    if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayPlayerCardViewModelPatched===true)return false;
    const baseCreate=Bridge.create.bind(Bridge);
    Bridge.create=function(options){const instance=baseCreate(options),baseReport=instance.report.bind(instance);instance.report=function(projectors,visualOptions){const ctx=visualOptions&&visualOptions.rosterContext||null;return attach(baseReport(projectors,visualOptions),ctx);};return instance;};
    Bridge.__cayPlayerCardViewModelPatched=true;
    return true;
  }
  function loadRenderer(){
    if(typeof document==='undefined'||root.CAYPlayerCardRenderer)return false;
    if(document.querySelector('script[data-cay-player-card-renderer="v1"]'))return true;
    const script=document.createElement('script');
    script.src='./player_card_renderer_v1.js';
    script.async=false;
    script.dataset.cayPlayerCardRenderer='v1';
    script.onload=()=>{try{root.CAYPlayerCardRenderer?.install?.();}catch(_){}};
    (document.head||document.documentElement).appendChild(script);
    return true;
  }
  function loadClubRosterIdentityUI(){
    if(typeof document==='undefined'||root.CAYClubRosterIdentityUI)return false;
    if(document.querySelector('script[data-cay-club-roster-identity-ui="v1"]'))return true;
    const script=document.createElement('script');
    script.src='./club_roster_identity_ui_v1.js';
    script.async=false;
    script.dataset.cayClubRosterIdentityUi='v1';
    (document.head||document.documentElement).appendChild(script);
    return true;
  }
  patchBridge();
  loadRenderer();
  if(typeof setTimeout==='function')setTimeout(loadClubRosterIdentityUI,0);
  return {buildCard,build,attach,patchBridge,metricValue,spatialCoveragePct,spatialCoverageEvidence,metricAvailable,firstResultsReadiness,readinessSummary,rosterPitchVisuals,loadRenderer,loadClubRosterIdentityUI};
});