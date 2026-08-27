(function(root){
  'use strict';
  const Core=root.CAYTrackingCore,TwoStage=root.CAYTrackingTwoStageAdapter;
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const finite=v=>Number.isFinite(Number(v))?Number(v):null;

  function detectionPoint(d,ctx){
    if(!d)return null;
    let x=finite(d.x),y=finite(d.y);
    if(x!==null&&y!==null)return {x:clamp01(x),y:clamp01(y)};
    const b=d.b||d.box,w=Number(ctx?.width)||0,h=Number(ctx?.height)||0;
    if(!b||!(w>0&&h>0))return null;
    const bw=Math.max(1,Number(b.w)||0),bh=Math.max(1,Number(b.h)||0),bx=Number(b.x)||0,by=Number(b.y)||0;
    x=(bx+bw*.5)/w;y=(by+bh*((bw/bh)>1.05?.64:.96))/h;
    return {x:clamp01(x),y:clamp01(y)};
  }
  function appearanceDistance(a,b){
    if(Core&&typeof Core.appearanceDistance==='function')return Core.appearanceDistance(a,b);
    if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length)return .45;
    let s=0;for(let i=0;i<a.length;i++){const d=(Number(a[i])||0)-(Number(b[i])||0);s+=d*d;}
    return Math.min(1.2,Math.sqrt(s/a.length));
  }
  function candidatePairs(state,detections,ctx){
    const active=(state?.active||[]).filter(tr=>tr&&!tr.archived&&finite(tr.x)!==null&&finite(tr.y)!==null);
    const dets=(detections||[]).map((d,index)=>({d,index,p:detectionPoint(d,ctx)})).filter(x=>x.p);
    const candidates=[];
    for(let ti=0;ti<active.length;ti++){
      const tr=active[ti];
      for(const item of dets){
        const d=item.d;if((tr.cat||'team')!==(d.cat==='goalkeeper'?'goalkeeper':'team'))continue;
        const appearance=appearanceDistance(tr.feature,d.feature);
        if(appearance>.34)continue;
        const rawMag=Math.hypot(item.p.x-tr.x,item.p.y-tr.y);
        if(rawMag>.35)continue;
        const weight=Math.max(.05,1-Math.min(1,appearance/.34))*(.7+.3*Math.min(1,(tr.seen||1)/8));
        candidates.push({ti,di:item.index,tr,p:item.p,weight,appearance});
      }
    }
    return {active,dets,candidates};
  }
  function uniqueAppearancePairs(candidates){
    const ordered=[...(candidates||[])].sort((a,b)=>a.appearance-b.appearance||b.weight-a.weight);
    const usedT=new Set(),usedD=new Set(),picked=[];
    for(const c of ordered){if(usedT.has(c.ti)||usedD.has(c.di))continue;usedT.add(c.ti);usedD.add(c.di);picked.push(c);}
    return picked;
  }
  function fitSimilarity(pairs){
    if(!pairs||pairs.length<3)return null;
    let sw=0,mx=0,my=0,mu=0,mv=0;
    for(const c of pairs){const w=Math.max(.001,c.weight||1);sw+=w;mx+=c.tr.x*w;my+=c.tr.y*w;mu+=c.p.x*w;mv+=c.p.y*w;}
    if(sw<=0)return null;mx/=sw;my/=sw;mu/=sw;mv/=sw;
    let den=0,anum=0,bnum=0;
    for(const c of pairs){
      const w=Math.max(.001,c.weight||1),x=c.tr.x-mx,y=c.tr.y-my,u=c.p.x-mu,v=c.p.y-mv;
      den+=w*(x*x+y*y);anum+=w*(x*u+y*v);bnum+=w*(x*v-y*u);
    }
    if(den<1e-6)return null;
    const a=anum/den,b=bnum/den,scale=Math.hypot(a,b),rotation=Math.atan2(b,a);
    const tx=mu-a*mx+b*my,ty=mv-b*mx-a*my;
    let residual=0;const residuals=[];
    for(const c of pairs){const px=a*c.tr.x-b*c.tr.y+tx,py=b*c.tr.x+a*c.tr.y+ty,r=Math.hypot(px-c.p.x,py-c.p.y);residuals.push(r);residual+=r*Math.max(.001,c.weight||1);}
    residual/=sw;
    return {a,b,tx,ty,scale,rotation,residual,residuals};
  }
  function estimateGlobalMotion(state,detections,ctx){
    const {active,dets,candidates}=candidatePairs(state,detections,ctx);
    if(active.length<3||dets.length<3)return {available:false,reason:'insufficient_players',model:'none',support:0,confidence:0};
    const motion=clamp01(finite(ctx?.cameraMotionScore)??0),geometry=clamp01(finite(ctx?.fieldGeometryDelta)??0),zoomHint=clamp01(Math.abs(finite(ctx?.zoomDelta)??0));
    if(motion<.28)return {available:false,reason:'camera_motion_too_low',model:'none',support:0,confidence:0};
    if(geometry>=.34||zoomHint>=.45)return {available:false,reason:'camera_change_too_large',model:'none',support:0,confidence:0};
    if(candidates.length<3)return {available:false,reason:'insufficient_candidates',model:'none',support:0,confidence:0};

    const initial=uniqueAppearancePairs(candidates);
    if(initial.length<3)return {available:false,reason:'insufficient_unique_pairs',model:'none',support:initial.length,confidence:0};
    let fit=fitSimilarity(initial);if(!fit)return {available:false,reason:'degenerate_similarity',model:'none',support:0,confidence:0};
    const inliers=initial.filter((_,i)=>fit.residuals[i]<=.055);
    if(inliers.length>=3&&inliers.length<initial.length){const refined=fitSimilarity(inliers);if(refined)fit=refined;}
    const used=inliers.length>=3?inliers:initial;
    const scaleDelta=Math.abs(fit.scale-1),rotationAbs=Math.abs(fit.rotation);
    if(fit.scale<.88||fit.scale>1.14||rotationAbs>.12)return {available:false,reason:'unsupported_similarity',model:'similarity',support:used.length,confidence:0,scale:fit.scale,rotation:fit.rotation};
    if(fit.residual>.045)return {available:false,reason:'high_similarity_residual',model:'similarity',support:used.length,confidence:0,residual:fit.residual};
    if(scaleDelta>.035&&zoomHint<.015&&geometry<.02)return {available:false,reason:'unconfirmed_zoom',model:'similarity',support:used.length,confidence:0,scale:fit.scale};
    const supportRatio=Math.min(1,used.length/Math.max(3,Math.min(active.length,dets.length)));
    const residualStrength=1-Math.min(1,fit.residual/.045),shapeStrength=1-Math.min(1,(scaleDelta/.14)+(rotationAbs/.12)*.5);
    const confidence=clamp01(.48*supportRatio+.27*motion+.17*residualStrength+.08*shapeStrength);
    if(confidence<.60)return {available:false,reason:'low_consensus_confidence',model:'similarity',support:used.length,confidence,residual:fit.residual};
    const model=(scaleDelta<.008&&rotationAbs<.012)?'translation':'similarity';
    return {available:true,reason:null,model,a:fit.a,b:fit.b,tx:fit.tx,ty:fit.ty,dx:fit.tx,dy:fit.ty,scale:fit.scale,rotation:fit.rotation,support:used.length,confidence,residual:fit.residual};
  }
  function estimateGlobalTranslation(state,detections,ctx){
    const e=estimateGlobalMotion(state,detections,ctx);
    if(!e.available)return {available:false,reason:e.reason,dx:0,dy:0,support:e.support||0,confidence:e.confidence||0,model:e.model||'none'};
    if(e.model!=='translation')return {available:false,reason:'non_translation_camera_change',dx:0,dy:0,support:e.support||0,confidence:e.confidence||0,model:e.model,scale:e.scale,rotation:e.rotation};
    return e;
  }
  function transformPoint(p,e){
    const a=Number.isFinite(Number(e?.a))?Number(e.a):1,b=Number.isFinite(Number(e?.b))?Number(e.b):0;
    const tx=Number.isFinite(Number(e?.tx))?Number(e.tx):(Number(e?.dx)||0),ty=Number.isFinite(Number(e?.ty))?Number(e.ty):(Number(e?.dy)||0);
    const x=Number(p?.x)||0,y=Number(p?.y)||0;
    return {x:clamp01(a*x-b*y+tx),y:clamp01(b*x+a*y+ty)};
  }
  function applyMotionToState(state,estimate){
    if(!estimate?.available||!state?.active)return 0;
    let changed=0;
    for(const tr of state.active){
      if(!tr||tr.archived)continue;
      const current=transformPoint(tr,estimate);tr.x=current.x;tr.y=current.y;
      if(Array.isArray(tr.motionHistory))tr.motionHistory=tr.motionHistory.map(p=>{const q=transformPoint(p,estimate);return {...p,x:q.x,y:q.y};});
      changed++;
    }
    state.cameraCompensations=(state.cameraCompensations||0)+1;
    state.lastCameraCompensation={model:estimate.model||'translation',dx:+(Number(estimate.tx??estimate.dx)||0).toFixed(6),dy:+(Number(estimate.ty??estimate.dy)||0).toFixed(6),scale:+(Number(estimate.scale)||1).toFixed(6),rotation:+(Number(estimate.rotation)||0).toFixed(6),support:estimate.support||0,confidence:+(estimate.confidence||0).toFixed(4),residual:+(estimate.residual||0).toFixed(6)};
    return changed;
  }
  function applyTranslationToState(state,estimate){return applyMotionToState(state,{...estimate,model:'translation',a:1,b:0,tx:Number(estimate?.dx)||0,ty:Number(estimate?.dy)||0,scale:1,rotation:0});}
  function patchCore(){
    if(!Core||typeof Core.assignFrame!=='function'||!TwoStage||typeof TwoStage.assignFrame!=='function')return false;
    if(Core.__cayTwoStagePatched===true)return true;
    Core.assignFrame=function(state,detections,time,options){return TwoStage.assignFrame(state,detections,time,options).assigned;};
    Core.__cayTwoStagePatched=true;return true;
  }
  function patchBridge(){
    const Bridge=root.CAYStableTrackingBridge;
    if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayCameraConsensusPatched===true)return false;
    const baseCreate=Bridge.create.bind(Bridge);
    Bridge.create=function(options){
      const bridge=baseCreate(options),baseProcess=bridge.processFrame.bind(bridge);
      bridge.processFrame=function(input,time,context){
        const ctx=context||{};
        if(ctx.segmentBreak!==true){const estimate=estimateGlobalMotion(bridge.state,input,ctx);if(estimate.available)applyMotionToState(bridge.state,estimate);}
        return baseProcess(input,time,ctx);
      };
      return bridge;
    };
    Bridge.__cayCameraConsensusPatched=true;return true;
  }
  function install(){patchCore();patchBridge();}
  root.CAYCameraMotionConsensus={estimateGlobalMotion,estimateGlobalTranslation,applyMotionToState,applyTranslationToState,patchBridge,install};
  install();
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
    else setTimeout(install,0);
  }
})(typeof globalThis!=='undefined'?globalThis:this);
