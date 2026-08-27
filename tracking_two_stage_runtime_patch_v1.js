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
  function estimateGlobalTranslation(state,detections,ctx){
    const active=(state?.active||[]).filter(tr=>tr&&!tr.archived&&finite(tr.x)!==null&&finite(tr.y)!==null);
    const dets=(detections||[]).map((d,index)=>({d,index,p:detectionPoint(d,ctx)})).filter(x=>x.p);
    if(active.length<3||dets.length<3)return {available:false,reason:'insufficient_players',dx:0,dy:0,support:0,confidence:0};
    const motion=clamp01(finite(ctx?.cameraMotionScore)??0),geometry=clamp01(finite(ctx?.fieldGeometryDelta)??0),zoom=clamp01(Math.abs(finite(ctx?.zoomDelta)??0));
    if(motion<.28)return {available:false,reason:'camera_motion_too_low',dx:0,dy:0,support:0,confidence:0};
    if(geometry>=.20||zoom>=.24)return {available:false,reason:'non_translation_camera_change',dx:0,dy:0,support:0,confidence:0};
    const candidates=[];
    for(let ti=0;ti<active.length;ti++){
      const tr=active[ti];
      for(const item of dets){
        const d=item.d;if((tr.cat||'team')!==(d.cat==='goalkeeper'?'goalkeeper':'team'))continue;
        const appearance=appearanceDistance(tr.feature,d.feature);
        if(appearance>.34)continue;
        const dx=item.p.x-tr.x,dy=item.p.y-tr.y,mag=Math.hypot(dx,dy);
        if(mag>.22)continue;
        const weight=Math.max(.05,1-Math.min(1,appearance/.34))*(.7+.3*Math.min(1,(tr.seen||1)/8));
        candidates.push({ti,di:item.index,dx,dy,weight,appearance});
      }
    }
    if(candidates.length<3)return {available:false,reason:'insufficient_candidates',dx:0,dy:0,support:0,confidence:0};
    const radius=.038;let best=null;
    for(const center of candidates){
      const nearby=candidates.filter(c=>Math.hypot(c.dx-center.dx,c.dy-center.dy)<=radius).sort((a,b)=>b.weight-a.weight);
      const usedT=new Set(),usedD=new Set(),picked=[];
      for(const c of nearby){if(usedT.has(c.ti)||usedD.has(c.di))continue;usedT.add(c.ti);usedD.add(c.di);picked.push(c);}
      const score=picked.reduce((s,c)=>s+c.weight,0);
      if(!best||picked.length>best.picked.length||(picked.length===best.picked.length&&score>best.score))best={picked,score};
    }
    if(!best||best.picked.length<3)return {available:false,reason:'no_consensus',dx:0,dy:0,support:best?.picked.length||0,confidence:0};
    const total=best.picked.reduce((s,c)=>s+c.weight,0)||1;
    const dx=best.picked.reduce((s,c)=>s+c.dx*c.weight,0)/total,dy=best.picked.reduce((s,c)=>s+c.dy*c.weight,0)/total;
    const residual=best.picked.reduce((s,c)=>s+Math.hypot(c.dx-dx,c.dy-dy)*c.weight,0)/total;
    const supportRatio=Math.min(1,best.picked.length/Math.max(3,Math.min(active.length,dets.length)));
    const confidence=clamp01(.55*supportRatio+.30*motion+.15*(1-Math.min(1,residual/radius)));
    if(confidence<.58)return {available:false,reason:'low_consensus_confidence',dx,dy,support:best.picked.length,confidence};
    return {available:true,reason:null,dx,dy,support:best.picked.length,confidence,residual};
  }
  function applyTranslationToState(state,estimate){
    if(!estimate?.available||!state?.active)return 0;
    const dx=Number(estimate.dx)||0,dy=Number(estimate.dy)||0;let changed=0;
    for(const tr of state.active){
      if(!tr||tr.archived)continue;
      tr.x=clamp01((Number(tr.x)||0)+dx);tr.y=clamp01((Number(tr.y)||0)+dy);
      if(Array.isArray(tr.motionHistory)){
        tr.motionHistory=tr.motionHistory.map(p=>({...p,x:clamp01((Number(p.x)||0)+dx),y:clamp01((Number(p.y)||0)+dy)}));
      }
      changed++;
    }
    state.cameraCompensations=(state.cameraCompensations||0)+1;
    state.lastCameraCompensation={dx:+dx.toFixed(6),dy:+dy.toFixed(6),support:estimate.support||0,confidence:+(estimate.confidence||0).toFixed(4)};
    return changed;
  }
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
        if(ctx.segmentBreak!==true){
          const estimate=estimateGlobalTranslation(bridge.state,input,ctx);
          if(estimate.available)applyTranslationToState(bridge.state,estimate);
        }
        return baseProcess(input,time,ctx);
      };
      return bridge;
    };
    Bridge.__cayCameraConsensusPatched=true;return true;
  }
  function install(){patchCore();patchBridge();}
  root.CAYCameraMotionConsensus={estimateGlobalTranslation,applyTranslationToState,patchBridge,install};
  install();
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
    else setTimeout(install,0);
  }
})(typeof globalThis!=='undefined'?globalThis:this);
