(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallCandidateContinuity=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));

  function pointOf(d){
    if(!d)return null;
    if(finite(d.pitchX)&&finite(d.pitchY))return {x:Number(d.pitchX),y:Number(d.pitchY),space:'pitch'};
    if(finite(d.xM)&&finite(d.yM))return {x:Number(d.xM),y:Number(d.yM),space:'pitch'};
    if(finite(d.x)&&finite(d.y))return {x:Number(d.x),y:Number(d.y),space:'image'};
    return null;
  }
  function confidenceOf(d){return finite(d&&d.confidence)?clamp01(d.confidence):0;}
  function continuityKey(ctx){
    if(!ctx)return null;
    const v=ctx.segmentId??ctx.segment??ctx.shotId??ctx.planId;
    return v===undefined||v===null||String(v).trim()===''?null:String(v);
  }
  function create(options){
    const raw=options||{};
    const cfg={
      bufferSize:Math.max(2,Math.round(finite(raw.bufferSize)?Number(raw.bufferSize):8)),
      minConfidence:finite(raw.minConfidence)?Number(raw.minConfidence):.35,
      maxGapSec:finite(raw.maxGapSec)?Number(raw.maxGapSec):.65,
      maxPitchJumpM:finite(raw.maxPitchJumpM)?Number(raw.maxPitchJumpM):12,
      maxImageJump:finite(raw.maxImageJump)?Number(raw.maxImageJump):.22,
      confidenceWeight:finite(raw.confidenceWeight)?Number(raw.confidenceWeight):.20
    };
    const state={history:[],lastTime:null,lastKey:null,resets:0,rejections:0,selections:0};

    function reset(reason){state.history=[];state.lastTime=null;state.lastKey=null;state.resets++;return reason||'manual';}
    function centroid(space){
      const pts=state.history.filter(h=>h.space===space);
      if(!pts.length)return null;
      return {x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};
    }
    function select(candidates,time,context){
      const t=finite(time)?Number(time):null,key=continuityKey(context);
      if(state.lastTime!==null&&t!==null&&t-state.lastTime>cfg.maxGapSec)reset('gap');
      if(state.lastKey!==null&&key!==null&&state.lastKey!==key)reset('segment');
      const valid=(candidates||[]).map((raw,index)=>({raw,index,p:pointOf(raw),confidence:confidenceOf(raw)}))
        .filter(x=>x.p&&x.confidence>=cfg.minConfidence&&x.raw.valid!==false&&x.raw.visible!==false&&x.raw.drifted!==true&&x.raw.driftStatus!=='DRIFTED');
      if(!valid.length){if(t!==null)state.lastTime=t;if(key!==null)state.lastKey=key;return {status:'UNAVAILABLE',reason:'NO_VALID_BALL_CANDIDATE'};}

      let best=null;
      for(const c of valid){
        const center=centroid(c.p.space);
        const distance=center?Math.hypot(c.p.x-center.x,c.p.y-center.y):0;
        const limit=c.p.space==='pitch'?cfg.maxPitchJumpM:cfg.maxImageJump;
        if(center&&distance>limit)continue;
        const normalized=center&&limit>0?distance/limit:0;
        const score=normalized-c.confidence*cfg.confidenceWeight;
        if(!best||score<best.score)best={...c,distance,score,limit};
      }
      if(!best){state.rejections++;if(t!==null)state.lastTime=t;if(key!==null)state.lastKey=key;return {status:'UNAVAILABLE',reason:'ALL_CANDIDATES_BREAK_CONTINUITY',candidateCount:valid.length};}
      state.history.push({x:best.p.x,y:best.p.y,space:best.p.space,time:t});
      if(state.history.length>cfg.bufferSize)state.history.splice(0,state.history.length-cfg.bufferSize);
      if(t!==null)state.lastTime=t;if(key!==null)state.lastKey=key;state.selections++;
      return {status:'SELECTED',candidate:best.raw,index:best.index,confidence:best.confidence,distanceToRecentCentroid:best.distance,space:best.p.space,historySize:state.history.length,source:'observed_detection_temporal_continuity'};
    }
    function snapshot(){return {config:{...cfg},history:state.history.map(x=>({...x})),lastTime:state.lastTime,lastKey:state.lastKey,resets:state.resets,rejections:state.rejections,selections:state.selections};}
    return {select,reset,snapshot};
  }
  return {create};
});
