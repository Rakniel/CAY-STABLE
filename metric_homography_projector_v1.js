(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricHomographyProjector=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const EPS=1e-10;
  const finitePoint=p=>p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function solveLinear(A,b){
    const n=b.length,M=A.map((r,i)=>r.slice().concat([b[i]]));
    for(let c=0;c<n;c++){
      let pivot=c;
      for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[pivot][c]))pivot=r;
      if(Math.abs(M[pivot][c])<EPS)return null;
      [M[c],M[pivot]]=[M[pivot],M[c]];
      const div=M[c][c];
      for(let j=c;j<=n;j++)M[c][j]/=div;
      for(let r=0;r<n;r++){
        if(r===c)continue;
        const f=M[r][c];
        if(Math.abs(f)<EPS)continue;
        for(let j=c;j<=n;j++)M[r][j]-=f*M[c][j];
      }
    }
    return M.map(r=>r[n]);
  }

  function polygonArea(points){
    let s=0;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      s+=a.x*b.y-b.x*a.y;
    }
    return Math.abs(s)/2;
  }

  function designRows(correspondences){
    const rows=[],rhs=[];
    for(const c of correspondences){
      if(!c||!finitePoint(c.image)||!finitePoint(c.pitch))return null;
      const x=Number(c.image.x),y=Number(c.image.y),X=Number(c.pitch.x),Y=Number(c.pitch.y);
      rows.push([x,y,1,0,0,0,-X*x,-X*y]); rhs.push(X);
      rows.push([0,0,0,x,y,1,-Y*x,-Y*y]); rhs.push(Y);
    }
    return {rows,rhs};
  }

  function fitFour(correspondences){
    if(!Array.isArray(correspondences)||correspondences.length!==4)return {ok:false,reason:'4 correspondances image-terrain requises pour un ajustement minimal'};
    const design=designRows(correspondences);
    if(!design)return {ok:false,reason:'correspondance invalide'};
    const imageArea=polygonArea(correspondences.map(c=>c.image));
    const pitchArea=polygonArea(correspondences.map(c=>c.pitch));
    if(imageArea<1e-4||pitchArea<1)return {ok:false,reason:'géométrie dégénérée ou points trop alignés'};
    const h=solveLinear(design.rows,design.rhs);
    if(!h||!h.every(Number.isFinite))return {ok:false,reason:'homographie non résoluble'};
    return {ok:true,H:[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1]};
  }

  function fitLeastSquares(correspondences){
    if(!Array.isArray(correspondences)||correspondences.length<4)return {ok:false,reason:'au moins 4 correspondances requises pour le refit'};
    const design=designRows(correspondences);
    if(!design)return {ok:false,reason:'correspondance invalide'};
    const cols=8,ata=Array.from({length:cols},()=>Array(cols).fill(0)),atb=Array(cols).fill(0);
    for(let r=0;r<design.rows.length;r++){
      const row=design.rows[r],target=design.rhs[r];
      for(let i=0;i<cols;i++){
        atb[i]+=row[i]*target;
        for(let j=0;j<cols;j++)ata[i][j]+=row[i]*row[j];
      }
    }
    const h=solveLinear(ata,atb);
    if(!h||!h.every(Number.isFinite))return {ok:false,reason:'refit moindres carrés non résoluble'};
    return {ok:true,H:[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1]};
  }

  function project(H,p){
    if(!Array.isArray(H)||H.length!==9||!finitePoint(p))return null;
    const x=Number(p.x),y=Number(p.y),w=H[6]*x+H[7]*y+H[8];
    if(!Number.isFinite(w)||Math.abs(w)<EPS)return null;
    const X=(H[0]*x+H[1]*y+H[2])/w;
    const Y=(H[3]*x+H[4]*y+H[5])/w;
    return Number.isFinite(X)&&Number.isFinite(Y)?{x:X,y:Y}:null;
  }

  function pointErrorM(H,c){
    if(!c||!finitePoint(c.image)||!finitePoint(c.pitch))return null;
    const q=project(H,c.image);if(!q)return null;
    const e=Math.hypot(q.x-Number(c.pitch.x),q.y-Number(c.pitch.y));
    return Number.isFinite(e)?e:null;
  }

  function combinations4(n,max=70){
    const out=[];
    for(let a=0;a<n-3&&out.length<max;a++)for(let b=a+1;b<n-2&&out.length<max;b++)for(let c=b+1;c<n-1&&out.length<max;c++)for(let d=c+1;d<n&&out.length<max;d++)out.push([a,b,c,d]);
    return out;
  }

  function summarizeErrors(H,correspondences,indices){
    const errors=indices.map(i=>pointErrorM(H,correspondences[i])).filter(e=>e!==null);
    if(!errors.length)return null;
    return {mean:errors.reduce((s,e)=>s+e,0)/errors.length,peak:Math.max(...errors)};
  }

  function buildHomography(correspondences,options={}){
    if(!Array.isArray(correspondences)||correspondences.length<4)return {ok:false,reason:'au moins 4 correspondances image-terrain requises'};
    if(correspondences.some(c=>!c||!finitePoint(c.image)||!finitePoint(c.pitch)))return {ok:false,reason:'correspondance invalide'};
    if(correspondences.length===4){
      const fit=fitFour(correspondences);
      return fit.ok?{...fit,method:'DLT_4_POINTS',inlierCount:4,totalCount:4,inlierRatio:1,rejectedIndices:[],refitAttempted:false,refitApplied:false}:fit;
    }
    const threshold=Number.isFinite(Number(options.consensusThresholdM))?Math.max(.25,Number(options.consensusThresholdM)):2;
    const minRatio=Number.isFinite(Number(options.minInlierRatio))?clamp(Number(options.minInlierRatio),.5,1):.7;
    const subsets=combinations4(correspondences.length,Number.isFinite(Number(options.maxHypotheses))?Math.max(1,Math.floor(Number(options.maxHypotheses))):70);
    let best=null;
    for(const idx of subsets){
      const fit=fitFour(idx.map(i=>correspondences[i]));if(!fit.ok)continue;
      const errors=correspondences.map(c=>pointErrorM(fit.H,c));
      const inliers=errors.map((e,i)=>e!==null&&e<=threshold?i:null).filter(i=>i!==null);
      if(inliers.length<4)continue;
      const mean=inliers.reduce((s,i)=>s+errors[i],0)/inliers.length;
      const peak=Math.max(...inliers.map(i=>errors[i]));
      const score={fit,idx,errors,inliers,mean,peak};
      if(!best||inliers.length>best.inliers.length||(inliers.length===best.inliers.length&&mean<best.mean)||(inliers.length===best.inliers.length&&Math.abs(mean-best.mean)<1e-9&&peak<best.peak))best=score;
    }
    if(!best)return {ok:false,reason:'aucune homographie robuste non dégénérée'};
    const ratio=best.inliers.length/correspondences.length;
    if(ratio<minRatio)return {ok:false,reason:`consensus insuffisant (${best.inliers.length}/${correspondences.length})`,inlierCount:best.inliers.length,totalCount:correspondences.length,inlierRatio:+ratio.toFixed(4)};

    const seedSummary=summarizeErrors(best.fit.H,correspondences,best.inliers);
    const refitAttempted=best.inliers.length>4;
    const refit=refitAttempted?fitLeastSquares(best.inliers.map(i=>correspondences[i])):{ok:false,reason:'refit non nécessaire'};
    const refitSummary=refit.ok?summarizeErrors(refit.H,correspondences,best.inliers):null;
    const refitApplied=!!(refit.ok&&refitSummary&&seedSummary&&refitSummary.mean<=seedSummary.mean+1e-9);
    const refinedH=refitApplied?refit.H:best.fit.H;
    const refinedSummary=refitApplied?refitSummary:seedSummary;
    const rejectedIndices=correspondences.map((_,i)=>i).filter(i=>!best.inliers.includes(i));
    return {
      ok:true,H:refinedH,method:'ROBUST_4_POINT_CONSENSUS',inlierCount:best.inliers.length,totalCount:correspondences.length,
      inlierRatio:+ratio.toFixed(4),consensusThresholdM:threshold,
      meanInlierErrorM:+refinedSummary.mean.toFixed(4),maxInlierErrorM:+refinedSummary.peak.toFixed(4),
      seedMeanInlierErrorM:+seedSummary.mean.toFixed(4),seedMaxInlierErrorM:+seedSummary.peak.toFixed(4),
      refitAttempted,refitApplied,refitMethod:refitApplied?'ALL_INLIERS_LINEAR_LEAST_SQUARES':null,
      refitCandidateMeanInlierErrorM:refitSummary?+refitSummary.mean.toFixed(4):null,
      refitRejectedReason:refitAttempted&&!refitApplied?(refit.ok?'NO_MEAN_ERROR_IMPROVEMENT':(refit.reason||'REFIT_FAILED')):null,
      rejectedIndices,hypothesesTested:subsets.length
    };
  }

  function reprojectionError(H,validationPoints){
    if(!Array.isArray(validationPoints)||validationPoints.length===0)return null;
    let sum=0,n=0,max=0;
    for(const c of validationPoints){
      const e=pointErrorM(H,c);if(e===null)continue;
      sum+=e;n++;max=Math.max(max,e);
    }
    return n?{count:n,meanM:sum/n,maxM:max}:null;
  }

  function createProjector(options={}){
    const fit=buildHomography(options.correspondences,options);
    if(!fit.ok)return {validated:false,source:'manual_homography',confidence:0,reason:fit.reason,project:null,fit};
    const pitchLength=Number(options.pitchLengthM)||105,pitchWidth=Number(options.pitchWidthM)||68;
    const validation=reprojectionError(fit.H,options.validationPoints);
    const maxMean=Number.isFinite(Number(options.maxMeanErrorM))?Number(options.maxMeanErrorM):2.5;
    const maxPeak=Number.isFinite(Number(options.maxPeakErrorM))?Number(options.maxPeakErrorM):5;
    let validated=false,reason=null,confidence=.6;
    if(validation&&validation.count>=2){
      validated=validation.meanM<=maxMean&&validation.maxM<=maxPeak;
      const consensusBonus=fit.inlierRatio>=.9?.08:fit.inlierRatio>=.75?.04:0;
      confidence=validated?clamp(1-(validation.meanM/maxMean)*.35-(validation.maxM/maxPeak)*.25+consensusBonus,.5,1):0;
      if(!validated)reason=`erreur reprojection trop élevée (${validation.meanM.toFixed(2)} m moyenne, ${validation.maxM.toFixed(2)} m max)`;
    }else reason='validation indépendante insuffisante (au moins 2 points requis)';
    const safeProject=p=>{
      const q=project(fit.H,p); if(!q)return null;
      const margin=3;
      if(q.x< -margin||q.x>pitchLength+margin||q.y< -margin||q.y>pitchWidth+margin)return null;
      return q;
    };
    return {
      validated,
      source:fit.method==='ROBUST_4_POINT_CONSENSUS'?'manual_multi_point_homography_cay_v2':'manual_4_point_homography_cay_v1',
      confidence:+confidence.toFixed(3),reason:validated?null:reason,project:validated?safeProject:null,
      homography:fit.H.slice(),validation,fit:{method:fit.method,inlierCount:fit.inlierCount,totalCount:fit.totalCount,inlierRatio:fit.inlierRatio,rejectedIndices:fit.rejectedIndices||[],consensusThresholdM:fit.consensusThresholdM||null,hypothesesTested:fit.hypothesesTested||1,refitAttempted:!!fit.refitAttempted,refitApplied:!!fit.refitApplied,refitMethod:fit.refitMethod||null,refitRejectedReason:fit.refitRejectedReason||null,refitCandidateMeanInlierErrorM:fit.refitCandidateMeanInlierErrorM??null,meanInlierErrorM:fit.meanInlierErrorM??null,seedMeanInlierErrorM:fit.seedMeanInlierErrorM??null},
      pitch:{lengthM:pitchLength,widthM:pitchWidth},
      provenance:{designReferences:['SoccerNet camera calibration','TVCalib','OpenCV findHomography RANSAC principle + inlier-only refinement'],codeCopied:false,licenseDependency:'none',openCvReferenceLicense:'Apache-2.0 (OpenCV >= 4.5.0)'}
    };
  }

  return {buildHomography,project,reprojectionError,createProjector,solveLinear,combinations4,fitLeastSquares};
});