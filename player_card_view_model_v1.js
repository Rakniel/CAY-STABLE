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
  const pct=v=>finite(v)?Math.max(0,Math.min(100,Math.round(Number(v)*100))):0;
  const unavailable=reason=>({status:'INDISPONIBLE',value:null,reason:reason||'preuve insuffisante'});
  function metricValue(metric,key,label){
    if(!metric||metric.rosterBound!==true)return unavailable('liaison roster fiable et participation confirmée requises');
    if(!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0||!finite(metric[key]))return unavailable('projection terrain métrique non défendable');
    return {status:metric.quality==='FIABLE'?'FIABLE':'PARTIEL',value:Number(metric[key]),label,coverage:pct(metric.metricCoverage),reason:null};
  }
  function rosterPitchVisuals(player){
    const rm=player&&player.rosterMetric||null,spatial=rm&&rm.spatial||null;
    if(!rm||rm.status!=='FIABLE'||!spatial||spatial.status==='INDISPONIBLE')return {status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:null,pitchWidthM:null,trajectory:null,heatmap:null,metricCoverage:0,reason:rm?.reason||spatial?.reason||'liaison roster fiable et participation confirmée requises pour les visuels terrain',source:'ROSTER_METRIC_PIPELINE_V1'};

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
    if(!heatmap&&trajectory.status==='INDISPONIBLE')return {status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:null,pitchWidthM:null,trajectory,heatmap:null,metricCoverage:0,reason:spatial?.reason||'aucun visuel terrain défendable dans les fenêtres de participation confirmées',source:'ROSTER_METRIC_PIPELINE_V1'};

    const participationWindowCount=Number(spatial.participationWindowCount||0);
    const availableWindowCount=Number(spatial.availableWindowCount||0);
    const renderedWindowCount=Number(spatial.renderedWindowCount||0);
    const excludedGeometryWindowCount=Number(spatial.excludedGeometryWindowCount||0);
    const quality=spatial.status==='FIABLE'?'FIABLE':'PARTIEL';
    return {
      status:'DISPONIBLE',quality,coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,trajectory,heatmap,
      metricCoverage:pct(player?.metric?.metricCoverage),participationWindowCount,availableWindowCount,renderedWindowCount,
      excludedGeometryWindowCount,coverageNote:spatial.coverageNote||null,reason:null,source:'ROSTER_METRIC_PIPELINE_V1',
      policy:'VISUELS_TERRAIN_CONSOMMES_EXCLUSIVEMENT_DEPUIS_LE_CONTRAT_SPATIAL_CENTRALISE_ROSTER_METRIC_PIPELINE_V1'
    };
  }
  function buildCard(player){
    const observed=player&&player.observedVisuals||null,metric=player&&player.metric||null;
    const observedOk=observed&&observed.status==='DISPONIBLE';
    const pitchVisuals=rosterPitchVisuals(player);
    return {
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
  }
  function build(report,rosterContext){
    const players=Array.isArray(report?.players)?report.players:[];
    const cards=players.map(buildCard);
    const model={version:'CAY_PLAYER_CARD_VIEW_MODEL_V1',status:cards.length?'DISPONIBLE':'INDISPONIBLE',players:cards,summary:{players:cards.length,withObservedVisuals:cards.filter(c=>c.observedVisuals.status==='DISPONIBLE').length,withPitchVisuals:cards.filter(c=>c.pitchVisuals.status==='DISPONIBLE').length,withMetricDistance:cards.filter(c=>c.metrics.distanceM.status!=='INDISPONIBLE').length},policy:'FICHE_JOUEUR_CAY_SEPARE_STRICTEMENT_OBSERVATION_CAMERA_ET_METRIQUES_TERRAIN; METRIQUES_ET_VISUELS_TERRAIN PUBLIES_UNIQUEMENT_APRES_LIAISON_ROSTER_FIABLE_ET_PARTICIPATION_CONFIRMEE'};
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
  return {buildCard,build,attach,patchBridge,metricValue,rosterPitchVisuals,loadRenderer,loadClubRosterIdentityUI};
});
