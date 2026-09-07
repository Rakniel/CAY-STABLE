(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPitchKeypointArtifactProvider=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const VERSION='CAY_PITCH_KEYPOINT_ARTIFACT_V1';
  const PERMITTED_COORDINATE_SPACES=new Set(['PIXEL','NORMALIZED_0_1']);
  const finite=v=>Number.isFinite(Number(v));
  const present=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)));

  function provenanceVerdict(provenance){
    if(!provenance||typeof provenance!=='object')return {allowed:false,reason:'PITCH_KEYPOINT_ARTIFACT_PROVENANCE_REQUIRED'};
    if(!present(provenance.source)||!present(provenance.license)||!(present(provenance.revision)||present(provenance.weightId)||present(provenance.sha256))){
      return {allowed:false,reason:'PITCH_KEYPOINT_ARTIFACT_PROVENANCE_REQUIRED'};
    }
    const license=String(provenance.license).toLowerCase();
    if(license.includes('agpl')||license.includes('gpl-')||license==='gpl')return {allowed:false,reason:'PITCH_KEYPOINT_ARTIFACT_LICENSE_REJECTED'};
    return {allowed:true,reason:null};
  }

  function normalizeIndexMap(value){
    if(value===null||value===undefined)return {ok:true,map:null,reason:null};
    if(typeof value!=='object'||Array.isArray(value))return {ok:false,map:null,reason:'PITCH_KEYPOINT_INDEX_MAP_INVALID'};
    const map=new Map(),destinations=new Set();
    for(const [rawSource,rawDestination] of Object.entries(value)){
      const source=Number(rawSource),destination=Number(rawDestination);
      if(!Number.isInteger(source)||source<0||source>4095||!Number.isInteger(destination)||destination<0||destination>31){
        return {ok:false,map:null,reason:'PITCH_KEYPOINT_INDEX_MAP_INVALID'};
      }
      if(destinations.has(destination))return {ok:false,map:null,reason:'PITCH_KEYPOINT_INDEX_MAP_AMBIGUOUS'};
      destinations.add(destination);map.set(source,destination);
    }
    if(!map.size)return {ok:false,map:null,reason:'PITCH_KEYPOINT_INDEX_MAP_EMPTY'};
    return {ok:true,map,reason:null};
  }

  function mappedIndex(rawIndex,indexMap){
    const source=Number(rawIndex);
    if(!Number.isInteger(source)||source<0)return null;
    if(indexMap)return indexMap.has(source)?indexMap.get(source):null;
    return source<=31?source:null;
  }

  function normalizeKeypoint(k,coordinateSpace,width,height,indexMap=null){
    if(!k||!finite(k.x)||!finite(k.y))return null;
    const index=mappedIndex(k.index,indexMap);
    if(index===null)return null;
    const confidence=finite(k.confidence)?clamp01(k.confidence):null;
    if(confidence===null)return null;
    let x=Number(k.x),y=Number(k.y);
    if(coordinateSpace==='NORMALIZED_0_1'){
      if(x<0||x>1||y<0||y>1)return null;
      x*=width;y*=height;
    }else if(x<0||x>width||y<0||y>height)return null;
    return {index,sourceIndex:Number(k.index),x,y,confidence};
  }

  function validateArtifact(artifact){
    if(!artifact||typeof artifact!=='object')return {ok:false,reason:'PITCH_KEYPOINT_ARTIFACT_REQUIRED'};
    if(artifact.contractVersion!==VERSION)return {ok:false,reason:'PITCH_KEYPOINT_ARTIFACT_VERSION_UNSUPPORTED'};
    const provenance=provenanceVerdict(artifact.provenance);
    if(!provenance.allowed)return {ok:false,reason:provenance.reason};
    const coordinateSpace=artifact.coordinateSpace||'PIXEL';
    if(!PERMITTED_COORDINATE_SPACES.has(coordinateSpace))return {ok:false,reason:'PITCH_KEYPOINT_ARTIFACT_COORDINATE_SPACE_UNSUPPORTED'};
    const indexMap=normalizeIndexMap(artifact.keypointIndexMap);
    if(!indexMap.ok)return {ok:false,reason:indexMap.reason};
    if(!Array.isArray(artifact.frames)||!artifact.frames.length)return {ok:false,reason:'PITCH_KEYPOINT_ARTIFACT_FRAMES_REQUIRED'};
    let previous=-Infinity;
    for(const frame of artifact.frames){
      if(!frame||!finite(frame.time)||Number(frame.time)<0||!Number.isInteger(Number(frame.segment))||Number(frame.segment)<0||!Array.isArray(frame.keypoints))return {ok:false,reason:'PITCH_KEYPOINT_ARTIFACT_FRAME_INVALID'};
      if(Number(frame.time)<previous)return {ok:false,reason:'PITCH_KEYPOINT_ARTIFACT_FRAMES_NOT_SORTED'};
      previous=Number(frame.time);
    }
    return {ok:true,reason:null,coordinateSpace,indexMap:indexMap.map};
  }

  function createProvider(artifact,options={}){
    const verdict=validateArtifact(artifact);
    if(!verdict.ok)throw new Error(verdict.reason);
    const maxSampleAgeSec=finite(options.maxSampleAgeSec)?Math.max(0,Number(options.maxSampleAgeSec)):(finite(artifact.maxSampleAgeSec)?Math.max(0,Number(artifact.maxSampleAgeSec)):.4);
    const minConfidence=finite(options.minConfidence)?clamp01(options.minConfidence):(finite(artifact.minConfidence)?clamp01(artifact.minConfidence):.5);
    const frames=artifact.frames.map(frame=>({time:Number(frame.time),segment:Number(frame.segment),keypoints:frame.keypoints.map(k=>({...k}))}));
    const provenance={...artifact.provenance};
    const indexMap=verdict.indexMap;

    function nearestFrame(time,segment){
      let best=null,bestDt=Infinity;
      for(const frame of frames){
        if(frame.segment!==Number(segment))continue;
        const dt=Math.abs(frame.time-Number(time));
        if(dt<bestDt){best=frame;bestDt=dt;}
      }
      return best&&bestDt<=maxSampleAgeSec?{frame:best,ageSec:bestDt}:null;
    }

    return {
      id:present(artifact.providerId)?String(artifact.providerId):'cay-pitch-keypoint-artifact-v1',
      runtimeDefaultAllowed:true,
      provenance,
      minConfidence,
      maxCalibrationAgeSec:maxSampleAgeSec,
      assumeStaticCamera:artifact.assumeStaticCamera===true,
      artifactContractVersion:VERSION,
      keypointIndexMapping:indexMap?Object.fromEntries(indexMap):null,
      async inferPitchKeypoints(canvas,context={}){
        const width=Number(context.width||canvas&&canvas.width),height=Number(context.height||canvas&&canvas.height);
        if(!finite(width)||!finite(height)||width<=0||height<=0||!finite(context.time)||!Number.isInteger(Number(context.segment)))return {keypoints:[],reason:'PITCH_KEYPOINT_ARTIFACT_CONTEXT_INVALID'};
        const hit=nearestFrame(Number(context.time),Number(context.segment));
        if(!hit)return {keypoints:[],reason:'PITCH_KEYPOINT_ARTIFACT_SAMPLE_UNAVAILABLE'};
        const seen=new Set(),keypoints=[];
        for(const raw of hit.frame.keypoints){
          const k=normalizeKeypoint(raw,verdict.coordinateSpace,width,height,indexMap);
          if(!k||k.confidence<minConfidence||seen.has(k.index))continue;
          seen.add(k.index);keypoints.push(k);
        }
        return {keypoints,sampleTime:hit.frame.time,sampleAgeSec:hit.ageSec,segment:hit.frame.segment};
      }
    };
  }

  function installAsDefault(artifact,options={}){
    const provider=createProvider(artifact,options);
    root.CAYPitchKeypointProvider=provider;
    return provider;
  }

  return {VERSION,validateArtifact,provenanceVerdict,normalizeIndexMap,createProvider,installAsDefault};
});