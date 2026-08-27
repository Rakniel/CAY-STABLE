(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./tracking_core_v1.js') : root.CAYTrackingCore,
    typeof module==='object'&&module.exports ? require('./tracking_confidence_cascade_v1.js') : root.CAYTrackingConfidenceCascade
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingTwoStageAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Cascade){
  'use strict';
  const coreAssign=Core&&typeof Core.assignFrame==='function'?Core.assignFrame.bind(Core):null;
  function requireDeps(){
    if(!Core||!coreAssign)throw new Error('CAYTrackingCore indisponible');
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
  function marker(item,index,prefix){ return {...item,_cayCascadeKey:prefix+index}; }
  function stripMarker(item){
    if(!item||typeof item!=='object')return item;
    const {_cayCascadeKey,...clean}=item;
    return clean;
  }
  function assignFrame(state,detections,time,options){
    requireDeps();
    const opts=options||{},maxPlayers=Math.max(1,Math.min(11,Number(opts.maxPlayers)||11));
    const split=Cascade.splitDetections(detections,opts);
    const high=split.high.map((d,i)=>marker(d,i,'H'));
    const low=split.low.map((d,i)=>marker(d,i,'L'));

    // Stage 1: strong detections update existing tracks first; no new identity is created yet.
    const highAssigned=coreAssign(state,high,time,{...opts,maxPlayers,allowNew:false,reidentifyArchived:false,lostAfter:999999});
    const highIds=new Set(highAssigned.map(a=>a.trackId));
    const usedHighKeys=new Set(highAssigned.map(a=>a._cayCascadeKey).filter(Boolean));
    const protectedTracks=state.active.filter(tr=>highIds.has(tr.globalId));
    const recoveryTracks=state.active.filter(tr=>!highIds.has(tr.globalId));
    const missedAfterHigh=new Map(recoveryTracks.map(tr=>[tr.globalId,tr.missed]));

    // Stage 2: weak detections can recover only an existing unmatched track.
    const recoverySlots=Math.max(0,maxPlayers-highAssigned.length);
    state.active=recoveryTracks;
    const lowAssigned=recoverySlots>0&&low.length?coreAssign(state,low,time,{
      ...opts,
      maxPlayers:recoverySlots,
      allowNew:false,
      reidentifyArchived:false,
      lostAfter:999999,
      baseThreshold:Cascade.recoveryThreshold(Number.isFinite(Number(opts.baseThreshold))?Number(opts.baseThreshold):.50,opts)
    }):[];
    const lowMatchedIds=new Set(lowAssigned.map(a=>a.trackId));
    for(const tr of state.active){
      if(!lowMatchedIds.has(tr.globalId)&&missedAfterHigh.has(tr.globalId))tr.missed=missedAfterHigh.get(tr.globalId);
    }
    let survivors=uniqueByTrackId([...state.active,...protectedTracks].map(track=>({trackId:track.globalId,track}))).map(x=>x.track);

    // New/reidentified IDs are considered only from unused HIGH detections and only if the
    // still-alive roster leaves a real on-field slot. This avoids replacing a briefly missed
    // player with a false high-confidence detection while preserving the 11-player invariant.
    const remainingSlots=Math.max(0,maxPlayers-survivors.length);
    const remainingHigh=high.filter(d=>!usedHighKeys.has(d._cayCascadeKey));
    let newAssigned=[];
    if(remainingSlots>0&&remainingHigh.length&&opts.allowNew!==false){
      state.active=[];
      newAssigned=coreAssign(state,remainingHigh,time,{
        ...opts,
        maxPlayers:remainingSlots,
        allowNew:true,
        lostAfter:999999
      });
      const createdOrReidentified=[...state.active];
      survivors=uniqueByTrackId([...survivors,...createdOrReidentified].map(track=>({trackId:track.globalId,track}))).map(x=>x.track);
    }

    const lostAfter=Number.isFinite(Number(opts.lostAfter))?Number(opts.lostAfter):8,keep=[];
    for(const tr of survivors){
      if((tr.missed||0)>lostAfter){
        if(!tr.archived){tr.archived=true;tr.exitReason='lost';state.archive.push(tr);}
      }else keep.push(tr);
    }
    state.active=keep;

    const assigned=uniqueByTrackId([...highAssigned,...lowAssigned,...newAssigned]).slice(0,maxPlayers).map(stripMarker);
    state.maxVisible=Math.max(state.maxVisible||0,assigned.length);
    state.byteTrackLowScoreRecoveries=(state.byteTrackLowScoreRecoveries||0)+lowAssigned.length;
    state.byteTrackWeakDiscarded=(state.byteTrackWeakDiscarded||0)+(split.discarded||[]).length;
    if(assigned.length>maxPlayers)throw new Error('invariant violé: capacité CAY simultanée dépassée');
    return {assigned,split,highAssigned:highAssigned.map(stripMarker),lowAssigned:lowAssigned.map(stripMarker),newAssigned:newAssigned.map(stripMarker)};
  }
  return {assignFrame,uniqueByTrackId};
});