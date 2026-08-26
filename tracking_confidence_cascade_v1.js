(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingConfidenceCascade=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
  function normalizeThresholds(options){
    const opts=options||{};
    const high=Math.max(0,Math.min(1,finite(opts.highScoreThreshold,.55)));
    const low=Math.max(0,Math.min(high,finite(opts.lowScoreThreshold,.20)));
    const recovery=Math.max(0,Math.min(1,finite(opts.recoveryCostMultiplier,.82)));
    return {highScoreThreshold:high,lowScoreThreshold:low,recoveryCostMultiplier:recovery};
  }
  function splitDetections(input,options){
    const cfg=normalizeThresholds(options),high=[],low=[],discarded=[];
    for(const detection of (input||[])){
      if(!detection||typeof detection!=='object'){ discarded.push(detection); continue; }
      const score=Math.max(0,Math.min(1,finite(detection.score,0)));
      const item={...detection,score};
      if(score>=cfg.highScoreThreshold)high.push(item);
      else if(score>=cfg.lowScoreThreshold)low.push(item);
      else discarded.push(item);
    }
    const byScore=(a,b)=>(b.score||0)-(a.score||0);
    high.sort(byScore); low.sort(byScore);
    return {high,low,discarded,config:cfg};
  }
  function eligibleForNewTrack(detection,options){
    const cfg=normalizeThresholds(options);
    return !!detection&&finite(detection.score,0)>=cfg.highScoreThreshold;
  }
  function recoveryThreshold(baseThreshold,options){
    const cfg=normalizeThresholds(options);
    return Math.max(0,finite(baseThreshold,.50)*cfg.recoveryCostMultiplier);
  }
  function summary(split){
    const s=split||{};
    return {high:(s.high||[]).length,low:(s.low||[]).length,discarded:(s.discarded||[]).length};
  }
  return {normalizeThresholds,splitDetections,eligibleForNewTrack,recoveryThreshold,summary};
});
