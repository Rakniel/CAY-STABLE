(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricMotionPlausibility=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RAW_SPIKE_THRESHOLD_KMH=55;
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const present=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='');
  const distanceM=(a,b)=>Math.hypot(Number(b?.x)-Number(a?.x),Number(b?.y)-Number(a?.y));
  const sameSegmentOrUnspecified=(a,b)=>!present(a?.segment)||!present(b?.segment)||String(a.segment)===String(b.segment);
  function transitionSpeedKmh(a,b){
    if(!finite(a?.time)||!finite(b?.time)||!finite(a?.x)||!finite(a?.y)||!finite(b?.x)||!finite(b?.y))return null;
    const dt=Number(b.time)-Number(a.time);
    if(!(dt>0))return null;
    const d=distanceM(a,b);
    return finite(d)?(d/dt)*3.6:null;
  }
  function transitionEvidence(a,b,maxRawSpeedKmh=RAW_SPIKE_THRESHOLD_KMH){
    const threshold=Number.isFinite(Number(maxRawSpeedKmh))&&Number(maxRawSpeedKmh)>0?Number(maxRawSpeedKmh):RAW_SPIKE_THRESHOLD_KMH;
    if(!sameSegmentOrUnspecified(a,b))return {plausible:false,speedKmh:null,thresholdKmh:threshold,reason:'changement de plan métrique: transition inter-segment interdite'};
    const speedKmh=transitionSpeedKmh(a,b);
    const plausible=speedKmh!==null&&Number.isFinite(speedKmh)&&speedKmh<=threshold;
    return {plausible,speedKmh:speedKmh===null?null:+speedKmh.toFixed(6),thresholdKmh:threshold,reason:plausible?null:(speedKmh===null?'transition métrique temporelle invalide':'vitesse brute métrique au-dessus du seuil de plausibilité')};
  }
  function splitRawSpikeRuns(run,maxRawSpeedKmh=RAW_SPIKE_THRESHOLD_KMH){
    const parts=[];let current=[],rejectedPairs=0;
    for(const p of Array.isArray(run)?run:[]){
      if(!current.length){current=[p];continue;}
      const prev=current[current.length-1],evidence=transitionEvidence(prev,p,maxRawSpeedKmh);
      if(!evidence.plausible){
        if(current.length)parts.push(current);
        current=[p];rejectedPairs++;
      }else current.push(p);
    }
    if(current.length)parts.push(current);
    return {runs:parts,rejectedPairs};
  }
  return {RAW_SPIKE_THRESHOLD_KMH,transitionSpeedKmh,transitionEvidence,splitRawSpikeRuns,sameSegmentOrUnspecified};
});
