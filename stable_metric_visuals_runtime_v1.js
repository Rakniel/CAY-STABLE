(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./stable_tracking_bridge_v1.js'):root.CAYStableTrackingBridge,
    typeof module==='object'&&module.exports?require('./metric_pitch_heatmap_v1.js'):root.CAYMetricPitchHeatmap
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStableMetricVisualsRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Bridge,MetricHeatmap){
  'use strict';
  function findTrack(state,id){
    return [...(state?.archive||[]),...(state?.active||[])].find(t=>Number(t?.globalId)===Number(id))||null;
  }
  function attachMetricVisuals(report,state,projectors,options){
    if(!report||!Array.isArray(report.players)||!MetricHeatmap||typeof MetricHeatmap.build!=='function')return report;
    const players=report.players.map(player=>{
      const track=findTrack(state,player.id);
      if(!track)return {...player,metricVisuals:{status:'INDISPONIBLE',reason:'tracking joueur absent',pitchHeatmap:null,trajectory:null}};
      const built=MetricHeatmap.build(track,projectors||{},options||{});
      return {...player,metricVisuals:{
        status:built.status,
        reason:built.reason,
        coordinateSystem:built.coordinateSystem,
        metricCoverage:built.metricCoverage,
        temporalCoverage:built.temporalCoverage,
        avgCalibrationConfidence:built.avgCalibrationConfidence,
        defendableScore:built.defendableScore,
        quality:built.quality,
        pitchHeatmap:{
          status:built.status,reason:built.reason,cols:built.cols,rows:built.rows,
          normalizedCells:built.status==='DISPONIBLE'?built.normalizedCells:[],
          basis:built.heatmapBasis,observations:built.observations,
          projectedIntervalSeconds:built.projectedIntervalSeconds,
          policy:built.policy
        },
        trajectory:built.trajectory,
        provenance:'CAYMetricPitchHeatmap metric pitch coordinates; no image-space fallback'
      }};
    });
    return {...report,players,metricVisualsPolicy:'TRAJECTOIRES_ET_HEATMAPS_TERRAIN_UNIQUEMENT_SUR_PROJECTION_METRIQUE_VALIDEE; SINON INDISPONIBLE'};
  }
  function patchBridge(){
    if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayMetricVisualsPatched===true)return false;
    const baseCreate=Bridge.create.bind(Bridge);
    Bridge.create=function(options){
      const instance=baseCreate(options),baseReport=instance.report.bind(instance);
      instance.report=function(projectors,visualOptions){
        return attachMetricVisuals(baseReport(projectors),instance.state,projectors||{},visualOptions||{});
      };
      return instance;
    };
    Bridge.__cayMetricVisualsPatched=true;
    return true;
  }
  patchBridge();
  return {attachMetricVisuals,patchBridge,findTrack};
});
