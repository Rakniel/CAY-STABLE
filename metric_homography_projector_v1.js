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

  function buildHomography(correspondences){
    if(!Array.isArray(correspondences)||correspondences.length!==4)return {ok:false,reason:'4 correspondances image-terrain requises'};
    const rows=[],rhs=[];
    for(const c of correspondences){
      if(!c||!finitePoint(c.image)||!finitePoint(c.pitch))return {ok:false,reason:'correspondance invalide'};
      const x=Number(c.image.x),y=Number(c.image.y),X=Number(c.pitch.x),Y=Number(c.pitch.y);
      rows.push([x,y,1,0,0,0,-X*x,-X*y]); rhs.push(X);
      rows.push([0,0,0,x,y,1,-Y*x,-Y*y]); rhs.push(Y);
    }
    const imageArea=polygonArea(correspondences.map(c=>c.image));
    const pitchArea=polygonArea(correspondences.map(c=>c.pitch));
    if(imageArea<1e-4||pitchArea<1)return {ok:false,reason:'géométrie dégénérée ou points trop alignés'};
    const h=solveLinear(rows,rhs);
    if(!h||!h.every(Number.isFinite))return {ok:false,reason:'homographie non résoluble'};
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

  function reprojectionError(H,validationPoints){
    if(!Array.isArray(validationPoints)||validationPoints.length===0)return null;
    let sum=0,n=0,max=0;
    for(const c of validationPoints){
      if(!c||!finitePoint(c.image)||!finitePoint(c.pitch))continue;
      const q=project(H,c.image); if(!q)continue;
      const e=Math.hypot(q.x-Number(c.pitch.x),q.y-Number(c.pitch.y));
      if(!Number.isFinite(e))continue;
      sum+=e;n++;max=Math.max(max,e);
    }
    return n?{count:n,meanM:sum/n,maxM:max}:null;
  }

  function createProjector(options={}){
    const fit=buildHomography(options.correspondences);
    if(!fit.ok)return {validated:false,source:'manual_4_point_homography',confidence:0,reason:fit.reason,project:null};
    const pitchLength=Number(options.pitchLengthM)||105,pitchWidth=Number(options.pitchWidthM)||68;
    const validation=reprojectionError(fit.H,options.validationPoints);
    const maxMean=Number.isFinite(Number(options.maxMeanErrorM))?Number(options.maxMeanErrorM):2.5;
    const maxPeak=Number.isFinite(Number(options.maxPeakErrorM))?Number(options.maxPeakErrorM):5;
    let validated=false,reason=null,confidence=.6;
    if(validation&&validation.count>=2){
      validated=validation.meanM<=maxMean&&validation.maxM<=maxPeak;
      confidence=validated?clamp(1-(validation.meanM/maxMean)*.35-(validation.maxM/maxPeak)*.25,.5,1):0;
      if(!validated)reason=`erreur reprojection trop élevée (${validation.meanM.toFixed(2)} m moyenne, ${validation.maxM.toFixed(2)} m max)`;
    }else{
      reason='validation indépendante insuffisante (au moins 2 points requis)';
    }
    const safeProject=p=>{
      const q=project(fit.H,p); if(!q)return null;
      const margin=3;
      if(q.x< -margin||q.x>pitchLength+margin||q.y< -margin||q.y>pitchWidth+margin)return null;
      return q;
    };
    return {
      validated,
      source:'manual_4_point_homography_cay_v1',
      confidence:+confidence.toFixed(3),
      reason:validated?null:reason,
      project:validated?safeProject:null,
      homography:fit.H.slice(),
      validation,
      pitch:{lengthM:pitchLength,widthM:pitchWidth},
      provenance:{designReferences:['SoccerNet camera calibration','TVCalib'],codeCopied:false,licenseDependency:'none'}
    };
  }

  return {buildHomography,project,reprojectionError,createProjector,solveLinear};
});
