(function(root){
'use strict';

const Benchmark=root.CAYDetectorBenchmarkV1||(typeof require==='function'?require('./detector_benchmark_v1.js'):null);
const DefaultSpec=root.CAYRealVideoDetectorBenchmarkSpecV1||(typeof require==='function'?require('./real_video_detector_benchmark_spec_v1.js'):null);

function finite(v){return v!==null&&v!==undefined&&Number.isFinite(Number(v))?Number(v):null;}
function normalizeMembership(value){
  if(value===true||value==='IN'||value==='EDGE')return {usable:true,onPitch:true,state:value===true?'IN':value};
  if(value===false||value==='OUT')return {usable:true,onPitch:false,state:value===false?'OUT':value};
  if(value&&typeof value==='object'){
    const state=String(value.state||value.status||'').toUpperCase();
    if(state==='IN'||state==='EDGE')return {usable:true,onPitch:true,state};
    if(state==='OUT')return {usable:true,onPitch:false,state};
    if(value.onPitch===true)return {usable:true,onPitch:true,state:'IN'};
    if(value.onPitch===false)return {usable:true,onPitch:false,state:'OUT'};
  }
  return {usable:false,onPitch:false,state:'UNAVAILABLE'};
}
function videoMetadataVerdict(spec,meta,options={}){
  const expected=spec?.video||{},actual=meta||{},reasons=[];
  const durationTolerance=finite(options.durationToleranceSec)??.75;
  const sizeTolerance=finite(options.sizeToleranceBytes)??0;
  if(expected.width&&Number(actual.width)!==Number(expected.width))reasons.push('width_mismatch');
  if(expected.height&&Number(actual.height)!==Number(expected.height))reasons.push('height_mismatch');
  if(expected.sizeBytes&&Math.abs(Number(actual.sizeBytes)-Number(expected.sizeBytes))>sizeTolerance)reasons.push('size_mismatch');
  if(expected.durationSeconds&&Math.abs(Number(actual.durationSeconds)-Number(expected.durationSeconds))>durationTolerance)reasons.push('duration_mismatch');
  if(expected.fileName&&actual.fileName&&String(actual.fileName)!==String(expected.fileName))reasons.push('filename_mismatch');
  if(expected.sha256&&actual.sha256&&String(actual.sha256).toLowerCase()!==String(expected.sha256).toLowerCase())reasons.push('sha256_mismatch');
  return {compatible:reasons.length===0,reasons,expected:{fileName:expected.fileName||null,sizeBytes:expected.sizeBytes||null,durationSeconds:expected.durationSeconds||null,width:expected.width||null,height:expected.height||null,sha256:expected.sha256||null},actual:{fileName:actual.fileName||null,sizeBytes:finite(actual.sizeBytes),durationSeconds:finite(actual.durationSeconds),width:finite(actual.width),height:finite(actual.height),sha256:actual.sha256||null}};
}
function validateRuntime(options){
  if(!Benchmark||typeof Benchmark.evaluate!=='function')throw new Error('CAY_DETECTOR_BENCHMARK_ENGINE_REQUIRED');
  const spec=options?.spec||DefaultSpec?.spec;
  if(!spec)throw new Error('CAY_REAL_VIDEO_BENCHMARK_SPEC_REQUIRED');
  Benchmark.validateSpec(spec);
  if(!options?.detector||typeof options.detector.detect!=='function')throw new Error('CAY_BENCHMARK_DETECTOR_REQUIRED');
  if(typeof options.frameProvider!=='function')throw new Error('CAY_BENCHMARK_FRAME_PROVIDER_REQUIRED');
  if(typeof options.pitchMembership!=='function')throw new Error('CAY_BENCHMARK_PITCH_MEMBERSHIP_REQUIRED');
  return spec;
}
async function run(options={}){
  const spec=validateRuntime(options);
  const metadata=videoMetadataVerdict(spec,options.videoMetadata||{},options.metadataOptions||{});
  if(options.requireVideoMatch!==false&&!metadata.compatible){
    const e=new Error('CAY benchmark video mismatch: '+metadata.reasons.join(','));e.code='CAY_BENCHMARK_VIDEO_MISMATCH';e.verdict=metadata;throw e;
  }
  const observations=[],errors=[],rawFrames=[];
  for(let index=0;index<spec.frames.length;index++){
    const target=spec.frames[index];
    try{
      const provided=await options.frameProvider(target.time,target,index,spec);
      const canvas=provided?.canvas||provided;
      if(!canvas||!(Number(canvas.width)>0&&Number(canvas.height)>0))throw new Error('FRAME_UNAVAILABLE');
      const detections=await options.detector.detect(canvas,options.maxBoxes??160,options.minScore??.15);
      if(!Array.isArray(detections))throw new Error('DETECTOR_OUTPUT_INVALID');
      let onPitch=0,offPitch=0,unknownMembership=0;
      const classified=[];
      for(let di=0;di<detections.length;di++){
        const d=detections[di];
        const m=normalizeMembership(await options.pitchMembership(d,canvas,target,provided,di));
        if(!m.usable){unknownMembership++;continue;}
        if(m.onPitch)onPitch++;else offPitch++;
        classified.push({index:di,state:m.state,onPitch:m.onPitch});
      }
      if(unknownMembership>0){
        throw Object.assign(new Error('PITCH_MEMBERSHIP_UNAVAILABLE'),{unknownMembership,rawCount:detections.length});
      }
      const observation={id:target.id,time:target.time,onPitchCount:onPitch,offPitchCount:offPitch,rawCount:detections.length};
      observations.push(observation);
      rawFrames.push({...observation,status:'OBSERVED',classified});
      if(typeof options.onProgress==='function')await options.onProgress({index:index+1,total:spec.frames.length,target,observation});
    }catch(err){
      const failure={id:target.id,time:target.time,status:'UNAVAILABLE',reason:String(err?.message||err),code:err?.code||null};
      if(finite(err?.unknownMembership)!==null)failure.unknownMembership=finite(err.unknownMembership);
      if(finite(err?.rawCount)!==null)failure.rawCount=finite(err.rawCount);
      errors.push(failure);rawFrames.push(failure);
      if(typeof options.onProgress==='function')await options.onProgress({index:index+1,total:spec.frames.length,target,error:failure});
    }
  }
  const report=Benchmark.evaluate(spec,observations,{minCoverage:options.minCoverage});
  report.runtime={
    bridgeVersion:'CAY_DETECTOR_BENCHMARK_RUNTIME_V1',
    candidateId:options.candidateId||options.detector?.candidateId||null,
    detectorKind:options.detector?.kind||null,
    videoMetadata:metadata,
    attemptedFrames:spec.frames.length,
    observedFrames:observations.length,
    unavailableFrames:errors.length,
    errors,
    observations:rawFrames
  };
  if(errors.length)report.summary.promotionEligible=false;
  return report;
}

const api={normalizeMembership,videoMetadataVerdict,validateRuntime,run};
root.CAYDetectorBenchmarkRuntimeBridgeV1=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
