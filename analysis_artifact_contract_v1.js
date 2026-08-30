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

  function createArtifactDescriptor({stage,schemaVersion,inputFingerprint,analysisId,createdAt,provenance,coverage,confidence}={}){
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
      confidence:confidenceNumber!==null?Math.max(0,Math.min(1,confidenceNumber)):null
    };
  }

  function isReusable(descriptor,expected={}){
    if(!descriptor||descriptor.contractVersion!==VERSION||!validStage(descriptor.stage))return false;
    if(expected.stage&&descriptor.stage!==expected.stage)return false;
    if(expected.schemaVersion!==undefined&&String(descriptor.schemaVersion)!==String(expected.schemaVersion))return false;
    if(expected.inputFingerprint!==undefined&&String(descriptor.inputFingerprint)!==String(expected.inputFingerprint))return false;
    if(expected.analysisId!==undefined&&String(descriptor.analysisId)!==String(expected.analysisId))return false;
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

  return {VERSION,STAGES,DOWNSTREAM,createArtifactDescriptor,isReusable,invalidatedStages,planReuse};
});
