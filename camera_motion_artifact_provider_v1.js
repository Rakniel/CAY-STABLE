(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./metric_camera_motion_projector_v1.js'):root.CAYMetricCameraMotionProjector
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYCameraMotionArtifactProvider=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(MotionProjector){
  'use strict';

  const VERSION='CAY_CAMERA_MOTION_ARTIFACT_V1';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const present=v=>v!==null&&v!==undefined&&String(v).trim()!=='';

  function provenanceVerdict(provenance){
    if(!provenance||typeof provenance!=='object')return {allowed:false,reason:'CAMERA_MOTION_ARTIFACT_PROVENANCE_REQUIRED'};
    if(!present(provenance.source)||!present(provenance.license)||!(present(provenance.revision)||present(provenance.sha256))){
      return {allowed:false,reason:'CAMERA_MOTION_ARTIFACT_PROVENANCE_REQUIRED'};
    }
    const license=String(provenance.license).toLowerCase();
    if(license.includes('agpl')||license.includes('gpl-')||license==='gpl')return {allowed:false,reason:'CAMERA_MOTION_ARTIFACT_LICENSE_REJECTED'};
    return {allowed:true,reason:null};
  }

  function normalizeMatrix(value){
    if(!MotionProjector||typeof MotionProjector.matrix3!=='function')return null;
    return MotionProjector.matrix3(value);
  }

  function normalizeSample(sample){
    if(!sample||!finite(sample.segment)||!Number.isInteger(Number(sample.segment))||Number(sample.segment)<0)return null;
    if(!finite(sample.anchorTime)||!finite(sample.time)||Number(sample.anchorTime)<0||Number(sample.time)<Number(sample.anchorTime))return null;
    const matrix=normalizeMatrix(sample.matrix||sample.H||sample.affine);if(!matrix)return null;
    const out={segment:Number(sample.segment),anchorTime:Number(sample.anchorTime),time:Number(sample.time),matrix};
    for(const key of ['confidence','support','inlierRatio','residual','forwardBackwardErrorPx','pitchLineAlignmentErrorPx']){
      if(finite(sample[key]))out[key]=Number(sample[key]);
    }
    return out;
  }

  function validateArtifact(artifact){
    if(!artifact||typeof artifact!=='object')return {ok:false,reason:'CAMERA_MOTION_ARTIFACT_REQUIRED'};
    if(artifact.contractVersion!==VERSION)return {ok:false,reason:'CAMERA_MOTION_ARTIFACT_VERSION_UNSUPPORTED'};
    const provenance=provenanceVerdict(artifact.provenance);if(!provenance.allowed)return {ok:false,reason:provenance.reason};
    if(!Array.isArray(artifact.samples)||!artifact.samples.length)return {ok:false,reason:'CAMERA_MOTION_ARTIFACT_SAMPLES_REQUIRED'};
    let previousTime=-Infinity;
    for(const raw of artifact.samples){
      const sample=normalizeSample(raw);if(!sample)return {ok:false,reason:'CAMERA_MOTION_ARTIFACT_SAMPLE_INVALID'};
      if(sample.time<previousTime)return {ok:false,reason:'CAMERA_MOTION_ARTIFACT_SAMPLES_NOT_SORTED'};
      previousTime=sample.time;
    }
    return {ok:true,reason:null};
  }

  function createProvider(artifact,options={}){
    const verdict=validateArtifact(artifact);if(!verdict.ok)throw new Error(verdict.reason);
    const maxSampleAgeSec=finite(options.maxSampleAgeSec)?Math.max(0,Number(options.maxSampleAgeSec)):(finite(artifact.maxSampleAgeSec)?Math.max(0,Number(artifact.maxSampleAgeSec)):.08);
    const anchorToleranceSec=finite(options.anchorToleranceSec)?Math.max(0,Number(options.anchorToleranceSec)):.02;
    const samples=artifact.samples.map(normalizeSample);
    const provenance={...artifact.provenance};

    function motionFor(anchorTime,time,segment){
      const a=Number(anchorTime),t=Number(time),seg=Number(segment);
      if(!finite(a)||!finite(t)||!Number.isInteger(seg)||seg<0)return {motion:null,reason:'CAMERA_MOTION_CONTEXT_INVALID'};
      let best=null,bestDt=Infinity;
      for(const sample of samples){
        if(sample.segment!==seg||Math.abs(sample.anchorTime-a)>anchorToleranceSec)continue;
        const dt=Math.abs(sample.time-t);
        if(dt<bestDt){best=sample;bestDt=dt;}
      }
      if(!best||bestDt>maxSampleAgeSec)return {motion:null,reason:'CAMERA_MOTION_SAMPLE_UNAVAILABLE'};
      return {motion:{...best},sampleTime:best.time,sampleAgeSec:bestDt,segment:seg};
    }

    function createPropagatedProjector(anchorProjector,anchorTime,time,segment,projectorOptions={}){
      if(!MotionProjector||typeof MotionProjector.createPropagatedProjector!=='function')return {validated:false,project:null,reason:'CAMERA_MOTION_PROJECTOR_UNAVAILABLE'};
      const hit=motionFor(anchorTime,time,segment);if(!hit.motion)return {validated:false,project:null,reason:hit.reason};
      const propagated=MotionProjector.createPropagatedProjector(anchorProjector,hit.motion,{...projectorOptions,ageSec:Math.abs(Number(time)-Number(anchorTime))});
      return {...propagated,artifact:{providerId:artifact.providerId||'cay-camera-motion-artifact-v1',sampleTime:hit.sampleTime,sampleAgeSec:hit.sampleAgeSec,segment:hit.segment,provenance}};
    }

    return {
      id:present(artifact.providerId)?String(artifact.providerId):'cay-camera-motion-artifact-v1',
      runtimeDefaultAllowed:true,
      provenance,
      artifactContractVersion:VERSION,
      maxSampleAgeSec,
      anchorToleranceSec,
      motionFor,
      createPropagatedProjector
    };
  }

  return {VERSION,provenanceVerdict,normalizeSample,validateArtifact,createProvider};
});