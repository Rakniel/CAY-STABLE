(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./automatic_pitch_calibration_v1.js'):root.CAYAutomaticPitchCalibration,
    typeof module==='object'&&module.exports?require('./pitch_geometry_guard_v1.js'):root.CAYPitchGeometryGuard
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPitchSemanticCalibrationV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(AutoCalibration,PitchGeometry){
'use strict';

const finite=v=>v!==null&&v!==''&&v!==undefined&&Number.isFinite(Number(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function canonicalVertices(options={}){
  const lengthM=finite(options.lengthM)?Number(options.lengthM):105;
  const widthM=finite(options.widthM)?Number(options.widthM):68;
  const model=PitchGeometry&&typeof PitchGeometry.canonicalPitchModel==='function'
    ? PitchGeometry.canonicalPitchModel({lengthM,widthM})
    : {ok:true,lengthM,widthM,fixedFeatures:{penaltyMarkM:11,penaltyAreaDepthM:16.5,penaltyAreaWidthM:40.32,goalAreaDepthM:5.5,goalAreaWidthM:18.32,centerCircleRadiusM:9.15}};
  if(!model||model.ok===false)return [];
  const f=model.fixedFeatures||{};
  const penaltyDepth=Number(f.penaltyAreaDepthM)||16.5;
  const penaltyWidth=Number(f.penaltyAreaWidthM)||40.32;
  const goalDepth=Number(f.goalAreaDepthM)||5.5;
  const goalWidth=Number(f.goalAreaWidthM)||18.32;
  const penaltyMark=Number(f.penaltyMarkM)||11;
  const circle=Number(f.centerCircleRadiusM)||9.15;
  const L=lengthM,W=widthM,mid=L/2;
  return [
    {x:0,y:0},
    {x:0,y:(W-penaltyWidth)/2},
    {x:0,y:(W-goalWidth)/2},
    {x:0,y:(W+goalWidth)/2},
    {x:0,y:(W+penaltyWidth)/2},
    {x:0,y:W},
    {x:goalDepth,y:(W-goalWidth)/2},
    {x:goalDepth,y:(W+goalWidth)/2},
    {x:penaltyMark,y:W/2},
    {x:penaltyDepth,y:(W-penaltyWidth)/2},
    {x:penaltyDepth,y:(W-goalWidth)/2},
    {x:penaltyDepth,y:(W+goalWidth)/2},
    {x:penaltyDepth,y:(W+penaltyWidth)/2},
    {x:mid,y:0},
    {x:mid,y:W/2-circle},
    {x:mid,y:W/2+circle},
    {x:mid,y:W},
    {x:L-penaltyDepth,y:(W-penaltyWidth)/2},
    {x:L-penaltyDepth,y:(W-goalWidth)/2},
    {x:L-penaltyDepth,y:(W+goalWidth)/2},
    {x:L-penaltyDepth,y:(W+penaltyWidth)/2},
    {x:L-penaltyMark,y:W/2},
    {x:L-goalDepth,y:(W-goalWidth)/2},
    {x:L-goalDepth,y:(W+goalWidth)/2},
    {x:L,y:0},
    {x:L,y:(W-penaltyWidth)/2},
    {x:L,y:(W-goalWidth)/2},
    {x:L,y:(W+goalWidth)/2},
    {x:L,y:(W+penaltyWidth)/2},
    {x:L,y:W},
    {x:mid-circle,y:W/2},
    {x:mid+circle,y:W/2}
  ];
}

function normalizeKeypoints(input,frameSize){
  const out=[];
  if(!input)return out;
  const w=Number(frameSize&&frameSize.width),h=Number(frameSize&&frameSize.height);
  const push=(index,x,y,confidence,visible=true)=>{
    const i=Number(index);
    if(!Number.isInteger(i)||i<0||i>=32||!finite(x)||!finite(y)||visible===false)return;
    let px=Number(x),py=Number(y);
    if(w>0&&h>0&&px>=0&&px<=1&&py>=0&&py<=1){px*=w;py*=h;}
    out.push({index:i,x:px,y:py,confidence:finite(confidence)?clamp(Number(confidence),0,1):null});
  };

  if(Array.isArray(input)){
    input.forEach((k,pos)=>{
      if(!k)return;
      if(Array.isArray(k))push(pos,k[0],k[1],k[2],true);
      else push(k.index??k.id??pos,k.x??k.xy?.[0],k.y??k.xy?.[1],k.confidence??k.score,k.visible!==false);
    });
    return out;
  }

  if(Array.isArray(input.xy)){
    input.xy.forEach((xy,i)=>push(i,xy&&xy[0],xy&&xy[1],Array.isArray(input.confidence)?input.confidence[i]:null,true));
  }
  return out;
}

function buildCorrespondences(keypoints,options={}){
  const vertices=canonicalVertices(options);
  if(vertices.length!==32)return [];
  const minConfidence=finite(options.minConfidence)?clamp(Number(options.minConfidence),0,1):0.5;
  const normalized=normalizeKeypoints(keypoints,options.frameSize);
  const best=new Map();
  for(const k of normalized){
    if(k.confidence!==null&&k.confidence<minConfidence)continue;
    const prev=best.get(k.index);
    if(!prev||(k.confidence??0)>(prev.confidence??0))best.set(k.index,k);
  }
  return [...best.values()].sort((a,b)=>a.index-b.index).map(k=>({
    image:{x:k.x,y:k.y},
    pitch:{...vertices[k.index]},
    confidence:k.confidence,
    feature:`PITCH_KEYPOINT_${String(k.index+1).padStart(2,'0')}`,
    keypointIndex:k.index
  }));
}

function evaluate(options={}){
  if(!AutoCalibration||typeof AutoCalibration.evaluateAutomaticCalibration!=='function'){
    return {status:'INDISPONIBLE',reason:'AUTO_CALIBRATION_ENGINE_UNAVAILABLE',policy:'SEMANTIC_KEYPOINTS_ONLY'};
  }
  const correspondences=buildCorrespondences(options.keypoints,options);
  if(correspondences.length<6){
    return {status:'INSUFFICIENT_EVIDENCE',reason:'PITCH_KEYPOINTS_NEED_SIX_VISIBLE',visibleKeypoints:correspondences.length,policy:'SEMANTIC_KEYPOINTS_ONLY'};
  }
  const result=AutoCalibration.evaluateAutomaticCalibration({
    ...options,
    correspondences,
    pitchLengthM:finite(options.lengthM)?Number(options.lengthM):105,
    pitchWidthM:finite(options.widthM)?Number(options.widthM):68
  });
  return {
    ...result,
    visibleKeypoints:correspondences.length,
    keypointIndices:correspondences.map(c=>c.keypointIndex),
    calibrationInput:'SEMANTIC_PITCH_KEYPOINTS',
    legacyFreePolygonUsed:false,
    provenance:{
      designReferences:[
        {project:'roboflow/sports',license:'MIT',adapted:'32 semantic pitch landmark topology and keypoint→homography workflow'},
        {project:'rafaelsouza-tech/soccer-tactical-vision',license:'MIT',adapted:'keypoints → validated homography → temporal smoothing architecture'}
      ],
      codeCopied:false,
      modelBundled:false,
      note:'CAY uses its own 105x68 canonical geometry and existing validated homography engine.'
    }
  };
}

return {
  VERSION:'2.0.0',
  POLICY:'SEMANTIC_PITCH_KEYPOINTS_NOT_FREE_POLYGON',
  KEYPOINT_COUNT:32,
  canonicalVertices,
  normalizeKeypoints,
  buildCorrespondences,
  evaluate
};
});
