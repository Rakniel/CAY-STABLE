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
  function samePitch(a,b){
    return finite(a?.pitchLengthM)&&finite(a?.pitchWidthM)&&finite(b?.pitchLengthM)&&finite(b?.pitchWidthM)&&Math.abs(Number(a.pitchLengthM)-Number(b.pitchLengthM))<1e-6&&Math.abs(Number(a.pitchWidthM)-Number(b.pitchWidthM))<1e-6;
  }
  function matrixOk(m,rows,cols){return Array.isArray(m)&&m.length===rows&&m.every(row=>Array.isArray(row)&&row.length===cols&&row.every(finite));}
  function mergeRosterHeatmaps(heatmaps){
    const rows=(Array.isArray(heatmaps)?heatmaps:[]).filter(h=>h&&finite(h.rows)&&finite(h.cols)&&Number(h.rows)>0&&Number(h.cols)>0&&finite(h.pitchLengthM)&&finite(h.pitchWidthM));
    if(!rows.length)return null;
    const first=rows[0],r=Number(first.rows),c=Number(first.cols);
    const compatible=rows.filter(h=>Number(h.rows)===r&&Number(h.cols)===c&&samePitch(first,h));
    if(!compatible.length)return null;
    const useTime=compatible.every(h=>matrixOk(h.timeCells,r,c));
    const key=useTime?'timeCells':'cells';
    if(!compatible.every(h=>matrixOk(h[key],r,c)))return null;
    const cells=Array.from({length:r},()=>Array(c).fill(0));
    for(const h of compatible)for(let y=0;y<r;y++)for(let x=0;x<c;x++)cells[y][x]+=Number(h[key][y][x]);
    const max=Math.max(0,...cells.flat());
    const normalizedCells=cells.map(row=>row.map(v=>max>0?v/max:0));
    return {status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:Number(first.pitchLengthM),pitchWidthM:Number(first.pitchWidthM),rows:r,cols:c,cells,normalizedCells,windowCount:compatible.length,heatmapBasis:useTime?'TIME_WEIGHTED_CONFIRMED_PARTICIPATION':'OBSERVATION_COUNT_CONFIRMED_PARTICIPATION',policy:'AGREGE_UNIQUEMENT_LES_FENETRES_DE_PARTICIPATION_CONFIRMEES'};
  }
  function rosterPitchVisuals(player){
    const rm=player&&player.rosterMetric||null,spatial=rm&&rm.spatial||null;
    if(!rm||rm.status!=='FIABLE'||!spatial||spatial.status==='INDISPONIBLE')return {status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:null,pitchWidthM:null,trajectory:null,heatmap:null,metricCoverage:0,reason:rm?.reason||spatial?.reason||'liaison roster fiable et participation confirmée requises pour les visuels terrain',source:'ROSTER_METRIC_PIPELINE_V1'};
    const heatmap=mergeRosterHeatmaps(spatial.heatmaps);
    const pitchLengthM=heatmap?.pitchLengthM??null,pitchWidthM=heatmap?.pitchWidthM??null;
    const runs=(Array.isArray(spatial?.trajectory?.runs)?spatial.trajectory.runs:[]).map(run=>Array.isArray(run)?run:(Array.isArray(run?.points)?run.points:[])).filter(run=>run.length);
    const trajectory=runs.length&&finite(pitchLengthM)&&finite(pitchWidthM)?{status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',runs,policy:'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION'}:{status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',runs:[],policy:'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION'};
    if(!heatmap&&trajectory.status==='INDISPONIBLE')return {status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:null,pitchWidthM:null,trajectory,heatmap:null,metricCoverage:0,reason:'aucun visuel terrain défendable dans les fenêtres de participation confirmées',source:'ROSTER_METRIC_PIPELINE_V1'};
    return {status:'DISPONIBLE',quality:spatial.status==='FIABLE'?'FIABLE':'PARTIEL',coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,trajectory,heatmap,metricCoverage:pct(player?.metric?.metricCoverage),participationWindowCount:Number(spatial.participationWindowCount||0),availableWindowCount:Number(spatial.availableWindowCount||0),reason:null,source:'ROSTER_METRIC_PIPELINE_V1',policy:'VISUELS_TERRAIN_UNIQUEMENT_APRES_LIAISON_ROSTER_FIABLE_ET_PARTICIPATION_CONFIRMEE'};
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
  return {buildCard,build,attach,patchBridge,metricValue,rosterPitchVisuals,mergeRosterHeatmaps,loadRenderer,loadClubRosterIdentityUI};
});
