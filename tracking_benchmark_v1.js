(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const finite=v=>Number.isFinite(Number(v))?Number(v):null;
  const key=(frame,id)=>`${frame}::${id}`;

  function normalize(rows){
    return (rows||[]).map((r,i)=>({
      frame:finite(r&&r.frame),
      gtId:r&&r.gtId!=null?String(r.gtId):null,
      trackId:r&&r.trackId!=null?String(r.trackId):null,
      visible:r&&r.visible!==false,
      matched:r&&r.matched!==false,
      index:i
    })).filter(r=>r.frame!=null&&r.gtId!=null&&r.visible);
  }

  function evaluate(rows){
    const data=normalize(rows).sort((a,b)=>a.frame-b.frame||a.index-b.index);
    const gtObs=data.length;
    let matched=0,idSwitches=0,fragmentations=0;
    const lastTrack=new Map(),lastMatched=new Map(),uniqueGt=new Set(),uniqueTracks=new Set();
    const seenFrameGt=new Set();

    for(const r of data){
      const fg=key(r.frame,r.gtId);
      if(seenFrameGt.has(fg)) throw new Error(`duplicate ground-truth observation for ${fg}`);
      seenFrameGt.add(fg);
      uniqueGt.add(r.gtId);
      const isMatched=!!r.matched&&r.trackId!=null;
      if(isMatched){
        matched++;
        uniqueTracks.add(r.trackId);
        if(lastTrack.has(r.gtId)&&lastTrack.get(r.gtId)!==r.trackId) idSwitches++;
        if(lastMatched.has(r.gtId)&&lastMatched.get(r.gtId)===false) fragmentations++;
        lastTrack.set(r.gtId,r.trackId);
      }
      lastMatched.set(r.gtId,isMatched);
    }

    const coverage=gtObs?matched/gtObs:0;
    const identityContinuity=matched?Math.max(0,1-idSwitches/matched):0;
    return {
      groundTruthObservations:gtObs,
      matchedObservations:matched,
      missedObservations:gtObs-matched,
      observedCoverage:coverage,
      idSwitches,
      fragmentations,
      identityContinuity,
      groundTruthPlayers:uniqueGt.size,
      producedTrackIds:uniqueTracks.size
    };
  }

  function compare(beforeRows,afterRows){
    const before=evaluate(beforeRows),after=evaluate(afterRows);
    return {
      before,after,
      delta:{
        observedCoverage:after.observedCoverage-before.observedCoverage,
        identityContinuity:after.identityContinuity-before.identityContinuity,
        idSwitches:after.idSwitches-before.idSwitches,
        fragmentations:after.fragmentations-before.fragmentations
      }
    };
  }

  return {evaluate,compare};
});
