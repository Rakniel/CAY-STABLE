(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./stable_tracking_bridge_v1.js'):root.CAYStableTrackingBridge,
    typeof module==='object'&&module.exports?require('./metric_pitch_heatmap_v1.js'):root.CAYMetricPitchHeatmap,
    typeof module==='object'&&module.exports?require('./observed_image_visuals_v1.js'):root.CAYObservedImageVisuals
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStableMetricVisualsRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Bridge,MetricHeatmap,ObservedVisuals){
  'use strict';
  function findTrack(state,id){return [...(state?.archive||[]),...(state?.active||[])].find(t=>Number(t?.globalId)===Number(id))||null;}
  function hasExplicitCalibrationConfidence(track,projectors){const segments=new Set((Array.isArray(track?.fullPath)?track.fullPath:[]).map(p=>Number(p?.segment)).filter(Number.isFinite));for(const segment of segments){const entry=projectors&&projectors[segment];if(!entry||entry.validated!==true||typeof entry.project!=='function')continue;const raw=entry.confidence;if(raw===null||raw===undefined||(typeof raw==='string'&&raw.trim()==='')||!Number.isFinite(Number(raw)))return false;}return true;}
  function unavailableVisuals(reason){return {status:'INDISPONIBLE',reason,coordinateSystem:'PITCH_METERS',metricCoverage:0,temporalCoverage:null,avgCalibrationConfidence:null,defendableScore:0,quality:'INDISPONIBLE',pitchHeatmap:{status:'INDISPONIBLE',reason,cols:null,rows:null,normalizedCells:[],basis:null,observations:0,projectedIntervalSeconds:0,policy:'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN'},trajectory:null,provenance:'CAYMetricPitchHeatmap metric pitch coordinates; no image-space fallback'};}
  function observedFor(track,options){return ObservedVisuals&&typeof ObservedVisuals.build==='function'&&track?ObservedVisuals.build(track,options||{}):{status:'INDISPONIBLE',reason:'visualisation image indisponible',coordinateSystem:'IMAGE_NORMALIZED',physicalMetricsAllowed:false};}
  function attachMetricVisuals(report,state,projectors,options){
    if(!report||!Array.isArray(report.players)||!MetricHeatmap||typeof MetricHeatmap.build!=='function')return report;
    const observedOptions=options&&options.observedImage?options.observedImage:{};
    const players=report.players.map(player=>{
      const track=findTrack(state,player.id),observedVisuals=observedFor(track,observedOptions);
      if(!track)return {...player,observedVisuals,metricVisuals:unavailableVisuals('tracking joueur absent')};
      if(!hasExplicitCalibrationConfidence(track,projectors||{}))return {...player,observedVisuals,metricVisuals:unavailableVisuals('confiance calibration absente : visualisation métrique non défendable')};
      const built=MetricHeatmap.build(track,projectors||{},options||{});
      return {...player,observedVisuals,metricVisuals:{status:built.status,reason:built.reason,coordinateSystem:built.coordinateSystem,metricCoverage:built.metricCoverage,temporalCoverage:built.temporalCoverage,avgCalibrationConfidence:built.avgCalibrationConfidence,defendableScore:built.defendableScore,quality:built.quality,pitchHeatmap:{status:built.status,reason:built.reason,cols:built.cols,rows:built.rows,normalizedCells:built.status==='DISPONIBLE'?built.normalizedCells:[],basis:built.heatmapBasis,observations:built.observations,projectedIntervalSeconds:built.projectedIntervalSeconds,policy:built.policy},trajectory:built.trajectory,provenance:'CAYMetricPitchHeatmap metric pitch coordinates; no image-space fallback'}};
    });
    return {...report,players,observedVisualsPolicy:'TRAJECTOIRE_ET_HEATMAP_CAMERA_DISPONIBLES_SANS_CALIBRATION; JAMAIS_INTERPRETEES_COMME_COORDONNEES_TERRAIN',metricVisualsPolicy:'TRAJECTOIRES_ET_HEATMAPS_TERRAIN_UNIQUEMENT_SUR_PROJECTION_METRIQUE_VALIDEE_AVEC_CONFIANCE_EXPLICITE; SINON INDISPONIBLE'};
  }
  function patchBridge(){if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayMetricVisualsPatched===true)return false;const baseCreate=Bridge.create.bind(Bridge);Bridge.create=function(options){const instance=baseCreate(options),baseReport=instance.report.bind(instance);instance.report=function(projectors,visualOptions){return attachMetricVisuals(baseReport(projectors),instance.state,projectors||{},visualOptions||{});};return instance;};Bridge.__cayMetricVisualsPatched=true;return true;}
  patchBridge();return {attachMetricVisuals,patchBridge,findTrack,hasExplicitCalibrationConfidence,unavailableVisuals,observedFor};
});
