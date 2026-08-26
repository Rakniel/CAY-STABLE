(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./tracking_core_v1.js') : root.CAYTrackingCore,
    typeof module==='object'&&module.exports ? require('./tracking_confidence_cascade_v1.js') : root.CAYTrackingConfidenceCascade
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingTwoStageAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cascade){
  'use strict';
  function requireDeps(){
    if(!Core||typeof Core.assignFrame!=='function')throw new Error('CAYTrackingCore indisponible');
    if(!Cascade||typeof Cascade.splitDetections!=='function')throw new Error('CAYTrackingConfidenceCascade indisponible');
  }
  function uniqueByTrackId(items){
    const seen=new Set(),out=[];
    for(const item of items||[]){
      if(!item||seen.has(item.trackId))continue;
      seen.add(item.trackId);out.push(item);
    }
    return out;
  }
  function assignFrame(state,detections,time,options){
    requireDeps();
    const opts=options||{};
    const split=Cascade.splitDetections(detections,opts);
    const highAssigned=Core.assignFrame(state,split.high,time,{...opts,allowNew:opts.allowNew!==false});
    if(!split.low.length)return {assigned:highAssigned,split,highAssigned,lowAssigned:[]};

    const protectedIds=new Set(highAssigned.map(a=>a.trackId));
    const protectedTracks=state.active.filter(tr=>protectedIds.has(tr.globalId));
    const recoveryTracks=state.active.filter(tr=>!protectedIds.has(tr.globalId));
    const missedAfterHigh=new Map(recoveryTracks.map(tr=>[tr.globalId,tr.missed]));

    state.active=recoveryTracks;
    const lowAssigned=Core.assignFrame(state,split.low,time,{
      ...opts,
      allowNew:false,
      reidentifyArchived:false,
      lostAfter:Math.max(9999,Number(opts.lostAfter)||8),
      baseThreshold:Cascade.recoveryThreshold(Number.isFinite(Number(opts.baseThreshold))?Number(opts.baseThreshold):.50,opts)
    });
    const lowMatchedIds=new Set(lowAssigned.map(a=>a.trackId));
    for(const tr of state.active){
      if(!lowMatchedIds.has(tr.globalId)&&missedAfterHigh.has(tr.globalId))tr.missed=missedAfterHigh.get(tr.globalId);
    }
    state.active=uniqueByTrackId([...state.active,...protectedTracks].map(track=>({trackId:track.globalId,track}))).map(x=>x.track);
    const assigned=uniqueByTrackId([...highAssigned,...lowAssigned]);
    state.maxVisible=Math.max(state.maxVisible||0,assigned.length);
    return {assigned,split,highAssigned,lowAssigned};
  }
  return {assignFrame,uniqueByTrackId};
});
