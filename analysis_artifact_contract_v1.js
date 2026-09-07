(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYAnalysisArtifactContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='CAY_ANALYSIS_ARTIFACT_CONTRACT_V1';
  const STAGES=Object.freeze([
    'detections_v1',
    'tracking_v1',
    'identity_evidence_v1',
    'manual_identity_overrides_v1',
    'metric_projection_v1',
    'player_metrics_v1',
    'ball_events_v1'
  ]);
  const DOWNSTREAM=Object.freeze({
    detections_v1:['tracking_v1','identity_evidence_v1','manual_identity_overrides_v1','metric_projection_v1','player_metrics_v1','ball_events_v1'],
    tracking_v1:['identity_evidence_v1','manual_identity_overrides_v1','metric_projection_v1','player_metrics_v1','ball_events_v1'],
    identity_evidence_v1:['manual_identity_overrides_v1','metric_projection_v1','player_metrics_v1','ball_events_v1'],
    manual_identity_overrides_v1:['metric_projection_v1','player_metrics_v1','ball_events_v1'],
    metric_projection_v1:['player_metrics_v1','ball_events_v1'],
    player_metrics_v1:[],
    ball_events_v1:[]
  });

  const present=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='');
  const finitePresent=v=>present(v)&&Number.isFinite(Number(v));
  const validStage=stage=>STAGES.includes(stage);

  function normalizeSpatialReference(value){
    if(value===null||value===undefined)return null;
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('spatialReference object required');
    if(!present(value.coordinateSystem))throw new Error('spatialReference.coordinateSystem required');
    const hasLength=finitePresent(value.pitchLengthM),hasWidth=finitePresent(value.pitchWidthM);
    if(hasLength!==hasWidth)throw new Error('spatialReference pitch dimensions must be provided together');
    const pitchLengthM=hasLength?Number(value.pitchLengthM):null;
    const pitchWidthM=hasWidth?Number(value.pitchWidthM):null;
    if((pitchLengthM!==null&&pitchLengthM<=0)||(pitchWidthM!==null&&pitchWidthM<=0))throw new Error('spatialReference pitch dimensions must be positive');
    return {
      coordinateSystem:String(value.coordinateSystem).trim(),
      unit:present(value.unit)?String(value.unit).trim():null,
      origin:present(value.origin)?String(value.origin).trim():null,
      xAxisDirection:present(value.xAxisDirection)?String(value.xAxisDirection).trim():null,
      yAxisDirection:present(value.yAxisDirection)?String(value.yAxisDirection).trim():null,
      orientation:present(value.orientation)?String(value.orientation).trim():null,
      normalized:value.normalized===true?true:(value.normalized===false?false:null),
      pitchLengthM,
      pitchWidthM
    };
  }

  function spatialReferenceKey(value){
    const normalized=normalizeSpatialReference(value);
    return normalized===null?null:JSON.stringify(normalized);
  }

  function createArtifactDescriptor({stage,schemaVersion,inputFingerprint,analysisId,createdAt,provenance,coverage,confidence,spatialReference}={}){
    if(!validStage(stage))throw new Error('invalid artifact stage');
    if(!present(schemaVersion))throw new Error('schemaVersion required');
    if(!present(inputFingerprint))throw new Error('inputFingerprint required');
    if(!present(analysisId))throw new Error('analysisId required');
    const coverageNumber=finitePresent(coverage)?Number(coverage):null;
    const confidenceNumber=finitePresent(confidence)?Number(confidence):null;
    return {
      contractVersion:VERSION,
      stage,
      schemaVersion:String(schemaVersion),
      inputFingerprint:String(inputFingerprint),
      analysisId:String(analysisId),
      createdAt:present(createdAt)?String(createdAt):null,
      provenance:provenance&&typeof provenance==='object'?{...provenance}:null,
      coverage:coverageNumber!==null?Math.max(0,Math.min(1,coverageNumber)):null,
      confidence:confidenceNumber!==null?Math.max(0,Math.min(1,confidenceNumber)):null,
      spatialReference:normalizeSpatialReference(spatialReference)
    };
  }

  function isReusable(descriptor,expected={}){
    if(!descriptor||descriptor.contractVersion!==VERSION||!validStage(descriptor.stage))return false;
    if(expected.stage&&descriptor.stage!==expected.stage)return false;
    if(expected.schemaVersion!==undefined&&String(descriptor.schemaVersion)!==String(expected.schemaVersion))return false;
    if(expected.inputFingerprint!==undefined&&String(descriptor.inputFingerprint)!==String(expected.inputFingerprint))return false;
    if(expected.analysisId!==undefined&&String(descriptor.analysisId)!==String(expected.analysisId))return false;
    if(expected.spatialReference!==undefined){
      let actualKey=null,expectedKey=null;
      try{
        actualKey=spatialReferenceKey(descriptor.spatialReference);
        expectedKey=spatialReferenceKey(expected.spatialReference);
      }catch(e){return false;}
      if(actualKey!==expectedKey)return false;
    }
    return true;
  }

  function invalidatedStages(changedStage,{includeSelf=true}={}){
    if(!validStage(changedStage))throw new Error('invalid artifact stage');
    return includeSelf?[changedStage,...DOWNSTREAM[changedStage]]:[...DOWNSTREAM[changedStage]];
  }

  function planReuse(artifacts,expectedByStage,changedStages=[]){
    const changed=new Set();
    for(const stage of changedStages){
      for(const invalid of invalidatedStages(stage))changed.add(invalid);
    }
    const reusable=[],recompute=[];
    for(const stage of STAGES){
      const descriptor=artifacts&&artifacts[stage];
      const expected=expectedByStage&&expectedByStage[stage];
      if(changed.has(stage)||!isReusable(descriptor,{stage,...(expected||{})}))recompute.push(stage);
      else reusable.push(stage);
    }
    return {reusable,recompute,changed:[...changed]};
  }

  return {VERSION,STAGES,DOWNSTREAM,normalizeSpatialReference,spatialReferenceKey,createArtifactDescriptor,isReusable,invalidatedStages,planReuse};
});
