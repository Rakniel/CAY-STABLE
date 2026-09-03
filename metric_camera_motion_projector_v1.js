(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricCameraMotionProjector=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));

  function matrix3(value){
    if(Array.isArray(value)&&value.length===9&&value.every(finite))return value.map(Number);
    if(Array.isArray(value)&&value.length===6&&value.every(finite)){
      const m=value.map(Number);return [m[0],m[1],m[2],m[3],m[4],m[5],0,0,1];
    }
    return null;
  }

  function multiply3(A,B){
    const out=Array(9).fill(0);
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)for(let k=0;k<3;k++)out[r*3+c]+=A[r*3+k]*B[k*3+c];
    return out;
  }

  function inverse3(M){
    const [a,b,c,d,e,f,g,h,i]=M;
    const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g;
    const D=-(b*i-c*h),E=a*i-c*g,F=-(a*h-b*g);
    const G=b*f-c*e,H=-(a*f-c*d),I=a*e-b*d;
    const det=a*A+b*B+c*C;
    if(!Number.isFinite(det)||Math.abs(det)<1e-10)return null;
    return [A,D,G,B,E,H,C,F,I].map(v=>v/det);
  }

  function projectMatrix(H,p){
    if(!p||!finite(p.x)||!finite(p.y))return null;
    const x=Number(p.x),y=Number(p.y),w=H[6]*x+H[7]*y+H[8];
    if(!Number.isFinite(w)||Math.abs(w)<1e-10)return null;
    const X=(H[0]*x+H[1]*y+H[2])/w,Y=(H[3]*x+H[4]*y+H[5])/w;
    return Number.isFinite(X)&&Number.isFinite(Y)?{x:X,y:Y}:null;
  }

  function validateTransformPlausibility(matrix,options={}){
    const M=matrix3(matrix);
    if(!M)return {ok:false,reason:'MOTION_MATRIX_INVALID'};
    const [a,b,,d,e,,g,h,i]=M;
    if(!finite(i)||Math.abs(i)<1e-10)return {ok:false,reason:'MOTION_NORMALIZATION_INVALID'};

    // Short-horizon football camera motion should preserve orientation and remain
    // near a similarity/affine transform. This gate prevents a numerically valid
    // consensus from turning into a reflection, extreme zoom or pathological warp.
    const sx=Math.hypot(a,d),sy=Math.hypot(b,e);
    if(!(sx>1e-8&&sy>1e-8))return {ok:false,reason:'MOTION_SCALE_DEGENERATE',scaleX:sx,scaleY:sy};
    const orientation=a*e-b*d;
    if(!(orientation>0))return {ok:false,reason:'MOTION_ORIENTATION_FLIP',orientation};

    const maxScaleChange=finite(options.maxScaleChange)?clamp(options.maxScaleChange,0,.9):.45;
    const minScale=1-maxScaleChange,maxScale=1+maxScaleChange;
    if(sx<minScale||sx>maxScale||sy<minScale||sy>maxScale){
      return {ok:false,reason:'MOTION_SCALE_IMPLAUSIBLE',scaleX:sx,scaleY:sy,minScale,maxScale};
    }
    const anisotropy=Math.max(sx,sy)/Math.min(sx,sy);
    const maxAnisotropy=finite(options.maxAnisotropy)?Math.max(1,Number(options.maxAnisotropy)):1.6;
    if(anisotropy>maxAnisotropy)return {ok:false,reason:'MOTION_ANISOTROPY_TOO_HIGH',anisotropy,maxAnisotropy};

    const shearCos=Math.abs((a*b+d*e)/(sx*sy));
    const maxShearCos=finite(options.maxShearCos)?clamp(options.maxShearCos,0,.99):.55;
    if(shearCos>maxShearCos)return {ok:false,reason:'MOTION_SHEAR_TOO_HIGH',shearCos,maxShearCos};

    const frameWidth=finite(options.frameWidth)?Math.max(1,Number(options.frameWidth)):null;
    const frameHeight=finite(options.frameHeight)?Math.max(1,Number(options.frameHeight)):null;
    let centerDisplacementRatio=null;
    if(frameWidth&&frameHeight){
      const perspectiveMagnitude=Math.abs(g/i)*frameWidth+Math.abs(h/i)*frameHeight;
      const maxPerspectiveAtFrame=finite(options.maxPerspectiveAtFrame)?Math.max(0,Number(options.maxPerspectiveAtFrame)):.35;
      if(perspectiveMagnitude>maxPerspectiveAtFrame){
        return {ok:false,reason:'MOTION_PERSPECTIVE_TOO_HIGH',perspectiveMagnitude,maxPerspectiveAtFrame};
      }

      // A cut-like translation can have perfect RANSAC/support statistics while being
      // impossible for the very short propagation window. Measure the actual motion of
      // the image centre, normalized by frame diagonal, instead of trusting tx/ty alone.
      const center={x:frameWidth*.5,y:frameHeight*.5};
      const movedCenter=projectMatrix(M,center);
      if(!movedCenter)return {ok:false,reason:'MOTION_CENTER_PROJECTION_INVALID'};
      const diagonal=Math.max(1,Math.hypot(frameWidth,frameHeight));
      centerDisplacementRatio=Math.hypot(movedCenter.x-center.x,movedCenter.y-center.y)/diagonal;
      const maxFrameDisplacementRatio=finite(options.maxFrameDisplacementRatio)
        ?clamp(options.maxFrameDisplacementRatio,.02,2)
        :.45;
      if(centerDisplacementRatio>maxFrameDisplacementRatio){
        return {ok:false,reason:'MOTION_DISPLACEMENT_TOO_HIGH',centerDisplacementRatio,maxFrameDisplacementRatio};
      }
    }
    return {ok:true,scaleX:sx,scaleY:sy,anisotropy,shearCos,orientation,centerDisplacementRatio};
  }

  function validateMotion(motion,options={}){
    const matrix=matrix3(motion?.matrix||motion?.H||motion?.affine);
    if(!matrix)return {ok:false,reason:'MOTION_MATRIX_INVALID'};
    const confidence=finite(motion?.confidence)?Number(motion.confidence):0;
    const support=finite(motion?.support)?Number(motion.support):0;
    const inlierRatio=finite(motion?.inlierRatio)?Number(motion.inlierRatio):0;
    const residual=finite(motion?.residual)?Number(motion.residual):Infinity;
    const maxResidual=finite(options.maxResidual)?Number(options.maxResidual):.02;
    const minConfidence=finite(options.minConfidence)?Number(options.minConfidence):.78;
    const minSupport=finite(options.minSupport)?Number(options.minSupport):20;
    const minInlierRatio=finite(options.minInlierRatio)?Number(options.minInlierRatio):.72;
    if(confidence<minConfidence)return {ok:false,reason:'MOTION_CONFIDENCE_TOO_LOW',confidence,support,inlierRatio,residual};
    if(support<minSupport)return {ok:false,reason:'MOTION_SUPPORT_TOO_LOW',confidence,support,inlierRatio,residual};
    if(inlierRatio<minInlierRatio)return {ok:false,reason:'MOTION_INLIER_RATIO_TOO_LOW',confidence,support,inlierRatio,residual};
    if(!(residual<=maxResidual))return {ok:false,reason:'MOTION_RESIDUAL_TOO_HIGH',confidence,support,inlierRatio,residual};
    const plausibility=validateTransformPlausibility(matrix,options);
    if(!plausibility.ok)return {ok:false,reason:plausibility.reason,confidence,support,inlierRatio,residual,plausibility};
    const inv=inverse3(matrix);if(!inv)return {ok:false,reason:'MOTION_MATRIX_SINGULAR',confidence,support,inlierRatio,residual};
    return {ok:true,matrix,inverse:inv,confidence,support,inlierRatio,residual,plausibility};
  }

  function createPropagatedProjector(anchor,motion,options={}){
    if(!anchor||anchor.validated!==true||!Array.isArray(anchor.homography)||anchor.homography.length!==9){
      return {validated:false,project:null,reason:'ANCHOR_CALIBRATION_UNAVAILABLE'};
    }
    const age=finite(options.ageSec)?Math.max(0,Number(options.ageSec)):Infinity;
    const maxAge=finite(options.maxAgeSec)?Math.max(.02,Number(options.maxAgeSec)):.35;
    if(!(age<=maxAge))return {validated:false,project:null,reason:'PROPAGATION_TOO_OLD',ageSec:age,maxAgeSec:maxAge};
    if(options.segmentBreak===true)return {validated:false,project:null,reason:'SEGMENT_BREAK'};
    const checked=validateMotion(motion,options);
    if(!checked.ok)return {validated:false,project:null,reason:checked.reason,motion:checked};

    // motion.matrix maps anchor-image coordinates -> current-image coordinates.
    // Therefore current-image -> pitch = anchor-image->pitch * inverse(motion).
    const H=multiply3(anchor.homography.map(Number),checked.inverse);
    const pitch=anchor.pitch||null,margin=finite(options.pitchMarginM)?Math.max(0,Number(options.pitchMarginM)):3;
    const safeProject=p=>{
      const q=projectMatrix(H,p);if(!q)return null;
      if(pitch&&finite(pitch.lengthM)&&finite(pitch.widthM)){
        if(q.x<-margin||q.x>Number(pitch.lengthM)+margin||q.y<-margin||q.y>Number(pitch.widthM)+margin)return null;
      }
      return q;
    };
    const ageStrength=1-clamp(age/maxAge,0,1)*.35;
    const confidence=clamp((Number(anchor.confidence)||0)*checked.confidence*checked.inlierRatio*ageStrength,0,1);
    if(confidence<(finite(options.minPropagatedConfidence)?Number(options.minPropagatedConfidence):.45)){
      return {validated:false,project:null,reason:'PROPAGATED_CONFIDENCE_TOO_LOW',confidence:+confidence.toFixed(3)};
    }
    return {
      validated:true,source:'guarded_camera_motion_propagation_cay_v1',confidence:+confidence.toFixed(3),reason:null,
      project:safeProject,homography:H,pitch,
      validation:{derived:true,ageSec:+age.toFixed(4),maxAgeSec:maxAge,motionConfidence:checked.confidence,motionSupport:checked.support,motionInlierRatio:checked.inlierRatio,motionResidual:checked.residual,motionPlausibility:checked.plausibility},
      provenance:{
        designReferences:['OpenCV robust affine/homography estimation','BoT-SORT global motion compensation'],
        codeCopied:false,
        licenseDependency:'none',
        referenceLicenses:['OpenCV Apache-2.0 (>=4.5)','BoT-SORT MIT'],
        rule:'ABSOLUTE_CALIBRATION_ANCHOR_PLUS_SHORT_HORIZON_GLOBAL_MOTION_ONLY'
      }
    };
  }

  return {matrix3,multiply3,inverse3,projectMatrix,validateTransformPlausibility,validateMotion,createPropagatedProjector};
});
