(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYObservedPresence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function createState(){
    return {frames:[],players:new Map(),maxObserved:0,rejectedDuplicateIds:0,rejectedOverflow:0};
  }
  function normalizeId(x){
    const raw=x&&x.trackId;
    if(typeof raw!=='number'&&(typeof raw!=='string'||!/^\d+$/.test(raw.trim())))return null;
    const id=Number(raw);
    return Number.isSafeInteger(id)&&id>0?id:null;
  }
  function observeFrame(state,assignments,time,meta){
    if(!state||!Array.isArray(state.frames)||!(state.players instanceof Map))throw new Error('presence state invalide');
    const t=Number(time);
    if(!Number.isFinite(t))throw new Error('temps invalide');
    meta=meta||{};
    const segment=Number.isInteger(meta.segment)?meta.segment:1;
    const byId=new Map();
    for(const a of assignments||[]){
      const id=normalizeId(a); if(id===null)continue;
      const score=Number.isFinite(a.score)&&a.score>=0&&a.score<=1?a.score:null;
      const prev=byId.get(id);
      if(prev){ state.rejectedDuplicateIds++; if((score??-1)>(prev.score??-1))byId.set(id,{id,score,cat:a.cat||null}); }
      else byId.set(id,{id,score,cat:a.cat||null});
    }
    const candidates=[...byId.values()].sort((a,b)=>(b.score??-1)-(a.score??-1)||a.id-b.id);
    const rejectedOverflowCount=Math.max(0,candidates.length-11);
    if(rejectedOverflowCount)state.rejectedOverflow+=rejectedOverflowCount;
    // Reject ambiguous instants instead of inventing eleven confirmed CAY players.
    const observed=rejectedOverflowCount?[]:candidates;
    const ids=observed.map(x=>x.id);
    const confidenceValues=observed.map(x=>x.score).filter(Number.isFinite);
    const frameConfidence=confidenceValues.length?confidenceValues.reduce((a,b)=>a+b,0)/confidenceValues.length:null;
    const frame={time:t,segment,observedIds:ids,observedCount:ids.length,coverage:ids.length/11,confidence:frameConfidence===null?null:+frameConfidence.toFixed(4),quality:ids.length===11?'FIABLE':(ids.length?'PARTIEL':'INDISPONIBLE'),candidateCount:candidates.length,rejectedOverflowCount,evidenceValid:rejectedOverflowCount===0,evidenceReason:rejectedOverflowCount?'MORE_THAN_11_CAY_IDS':'OK'};
    state.frames.push(frame); state.maxObserved=Math.max(state.maxObserved,ids.length);
    for(const o of observed){
      let p=state.players.get(o.id);
      if(!p){ p={id:o.id,firstObserved:t,lastObserved:t,framesObserved:0,segments:new Set(),appearanceBlocks:0,lastFrameIndex:-2,confidenceSamples:[]}; state.players.set(o.id,p); }
      const idx=state.frames.length-1;
      if(p.lastFrameIndex!==idx-1)p.appearanceBlocks++;
      p.lastFrameIndex=idx;p.lastObserved=t;p.framesObserved++;p.segments.add(segment);
      if(Number.isFinite(o.score))p.confidenceSamples.push(o.score);
    }
    return frame;
  }
  function frameAtOrBefore(state,time){
    const t=Number(time); if(!Number.isFinite(t))return null;
    let best=null;
    for(const f of state.frames){ if(f.time<=t&&(!best||f.time>best.time))best=f; }
    return best?{...best,observedIds:[...best.observedIds]}:null;
  }
  function summarize(state){
    const players=[...state.players.values()].map(p=>{
      const avg=p.confidenceSamples.length?p.confidenceSamples.reduce((a,b)=>a+b,0)/p.confidenceSamples.length:null;
      return {id:p.id,firstObserved:p.firstObserved,lastObserved:p.lastObserved,framesObserved:p.framesObserved,reappearances:Math.max(0,p.appearanceBlocks-1),segments:[...p.segments].sort((a,b)=>a-b),identityObservationConfidence:avg===null?null:+avg.toFixed(4)};
    }).sort((a,b)=>a.firstObserved-b.firstObserved||a.id-b.id);
    return {rosterSize:players.length,maxObservedSimultaneously:state.maxObserved,players,rejectedDuplicateIds:state.rejectedDuplicateIds,rejectedOverflow:state.rejectedOverflow,policy:{presence:'OBSERVED_ONLY',maxSimultaneousCAY:11,substitutions:'NEVER_INFERRED_FROM_PRESENCE',missingPlayer:'NOT_COUNTED_PRESENT_AT_INSTANT'}};
  }
  return {createState,observeFrame,frameAtOrBefore,summarize};
});
