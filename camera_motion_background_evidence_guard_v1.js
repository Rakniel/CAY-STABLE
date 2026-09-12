(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./camera_motion_artifact_provider_v1.js'):root.CAYCameraMotionArtifactProvider
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYCameraMotionBackgroundEvidenceGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(ArtifactProvider){
  'use strict';

  const VERSION='CAY_CAMERA_MOTION_BACKGROUND_EVIDENCE_GUARD_V1';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));

  function inspectSample(sample,options={}){
    if(!sample||typeof sample!=='object')return {ok:false,reason:'BACKGROUND_MOTION_SAMPLE_REQUIRED'};
    if(sample.backgroundMaskApplied!==true){
      return {ok:false,reason:'BACKGROUND_MOTION_MASK_EVIDENCE_MISSING'};
    }
    if(!finite(sample.matchedReferencePointRatio)){
      return {ok:false,reason:'BACKGROUND_MOTION_REFERENCE_RATIO_MISSING'};
    }
    const matchedReferencePointRatio=Number(sample.matchedReferencePointRatio);
    if(matchedReferencePointRatio<0||matchedReferencePointRatio>1){
      return {ok:false,reason:'BACKGROUND_MOTION_REFERENCE_RATIO_INVALID',matchedReferencePointRatio};
    }
    const minMatchedReferencePointRatio=finite(options.minMatchedReferencePointRatio)
      ?clamp(options.minMatchedReferencePointRatio,0,1)
      :.75;
    if(matchedReferencePointRatio<minMatchedReferencePointRatio){
      return {
        ok:false,
        reason:'BACKGROUND_MOTION_REFERENCE_RATIO_TOO_LOW',
        matchedReferencePointRatio,
        minMatchedReferencePointRatio
      };
    }
    if(sample.referenceAgeFrames!==undefined){
      if(!finite(sample.referenceAgeFrames)||Number(sample.referenceAgeFrames)<0||!Number.isInteger(Number(sample.referenceAgeFrames))){
        return {ok:false,reason:'BACKGROUND_MOTION_REFERENCE_AGE_INVALID'};
      }
      const maxReferenceAgeFrames=finite(options.maxReferenceAgeFrames)
        ?Math.max(0,Math.floor(Number(options.maxReferenceAgeFrames)))
        :null;
      if(maxReferenceAgeFrames!==null&&Number(sample.referenceAgeFrames)>maxReferenceAgeFrames){
        return {
          ok:false,
          reason:'BACKGROUND_MOTION_REFERENCE_TOO_OLD',
          referenceAgeFrames:Number(sample.referenceAgeFrames),
          maxReferenceAgeFrames
        };
      }
    }
    return {
      ok:true,
      reason:null,
      backgroundMaskApplied:true,
      matchedReferencePointRatio,
      minMatchedReferencePointRatio,
      referenceAgeFrames:sample.referenceAgeFrames===undefined?null:Number(sample.referenceAgeFrames)
    };
  }

  function validateArtifact(artifact,options={}){
    if(!ArtifactProvider||typeof ArtifactProvider.validateArtifact!=='function'){
      return {ok:false,reason:'CAMERA_MOTION_ARTIFACT_PROVIDER_UNAVAILABLE'};
    }
    const base=ArtifactProvider.validateArtifact(artifact);
    if(!base.ok)return base;
    const samples=Array.isArray(artifact.samples)?artifact.samples:[];
    for(let index=0;index<samples.length;index++){
      const verdict=inspectSample(samples[index],options);
      if(!verdict.ok)return {...verdict,sampleIndex:index};
    }
    return {ok:true,reason:null,sampleCount:samples.length};
  }

  function createGuardedProvider(artifact,options={}){
    const verdict=validateArtifact(artifact,options);
    if(!verdict.ok)throw new Error(verdict.reason);
    const base=ArtifactProvider.createProvider(artifact,options.providerOptions||{});
    return {
      ...base,
      backgroundEvidenceGuard:{
        version:VERSION,
        minMatchedReferencePointRatio:finite(options.minMatchedReferencePointRatio)
          ?clamp(options.minMatchedReferencePointRatio,0,1)
          :.75,
        maxReferenceAgeFrames:finite(options.maxReferenceAgeFrames)
          ?Math.max(0,Math.floor(Number(options.maxReferenceAgeFrames)))
          :null,
        policy:'EXTERNAL_CAMERA_MOTION_ACCEPTED_ONLY_WITH_EXPLICIT_BACKGROUND_MASK_AND_REFERENCE_POINT_RETENTION_EVIDENCE'
      }
    };
  }

  return {VERSION,inspectSample,validateArtifact,createGuardedProvider};
});
