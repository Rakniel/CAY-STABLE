(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const isPresent=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='');
  const finite=v=>isPresent(v)&&Number.isFinite(Number(v))?Number(v):null;
  const normalizedId=v=>isPresent(v)?String(v).trim():null;
  const key=(frame,id)=>`${frame}::${id}`;

  function normalize(rows){
    return (rows||[]).map((r,i)=>({
      frame:finite(r&&r.frame),
      gtId:normalizedId(r&&r.gtId),
      trackId:normalizedId(r&&r.trackId),
      visible:r&&r.visible!==false,
      matched:r&&r.matched!==false,
      index:i
    })).filter(r=>r.frame!=null&&r.gtId!=null&&r.visible);
  }

  function incrementNested(map,outer,inner){
    if(!map.has(outer)) map.set(outer,new Map());
    const counts=map.get(outer);
    counts.set(inner,(counts.get(inner)||0)+1);
  }

  function dominantCount(counts){
    let best=0;
    for(const value of counts.values()) if(value>best) best=value;
    return best;
  }

  function associationMetrics(gtToTrack,trackToGt,matched){
    if(!matched) return {
      gtAssociationPurity:0,
      trackAssociationPurity:0,
      associationIntegrity:0,
      mergedTrackIds:0,
      splitGroundTruthIds:0
    };

    let gtDominant=0,trackDominant=0,mergedTrackIds=0,splitGroundTruthIds=0;
    for(const counts of gtToTrack.values()){
      gtDominant+=dominantCount(counts);
      if(counts.size>1) splitGroundTruthIds++;
    }
    for(const counts of trackToGt.values()){
      trackDominant+=dominantCount(counts);
      if(counts.size>1) mergedTrackIds++;
    }
    const gtAssociationPurity=gtDominant/matched;
    const trackAssociationPurity=trackDominant/matched;
    return {
      gtAssociationPurity,
      trackAssociationPurity,
      associationIntegrity:Math.sqrt(gtAssociationPurity*trackAssociationPurity),
      mergedTrackIds,
      splitGroundTruthIds
    };
  }

  function evaluate(rows){
    const data=normalize(rows).sort((a,b)=>a.frame-b.frame||a.index-b.index);
    const gtObs=data.length;
    let matched=0,idSwitches=0,fragmentations=0;
    const lastTrack=new Map(),lastMatched=new Map(),uniqueGt=new Set(),uniqueTracks=new Set();
    const gtToTrack=new Map(),trackToGt=new Map();
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
        incrementNested(gtToTrack,r.gtId,r.trackId);
        incrementNested(trackToGt,r.trackId,r.gtId);
        if(lastTrack.has(r.gtId)&&lastTrack.get(r.gtId)!==r.trackId) idSwitches++;
        if(lastMatched.has(r.gtId)&&lastMatched.get(r.gtId)===false) fragmentations++;
        lastTrack.set(r.gtId,r.trackId);
      }
      lastMatched.set(r.gtId,isMatched);
    }

    const coverage=gtObs?matched/gtObs:0;
    const identityContinuity=matched?Math.max(0,1-idSwitches/matched):0;
    const association=associationMetrics(gtToTrack,trackToGt,matched);
    return {
      groundTruthObservations:gtObs,
      matchedObservations:matched,
      missedObservations:gtObs-matched,
      observedCoverage:coverage,
      idSwitches,
      fragmentations,
      identityContinuity,
      groundTruthPlayers:uniqueGt.size,
      producedTrackIds:uniqueTracks.size,
      ...association
    };
  }

  function groundTruthEvidence(rows){
    return normalize(rows).map(r=>key(r.frame,r.gtId)).sort();
  }

  function assertComparableEvidence(beforeRows,afterRows){
    const before=groundTruthEvidence(beforeRows),after=groundTruthEvidence(afterRows);
    if(before.length!==after.length)throw new Error(`tracking benchmark comparison requires identical ground-truth evidence: before=${before.length}, after=${after.length}`);
    for(let i=0;i<before.length;i++){
      if(before[i]!==after[i])throw new Error(`tracking benchmark comparison requires identical ground-truth evidence: mismatch at ${before[i]} vs ${after[i]}`);
    }
  }

  function compare(beforeRows,afterRows){
    assertComparableEvidence(beforeRows,afterRows);
    const before=evaluate(beforeRows),after=evaluate(afterRows);
    return {
      before,after,
      delta:{
        observedCoverage:after.observedCoverage-before.observedCoverage,
        identityContinuity:after.identityContinuity-before.identityContinuity,
        gtAssociationPurity:after.gtAssociationPurity-before.gtAssociationPurity,
        trackAssociationPurity:after.trackAssociationPurity-before.trackAssociationPurity,
        associationIntegrity:after.associationIntegrity-before.associationIntegrity,
        idSwitches:after.idSwitches-before.idSwitches,
        fragmentations:after.fragmentations-before.fragmentations,
        mergedTrackIds:after.mergedTrackIds-before.mergedTrackIds,
        splitGroundTruthIds:after.splitGroundTruthIds-before.splitGroundTruthIds
      }
    };
  }

  return {evaluate,compare};
});
