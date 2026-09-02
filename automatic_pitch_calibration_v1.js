(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./metric_homography_projector_v1.js'):root.CAYMetricHomographyProjector
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYAutomaticPitchCalibration=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Homography){
  'use strict';

  const finite=n=>Number.isFinite(Number(n));
  const point=p=>p&&finite(p.x)&&finite(p.y);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function normalizeCorrespondences(items){
    if(!Array.isArray(items))return [];
    return items.filter(c=>c&&point(c.image)&&point(c.pitch)).map(c=>({
      image:{x:Number(c.image.x),y:Number(c.image.y)},
      pitch:{x:Number(c.pitch.x),y:Number(c.pitch.y)},
      confidence:finite(c.confidence)?clamp(Number(c.confidence),0,1):null,
      feature:c.feature||null
    }));
  }

  function farthestPairIndices(items){
    let best=[0,1],bestD=-1;
    for(let i=0;i<items.length-1;i++)for(let j=i+1;j<items.length;j++){
      const a=items[i].image,b=items[j].image;
      const d=(a.x-b.x)**2+(a.y-b.y)**2;
      if(d>bestD){bestD=d;best=[i,j];}
    }
    return best;
  }

  function splitFitValidation(correspondences){
    const c=normalizeCorrespondences(correspondences);
    if(c.length<6)return {ok:false,reason:'AUTO_CALIBRATION_NEEDS_SIX_CORRESPONDENCES',total:c.length};
    const validationIndices=farthestPairIndices(c);
    const validationSet=new Set(validationIndices);
    const fit=c.filter((_,i)=>!validationSet.has(i));
    const validation=c.filter((_,i)=>validationSet.has(i));
    if(fit.length<4)return {ok:false,reason:'AUTO_CALIBRATION_FIT_TOO_SMALL',total:c.length};
    return {ok:true,fit,validation,validationIndices,total:c.length};
  }

  function bottomCornerSanity(projector,frameSize,pitch,options={}){
    if(!projector||typeof projector.project!=='function')return {ok:false,reason:'AUTO_CALIBRATION_PROJECTOR_UNAVAILABLE'};
    const w=Number(frameSize&&frameSize.width),h=Number(frameSize&&frameSize.height);
    if(!(w>0&&h>0))return {ok:false,reason:'AUTO_CALIBRATION_FRAME_SIZE_INVALID'};
    const length=Number(pitch&&pitch.lengthM)||105,width=Number(pitch&&pitch.widthM)||68;
    const marginX=finite(options.bottomCornerMarginXM)?Math.max(0,Number(options.bottomCornerMarginXM)):90;
    const marginY=finite(options.bottomCornerMarginYM)?Math.max(0,Number(options.bottomCornerMarginYM)):60;
    const samples=[{x:0,y:h},{x:w,y:h}];
    const projected=samples.map(p=>projector.project(p));
    if(projected.some(p=>!point(p)))return {ok:false,reason:'AUTO_CALIBRATION_BOTTOM_CORNERS_UNPROJECTABLE',projected};
    const ok=projected.every(p=>p.x>=-marginX&&p.x<=length+marginX&&p.y>=-marginY&&p.y<=width+marginY);
    return ok?{ok:true,projected,checkedCorners:'BOTTOM_ONLY'}:{ok:false,reason:'AUTO_CALIBRATION_BOTTOM_CORNERS_IMPLAUSIBLE',projected,checkedCorners:'BOTTOM_ONLY'};
  }

  function confidenceSummary(correspondences){
    const values=correspondences.map(c=>c.confidence).filter(finite);
    if(!values.length)return {available:false,mean:null,min:null};
    return {available:true,mean:+(values.reduce((a,b)=>a+b,0)/values.length).toFixed(4),min:+Math.min(...values).toFixed(4)};
  }

  function evaluateAutomaticCalibration(options={}){
    if(!Homography||typeof Homography.createProjector!=='function')return {status:'INDISPONIBLE',reason:'HOMOGRAPHY_ENGINE_UNAVAILABLE'};
    const split=splitFitValidation(options.correspondences);
    if(!split.ok)return {status:'INSUFFICIENT_EVIDENCE',reason:split.reason,totalCorrespondences:split.total||0};

    const pitchLengthM=finite(options.pitchLengthM)?Number(options.pitchLengthM):105;
    const pitchWidthM=finite(options.pitchWidthM)?Number(options.pitchWidthM):68;
    const projector=Homography.createProjector({
      correspondences:split.fit,
      validationPoints:split.validation,
      pitchLengthM,pitchWidthM,
      consensusThresholdM:finite(options.consensusThresholdM)?Number(options.consensusThresholdM):2,
      minInlierRatio:finite(options.minInlierRatio)?Number(options.minInlierRatio):0.7,
      maxMeanErrorM:finite(options.maxMeanErrorM)?Number(options.maxMeanErrorM):2.5,
      maxPeakErrorM:finite(options.maxPeakErrorM)?Number(options.maxPeakErrorM):5
    });

    if(!projector.validated)return {
      status:'REJECTED',reason:projector.reason||'AUTO_CALIBRATION_REPROJECTION_REJECTED',
      totalCorrespondences:split.total,fitCount:split.fit.length,validationCount:split.validation.length,
      validation:projector.validation||null,fit:projector.fit||null
    };

    const cornerCheck=bottomCornerSanity(projector,options.frameSize,{lengthM:pitchLengthM,widthM:pitchWidthM},options);
    if(!cornerCheck.ok)return {
      status:'REJECTED',reason:cornerCheck.reason,
      totalCorrespondences:split.total,fitCount:split.fit.length,validationCount:split.validation.length,
      validation:projector.validation||null,fit:projector.fit||null,bottomCornerCheck:cornerCheck
    };

    const sourceConfidence=confidenceSummary(normalizeCorrespondences(options.correspondences));
    const minSourceMean=finite(options.minSourceMeanConfidence)?clamp(Number(options.minSourceMeanConfidence),0,1):0;
    if(sourceConfidence.available&&sourceConfidence.mean<minSourceMean)return {
      status:'REJECTED',reason:'AUTO_CALIBRATION_SOURCE_CONFIDENCE_TOO_LOW',sourceConfidence,
      totalCorrespondences:split.total,fitCount:split.fit.length,validationCount:split.validation.length
    };

    return {
      status:'ACCEPTED_AUTOMATIC',
      reason:null,
      projector,
      confidence:projector.confidence,
      totalCorrespondences:split.total,
      fitCount:split.fit.length,
      validationCount:split.validation.length,
      validationIndices:split.validationIndices,
      validation:projector.validation,
      bottomCornerCheck:cornerCheck,
      sourceConfidence,
      policy:'AUTO_FIRST_MANUAL_ONLY_ON_FAILURE',
      provenance:{
        designReference:'rafaelsouza-tech/soccer-tactical-vision',
        auditedRevision:'4c557534c624948f3bfe3db956859c7ea3b442fa',
        license:'MIT',
        adaptedIdea:'robust homography acceptance with real-footage-tuned ground-plane sanity; only bottom image corners are used for planar sanity because upper broadcast corners may show stands/sky',
        codeCopied:false
      }
    };
  }

  return {VERSION:'1.0.0',splitFitValidation,bottomCornerSanity,evaluateAutomaticCalibration};
});
