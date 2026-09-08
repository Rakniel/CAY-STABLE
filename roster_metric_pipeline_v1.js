(function(root,factory){
  const api=factory(
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./app_domain_models_v1.js'):root.CAYAppDomainModels,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./track_roster_binding_v1.js'):root.CAYTrackRosterBinding,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./player_stats_v1.js'):root.CAYPlayerStats,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./metric_pitch_heatmap_v1.js'):root.CAYMetricPitchHeatmap,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./metric_quality_guard_v1.js'):root.CAYMetricQualityGuard,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./metric_publication_guard_v1.js'):root.CAYMetricPublicationGuard
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYRosterMetricPipeline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Domain,Binding,PlayerStats,MetricPitchHeatmap,MetricQualityGuard,MetricPublicationGuard){
  const finite=v=>Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const sum=(rows,key)=>rows.reduce((acc,row)=>acc+(finite(row?.[key])?Number(row[key]):0),0);

  function unavailable(reason,extra={}){
    return {status:'INDISPONIBLE',reason,playerId:null,metric:null,spatial:null,windows:[],...extra,source:'ROSTER_METRIC_PIPELINE_V1'};
  }

  function ensureDependencies(){
    if(!Domain||typeof Domain.splitTrackEvidenceByParticipation!=='function')throw new Error('ROSTER_METRIC_DOMAIN_REQUIRED');
    if(!Binding||typeof Binding.resolve!=='function')throw new Error('ROSTER_METRIC_BINDING_REQUIRED');
    if(!PlayerStats||typeof PlayerStats.metricForTrack!=='function')throw new Error('ROSTER_METRIC_PLAYER_STATS_REQUIRED');
    if(!MetricPitchHeatmap||typeof MetricPitchHeatmap.build!=='function')throw new Error('ROSTER_METRIC_HEATMAP_REQUIRED');
    if(!MetricQualityGuard||typeof MetricQualityGuard.robustMetricForTrack!=='function')throw new Error('ROSTER_METRIC_QUALITY_GUARD_REQUIRED');
    if(!MetricPublicationGuard||typeof MetricPublicationGuard.applyPublicationPolicy!=='function')throw new Error('ROSTER_METRIC_PUBLICATION_GUARD_REQUIRED');
  }

  function aggregateMetrics(rows){
    const input=Array.isArray(rows)?rows:[];
    const eligibleSeconds=sum(input,'eligibleSeconds');
    const metricCoveredSeconds=sum(input,'metricCoveredSeconds');
    const distanceM=sum(input,'distanceM');
    const sprintCount=input.some(row=>row?.sprintCount!==null&&row?.sprintCount!==undefined)?sum(input,'sprintCount'):null;
    const sprintQualifiedSeconds=input.some(row=>row?.sprintQualifiedSeconds!==null&&row?.sprintQualifiedSeconds!==undefined)?sum(input,'sprintQualifiedSeconds'):null;
    const maxSpeedValues=input.map(row=>Number(row?.maxSpeedKmh)).filter(Number.isFinite);
    const metricCoverage=eligibleSeconds>0?metricCoveredSeconds/eligibleSeconds:0;
    const avgSpeedKmh=metricCoveredSeconds>0?(distanceM/metricCoveredSeconds)*3.6:null;
    const confidenceWeighted=input.reduce((acc,row)=>acc+(finite(row?.avgCalibrationConfidence)&&finite(row?.metricCoveredSeconds)?Number(row.avgCalibrationConfidence)*Number(row.metricCoveredSeconds):0),0);
    const avgCalibrationConfidence=metricCoveredSeconds>0?confidenceWeighted/metricCoveredSeconds:0;
    const defendableScore=metricCoverage*avgCalibrationConfidence;
    const speedSamples=input.flatMap((row,windowIndex)=>(Array.isArray(row?.speedSamples)?row.speedSamples:[]).map(sample=>({...sample,segment:`window:${windowIndex}:${String(sample.segment)}`})));
    const quality=MetricQualityGuard&&typeof MetricQualityGuard.qualityFromEvidenceScore==='function'?MetricQualityGuard.qualityFromEvidenceScore(defendableScore):PlayerStats.qualityFromCoverage(metricCoverage);
    return {
      metricCoverage:+metricCoverage.toFixed(4),
      metricCoveredSeconds:+metricCoveredSeconds.toFixed(3),
      eligibleSeconds:+eligibleSeconds.toFixed(3),
      distanceM:metricCoveredSeconds>0?+distanceM.toFixed(2):null,
      avgSpeedKmh:avgSpeedKmh===null?null:+avgSpeedKmh.toFixed(2),
      maxSpeedKmh:maxSpeedValues.length?+Math.max(...maxSpeedValues).toFixed(2):null,
      sprintCount:metricCoveredSeconds>0?sprintCount:null,
      sprintQualifiedSeconds:metricCoveredSeconds>0&&sprintQualifiedSeconds!==null?+sprintQualifiedSeconds.toFixed(3):null,
      quality,
      avgCalibrationConfidence:+avgCalibrationConfidence.toFixed(4),
      defendableScore:+defendableScore.toFixed(4),
      speedSamples,
      rejectedSpeedPairs:sum(input,'rejectedSpeedPairs'),
      participationWindowCount:input.length,
      qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',
      speedSamplePolicy:'FENETRES_DE_PARTICIPATION_NAMESPACEES_POUR_INTERDIRE_TOUTE_CONTINUITE_ARTIFICIELLE_ENTRE_FENETRES',
      policy:'AGGREGATE_ONLY_WITHIN_CONFIRMED_PARTICIPATION_WINDOWS_NO_CROSS_WINDOW_JOIN'
    };
  }

  function samePitch(a,b){
    return finite(a?.pitchLengthM)&&finite(a?.pitchWidthM)&&finite(b?.pitchLengthM)&&finite(b?.pitchWidthM)&&
      Math.abs(Number(a.pitchLengthM)-Number(b.pitchLengthM))<1e-6&&
      Math.abs(Number(a.pitchWidthM)-Number(b.pitchWidthM))<1e-6;
  }

  function matrixOk(matrix,rows,cols){
    return Array.isArray(matrix)&&matrix.length===rows&&matrix.every(row=>Array.isArray(row)&&row.length===cols&&row.every(finite));
  }

  function hasTrajectory(spatial){
    return spatial?.trajectory?.status==='DISPONIBLE'&&Array.isArray(spatial.trajectory.runs)&&spatial.trajectory.runs.some(run=>Array.isArray(run)&&run.length>=2);
  }

  function hasHeatmap(spatial){
    return spatial?.status==='DISPONIBLE';
  }

  function hasSpatialVisual(spatial){
    return hasHeatmap(spatial)||hasTrajectory(spatial);
  }

  function evidenceCoverage(spatial){
    if(finite(spatial?.temporalCoverage))return clamp01(spatial.temporalCoverage);
    if(finite(spatial?.trajectory?.metricCoverage))return clamp01(spatial.trajectory.metricCoverage);
    return hasSpatialVisual(spatial)?1:0;
  }

  function dominantGeometryGroup(windows){
    const groups=[];
    for(const window of Array.isArray(windows)?windows:[]){
      const spatial=window?.spatial;
      const rows=Number(spatial?.rows),cols=Number(spatial?.cols);
      if(!hasSpatialVisual(spatial)||!Number.isInteger(rows)||!Number.isInteger(cols)||rows<=0||cols<=0||!finite(spatial?.pitchLengthM)||!finite(spatial?.pitchWidthM))continue;
      let group=groups.find(item=>item.rows===rows&&item.cols===cols&&samePitch(item.first.spatial,spatial));
      if(!group){group={first:window,rows,cols,items:[],firstOrder:groups.length};groups.push(group);}
      group.items.push(window);
    }
    groups.sort((a,b)=>b.items.length-a.items.length||a.firstOrder-b.firstOrder);
    return groups[0]||null;
  }

  function mergeHeatmaps(heatmaps){
    const rowsIn=Array.isArray(heatmaps)?heatmaps:[];
    if(!rowsIn.length)return null;
    const first=rowsIn[0],rows=Number(first.rows),cols=Number(first.cols);
    if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<=0||cols<=0||!finite(first.pitchLengthM)||!finite(first.pitchWidthM))return null;
    if(!rowsIn.every(h=>Number(h.rows)===rows&&Number(h.cols)===cols&&samePitch(first,h)))return null;
    const useTime=rowsIn.every(h=>matrixOk(h.timeCells,rows,cols));
    const key=useTime?'timeCells':'cells';
    if(!rowsIn.every(h=>matrixOk(h[key],rows,cols)))return null;
    const cells=Array.from({length:rows},()=>Array(cols).fill(0));
    for(const h of rowsIn)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)cells[y][x]+=Number(h[key][y][x]);
    const max=Math.max(0,...cells.flat());
    return {
      status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:Number(first.pitchLengthM),pitchWidthM:Number(first.pitchWidthM),
      rows,cols,cells,normalizedCells:cells.map(row=>row.map(v=>max>0?v/max:0)),windowCount:rowsIn.length,
      sourceWindowIndexes:rowsIn.map(h=>h.windowIndex).filter(v=>v!==null&&v!==undefined),
      heatmapBasis:useTime?'TIME_WEIGHTED_CONFIRMED_PARTICIPATION':'OBSERVATION_COUNT_CONFIRMED_PARTICIPATION',
      policy:'AGREGE_UNIQUEMENT_DES_FENETRES_DE_PARTICIPATION_SUR_UNE_GEOMETRIE_TERRAIN_COHERENTE'
    };
  }

  function summarizeSpatial(windows){
    const all=Array.isArray(windows)?windows:[];
    const available=all.filter(window=>hasSpatialVisual(window?.spatial));
    const dominant=dominantGeometryGroup(available);
    const coherent=dominant?dominant.items:[];
    const trajectoryRuns=[];
    const heatmapWindows=[];
    for(const window of coherent){
      const spatial=window.spatial;
      const runs=hasTrajectory(spatial)&&Array.isArray(spatial?.trajectory?.runs)?spatial.trajectory.runs:[];
      for(const points of runs)trajectoryRuns.push({windowIndex:window.index,startMs:window.startMs,endMs:window.endMs,points});
      if(hasHeatmap(spatial))heatmapWindows.push({
        windowIndex:window.index,startMs:window.startMs,endMs:window.endMs,
        coordinateSystem:spatial.coordinateSystem,pitchLengthM:spatial.pitchLengthM,pitchWidthM:spatial.pitchWidthM,
        cols:spatial.cols,rows:spatial.rows,cells:spatial.cells,timeCells:spatial.timeCells,normalizedCells:spatial.normalizedCells,
        heatmapBasis:spatial.heatmapBasis,observations:spatial.observations,metricCoverage:spatial.metricCoverage,
        temporalCoverage:spatial.temporalCoverage,quality:spatial.quality
      });
    }
    const heatmap=mergeHeatmaps(heatmapWindows);
    const trajectoryAvailable=trajectoryRuns.length>0;
    const coherentWindowCount=coherent.length;
    const availableWindowCount=available.length;
    const excludedGeometryWindowCount=Math.max(0,availableWindowCount-coherentWindowCount);
    const renderedWindowCount=+coherent.reduce((acc,window)=>acc+evidenceCoverage(window?.spatial),0).toFixed(4);
    const complete=coherentWindowCount>0&&coherentWindowCount===all.length&&excludedGeometryWindowCount===0;
    const status=coherentWindowCount===0||(!heatmap&&!trajectoryAvailable)?'INDISPONIBLE':(heatmap&&complete?'FIABLE':'PARTIEL');
    const geometry=dominant?{
      coordinateSystem:'PITCH_METERS',pitchLengthM:Number(dominant.first.spatial.pitchLengthM),pitchWidthM:Number(dominant.first.spatial.pitchWidthM),
      rows:dominant.rows,cols:dominant.cols,sourceWindowIndexes:coherent.map(window=>window.index)
    }:null;
    const coverageReasons=[];
    if(excludedGeometryWindowCount>0)coverageReasons.push('certaines fenêtres terrain ont été exclues car leur géométrie est incompatible avec le référentiel dominant');
    if(trajectoryAvailable&&!heatmap)coverageReasons.push('trajectoire terrain publiée sans heatmap : couverture temporelle/heatmap insuffisante, résultat spatial explicitement partiel');
    return {
      status,
      reason:status==='INDISPONIBLE'?'aucune trajectoire/heatmap terrain sur une géométrie cohérente et défendable dans les fenêtres de participation confirmées':null,
      coverageNote:coverageReasons.length?coverageReasons.join(' ; '):null,
      availableWindowCount,coherentWindowCount,renderedWindowCount,excludedGeometryWindowCount,
      participationWindowCount:all.length,
      projectedObservations:coherent.reduce((acc,window)=>acc+(Number(window?.spatial?.observations)||0),0),
      geometry,
      trajectory:{status:trajectoryAvailable?status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',runs:trajectoryRuns,sourceWindowIndexes:trajectoryRuns.map(run=>run.windowIndex).filter((value,index,array)=>array.indexOf(value)===index),policy:'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION_ET_AUCUN_MELANGE_DE_GEOMETRIES_TERRAIN'},
      heatmap,
      heatmaps:heatmapWindows,
      policy:'SPATIAL_ONLY_WITHIN_CONFIRMED_PARTICIPATION_WINDOWS_AND_ONE_COHERENT_PITCH_GEOMETRY; TRAJECTORY_AND_HEATMAP_AVAILABILITY_ARE_INDEPENDENT; RENDERED_WINDOW_COUNT_IS_TEMPORAL_COVERAGE_EQUIVALENT_FOR_EXPLICIT_PLAYER_CARD_COVERAGE'
    };
  }

  function build(input={}){
    ensureDependencies();
    const trackId=input.trackId??input.trackRaw?.globalId??input.trackRaw?.id;
    const resolved=Binding.resolve(input.bindingState||{},trackId);
    if(resolved.status!=='FIABLE')return unavailable(resolved.reason||'association track-joueur non fiable',{binding:resolved,trackId:String(trackId??'')});
    if(!input.participation?.byPlayerId)return unavailable('fenêtres de participation indisponibles',{binding:resolved,trackId:String(trackId??'')});

    let split;
    try{
      split=Domain.splitTrackEvidenceByParticipation(input.participation,resolved.playerId,input.trackRaw||{},{timeScaleMs:input.timeScaleMs==null?1000:input.timeScaleMs});
    }catch(error){
      return unavailable(error&&error.message?error.message:'filtrage participation impossible',{binding:resolved,trackId:String(trackId??'')});
    }

    const windows=split.windows.map(window=>{
      const metric=MetricQualityGuard.robustMetricForTrack(window.track,input.projectors||{});
      const spatial=MetricPitchHeatmap.build(window.track,input.projectors||{},input.heatmapOptions||{});
      return {index:window.index,startMs:window.startMs,endMs:window.endMs,observations:window.track.fullPath.length,metric,spatial};
    });
    const rawMetric=aggregateMetrics(windows.map(window=>window.metric));
    const metric=MetricPublicationGuard.applyPublicationPolicy(rawMetric,{identityQuality:'FIABLE'});
    const spatial=summarizeSpatial(windows);
    const metricAvailable=metric?.publication?.status==='FIABLE';
    const status=metricAvailable||spatial.status==='FIABLE'?'FIABLE':spatial.status==='PARTIEL'?'PARTIEL':'INDISPONIBLE';
    return {
      status,
      reason:status==='INDISPONIBLE'?'aucune métrique, trajectoire ou heatmap terrain défendable dans les fenêtres de participation confirmées':status==='PARTIEL'?(spatial.coverageNote||'résultat terrain disponible mais couverture insuffisante pour le qualifier de fiable'):null,
      playerId:resolved.playerId,
      trackId:String(trackId??''),
      binding:resolved,
      participation:{acceptedObservations:split.acceptedObservations,rejectedObservations:split.rejectedObservations,invalidTimeObservations:split.invalidTimeObservations,totalObservations:split.totalObservations,timeScaleMs:split.timeScaleMs},
      windows,
      metric,
      spatial,
      source:'ROSTER_METRIC_PIPELINE_V1',
      policy:'TRACK_BINDING_FIABLE_ET_PARTICIPATION_CONFIRMEE_REQUISES_AVANT_PUBLICATION_METRIQUE_OU_SPATIALE; METRIQUES_PHYSIQUES_REUTILISENT_LES_GARDES_QUALITE_ET_PUBLICATION_STABLE; LE_STATUT_PARENT_NE_PEUT_PAS_PROMOUVOIR_UN_RESULTAT_SPATIAL_PARTIEL_EN_FIABLE'
    };
  }

  return {build,aggregateMetrics,summarizeSpatial,unavailable,samePitch,matrixOk,hasTrajectory,hasHeatmap,hasSpatialVisual,evidenceCoverage,dominantGeometryGroup,mergeHeatmaps};
});