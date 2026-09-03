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
    if(!metric||!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0||!finite(metric[key]))return unavailable('projection terrain métrique non défendable');
    return {status:metric.quality==='FIABLE'?'FIABLE':'PARTIEL',value:Number(metric[key]),label,coverage:pct(metric.metricCoverage),reason:null};
  }
  function buildCard(player){
    const observed=player&&player.observedVisuals||null,metricVisuals=player&&player.metricVisuals||null,metric=player&&player.metric||null;
    const observedOk=observed&&observed.status==='DISPONIBLE';
    const metricVisualsOk=metricVisuals&&metricVisuals.status==='DISPONIBLE';
    return {
      id:player?.id??null,
      category:player?.cat||null,
      identity:{status:player?.identityQuality||'INDISPONIBLE',confidence:finite(player?.identityConfidence)?Number(player.identityConfidence):null,reidentifications:Number(player?.reidentifications||0)},
      presence:{observedDuration:finite(player?.observedDuration)?Number(player.observedDuration):null,observations:Number(player?.observations||0),segments:Array.isArray(player?.segments)?player.segments:[],intervals:Array.isArray(player?.presenceIntervals)?player.presenceIntervals:[],trackingCoverage:observedOk?pct(observed.observationCoverage):0},
      observedVisuals:{status:observedOk?'DISPONIBLE':'INDISPONIBLE',coordinateSystem:'IMAGE_NORMALIZED',semantic:'PRESENCE_DANS_LE_CADRE_CAMERA',trajectory:observedOk?observed.trajectory:null,heatmap:observedOk?observed.heatmap:null,physicalMetricsAllowed:false,reason:observedOk?null:(observed?.reason||'visualisation observée indisponible')},
      pitchVisuals:{status:metricVisualsOk?'DISPONIBLE':'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:metricVisualsOk&&finite(metricVisuals.pitchLengthM)?Number(metricVisuals.pitchLengthM):null,pitchWidthM:metricVisualsOk&&finite(metricVisuals.pitchWidthM)?Number(metricVisuals.pitchWidthM):null,trajectory:metricVisualsOk?metricVisuals.trajectory:null,heatmap:metricVisualsOk?metricVisuals.pitchHeatmap:null,metricCoverage:metricVisualsOk?pct(metricVisuals.metricCoverage):0,reason:metricVisualsOk?null:(metricVisuals?.reason||'calibration terrain non défendable')},
      metrics:{distanceM:metricValue(metric,'distanceM','Distance'),avgSpeedKmh:metricValue(metric,'avgSpeedKmh','Vitesse moyenne'),maxSpeedKmh:metricValue(metric,'maxSpeedKmh','Vitesse max'),sprintCount:metricValue(metric,'sprintCount','Sprints')},
      rosterState:player?.rosterState||null,
      policies:{imageSpace:'VISUEL_OBSERVE_UNIQUEMENT; JAMAIS_UTILISE_POUR_METRES_KMH_SPRINTS',metricSpace:'STATISTIQUES_PHYSIQUES_UNIQUEMENT_SUR_PROJECTION_TERRAIN_VALIDEE'}
    };
  }
  function build(report,rosterContext){
    const players=Array.isArray(report?.players)?report.players:[];
    const cards=players.map(buildCard);
    const model={version:'CAY_PLAYER_CARD_VIEW_MODEL_V1',status:cards.length?'DISPONIBLE':'INDISPONIBLE',players:cards,summary:{players:cards.length,withObservedVisuals:cards.filter(c=>c.observedVisuals.status==='DISPONIBLE').length,withPitchVisuals:cards.filter(c=>c.pitchVisuals.status==='DISPONIBLE').length,withMetricDistance:cards.filter(c=>c.metrics.distanceM.status!=='INDISPONIBLE').length},policy:'FICHE_JOUEUR_CAY_SEPARE_STRICTEMENT_OBSERVATION_CAMERA_ET_METRIQUES_TERRAIN'};
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
  return {buildCard,build,attach,patchBridge,metricValue,loadRenderer,loadClubRosterIdentityUI};
});
