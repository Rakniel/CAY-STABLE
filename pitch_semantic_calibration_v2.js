(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./automatic_pitch_calibration_v1.js'):root.CAYAutomaticPitchCalibration,
    typeof module==='object'&&module.exports?require('./pitch_geometry_guard_v1.js'):root.CAYPitchGeometryGuard,
    root
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.CAYPitchSemanticCalibrationV2=api;
    if(api&&api.defaultKeypointProvider)root.CAYPitchKeypointProvider=api.defaultKeypointProvider;
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(AutoCalibration,PitchGeometry,RuntimeRoot){
'use strict';

const finite=v=>v!==null&&v!==''&&v!==undefined&&Number.isFinite(Number(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MODEL_INPUT_SIZE=640;
const MODEL_CHANNELS=101;
const MODEL_KEYPOINT_COUNT=32;
const MODEL_URL='https://huggingface.co/SzymonKulpinski/football-pitch-detection-onnx/resolve/main/football-pitch-detection-fp16.onnx?download=true';
const MODEL_REVISION='43bbb4c';

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

function letterboxTransform(width,height,inputSize=MODEL_INPUT_SIZE){
  const w=Number(width),h=Number(height),size=Number(inputSize);
  if(!(w>0&&h>0&&size>0))return null;
  const scale=Math.min(size/w,size/h);
  const resizedWidth=Math.max(1,Math.round(w*scale));
  const resizedHeight=Math.max(1,Math.round(h*scale));
  const padX=(size-resizedWidth)/2;
  const padY=(size-resizedHeight)/2;
  return {inputSize:size,sourceWidth:w,sourceHeight:h,scale,resizedWidth,resizedHeight,padX,padY};
}

function tensorAccessor(data,dims){
  if(!data||!Array.isArray(dims)||dims.length<2)return null;
  const clean=dims.map(Number);
  let channels=0,proposals=0,channelFirst=false;
  if(clean.length===3&&clean[1]===MODEL_CHANNELS){channels=clean[1];proposals=clean[2];channelFirst=true;}
  else if(clean.length===3&&clean[2]===MODEL_CHANNELS){channels=clean[2];proposals=clean[1];channelFirst=false;}
  else if(clean.length===2&&clean[0]===MODEL_CHANNELS){channels=clean[0];proposals=clean[1];channelFirst=true;}
  else if(clean.length===2&&clean[1]===MODEL_CHANNELS){channels=clean[1];proposals=clean[0];channelFirst=false;}
  else return null;
  const at=(proposal,channel)=>channelFirst?Number(data[channel*proposals+proposal]):Number(data[proposal*channels+channel]);
  return {channels,proposals,channelFirst,at};
}

function decodePoseTensor(tensor,transform,options={}){
  if(!tensor||!transform)return {keypoints:[],reason:'PITCH_KEYPOINT_OUTPUT_INVALID',detectorConfidence:0};
  const acc=tensorAccessor(tensor.data,tensor.dims);
  if(!acc)return {keypoints:[],reason:'PITCH_KEYPOINT_OUTPUT_SHAPE_UNSUPPORTED',detectorConfidence:0,dims:tensor.dims||null};
  const minDetectionConfidence=finite(options.minDetectionConfidence)?clamp(Number(options.minDetectionConfidence),0,1):0.18;
  const minKeypointConfidence=finite(options.minKeypointConfidence)?clamp(Number(options.minKeypointConfidence),0,1):0.20;
  let bestProposal=-1,bestConfidence=-Infinity;
  for(let p=0;p<acc.proposals;p++){
    const confidence=acc.at(p,4);
    if(Number.isFinite(confidence)&&confidence>bestConfidence){bestConfidence=confidence;bestProposal=p;}
  }
  if(bestProposal<0||bestConfidence<minDetectionConfidence)return {keypoints:[],reason:'PITCH_NOT_CONFIDENTLY_DETECTED',detectorConfidence:Number.isFinite(bestConfidence)?clamp(bestConfidence,0,1):0};
  const keypoints=[];
  for(let i=0;i<MODEL_KEYPOINT_COUNT;i++){
    const base=5+i*3;
    const modelX=acc.at(bestProposal,base),modelY=acc.at(bestProposal,base+1),confidence=acc.at(bestProposal,base+2);
    if(!Number.isFinite(modelX)||!Number.isFinite(modelY)||!Number.isFinite(confidence))continue;
    const x=(modelX-transform.padX)/transform.scale;
    const y=(modelY-transform.padY)/transform.scale;
    const visible=confidence>=minKeypointConfidence&&x>=0&&x<=transform.sourceWidth&&y>=0&&y<=transform.sourceHeight;
    keypoints.push({index:i,x,y,confidence:clamp(confidence,0,1),visible});
  }
  return {keypoints,reason:null,detectorConfidence:clamp(bestConfidence,0,1),proposalIndex:bestProposal};
}

function makePreprocessCanvas(canvas,transform,root=RuntimeRoot){
  const Ctor=(root&&root.OffscreenCanvas)||(typeof OffscreenCanvas!=='undefined'?OffscreenCanvas:null);
  let target=null;
  if(Ctor)target=new Ctor(transform.inputSize,transform.inputSize);
  else if(root&&root.document&&typeof root.document.createElement==='function'){
    target=root.document.createElement('canvas');target.width=transform.inputSize;target.height=transform.inputSize;
  }
  if(!target)return null;
  const ctx=target.getContext&&target.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.fillStyle='rgb(114,114,114)';ctx.fillRect(0,0,transform.inputSize,transform.inputSize);
  ctx.drawImage(canvas,transform.padX,transform.padY,transform.resizedWidth,transform.resizedHeight);
  return {canvas:target,ctx};
}

function preprocessCanvas(canvas,root=RuntimeRoot){
  const width=Number(canvas&&canvas.width),height=Number(canvas&&canvas.height);
  const transform=letterboxTransform(width,height,MODEL_INPUT_SIZE);
  if(!transform)return {ok:false,reason:'PITCH_KEYPOINT_FRAME_INVALID'};
  const prepared=makePreprocessCanvas(canvas,transform,root);
  if(!prepared)return {ok:false,reason:'PITCH_KEYPOINT_CANVAS_UNAVAILABLE'};
  const rgba=prepared.ctx.getImageData(0,0,MODEL_INPUT_SIZE,MODEL_INPUT_SIZE).data;
  const plane=MODEL_INPUT_SIZE*MODEL_INPUT_SIZE,data=new Float32Array(plane*3);
  for(let i=0,p=0;i<plane;i++,p+=4){data[i]=rgba[p]/255;data[plane+i]=rgba[p+1]/255;data[plane*2+i]=rgba[p+2]/255;}
  return {ok:true,data,transform};
}

function createDefaultKeypointProvider(root=RuntimeRoot){
  let sessionPromise=null,backend=null,lastLoadError=null;
  async function createSession(){
    const ort=root&&root.ort;
    if(!ort||!ort.InferenceSession||!ort.Tensor)throw new Error('ONNXRUNTIME_WEB_UNAVAILABLE');
    const response=await (root.fetch||fetch)(MODEL_URL,{cache:'force-cache'});
    if(!response.ok)throw new Error(`PITCH_KEYPOINT_MODEL_HTTP_${response.status}`);
    const bytes=await response.arrayBuffer();
    try{
      const session=await ort.InferenceSession.create(bytes,{executionProviders:['webgpu']});
      backend='webgpu';return session;
    }catch(webgpuError){
      const session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm']});
      backend='wasm';return session;
    }
  }
  async function getSession(){
    if(!sessionPromise)sessionPromise=createSession().catch(err=>{lastLoadError=String(err&&err.message||err);sessionPromise=null;throw err;});
    return sessionPromise;
  }
  return {
    id:'cay-pitch-keypoints-yolov8x-onnx-v1',
    runtimeDefaultAllowed:true,
    usageScope:'INTERNAL_CLUB',
    distributionPolicy:'REMOTE_WEIGHTS_NOT_BUNDLED',
    assumeStaticCamera:false,
    minConfidence:.5,
    minDetectionConfidence:.18,
    minKeypointConfidence:.20,
    maxCalibrationAgeSec:.65,
    modelUrl:MODEL_URL,
    provenance:{
      source:'SzymonKulpinski/football-pitch-detection-onnx',
      license:'AGPL-3.0',
      revision:MODEL_REVISION,
      weightId:'football-pitch-detection-fp16.onnx',
      upstream:'roboflow/sports football-field-detection; 32-landmark SoccerPitchConfiguration order',
      codeCopied:false,
      modelBundled:false
    },
    diagnostics(){return {backend,modelLoaded:!!sessionPromise,lastLoadError};},
    async inferPitchKeypoints(canvas){
      const ort=root&&root.ort;
      if(!ort||!ort.Tensor)return {keypoints:[],reason:'ONNXRUNTIME_WEB_UNAVAILABLE'};
      const prep=preprocessCanvas(canvas,root);
      if(!prep.ok)return {keypoints:[],reason:prep.reason};
      const session=await getSession();
      const inputName=session.inputNames&&session.inputNames[0]||'images';
      const tensor=new ort.Tensor('float32',prep.data,[1,3,MODEL_INPUT_SIZE,MODEL_INPUT_SIZE]);
      const outputs=await session.run({[inputName]:tensor});
      const outputName=session.outputNames&&session.outputNames[0]||Object.keys(outputs)[0];
      const decoded=decodePoseTensor(outputs[outputName],prep.transform,{minDetectionConfidence:this.minDetectionConfidence,minKeypointConfidence:this.minKeypointConfidence});
      return {...decoded,backend,modelRevision:MODEL_REVISION};
    }
  };
}

const defaultKeypointProvider=createDefaultKeypointProvider(RuntimeRoot);

return {
  VERSION:'2.1.0',
  POLICY:'SEMANTIC_PITCH_KEYPOINTS_NOT_FREE_POLYGON',
  KEYPOINT_COUNT:32,
  MODEL_INPUT_SIZE,
  MODEL_CHANNELS,
  MODEL_URL,
  MODEL_REVISION,
  canonicalVertices,
  normalizeKeypoints,
  buildCorrespondences,
  evaluate,
  letterboxTransform,
  tensorAccessor,
  decodePoseTensor,
  preprocessCanvas,
  createDefaultKeypointProvider,
  defaultKeypointProvider
};
});
