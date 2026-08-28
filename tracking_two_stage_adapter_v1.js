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
  function confirmationThreshold(opts){
    const raw=Number(opts&&opts.minimumConsecutiveFrames);
    return Math.max(1,Math.min(5,Number.isFinite(raw)?Math.round(raw):2));
  }
  function applyConfirmation(state,highAssigned,newAssigned,survivors,time,opts){
    const minFrames=confirmationThreshold(opts),frameIndex=(state.cayConfirmationFrameIndex||0)+1;
    state.cayConfirmationFrameIndex=frameIndex;
    if(minFrames<=1){
      for(const tr of survivors||[])if(tr)tr.cayIdentityConfirmed=true;
      state.cayTentativeSuppressed=state.cayTentativeSuppressed||0;
      return {minFrames,confirmedIds:new Set((survivors||[]).filter(Boolean).map(tr=>tr.globalId)),suppressed:0};
    }
    const strongItems=[...(highAssigned||[]),...(newAssigned||[])];
    const strongById=new Map(strongItems.filter(x=>x&&x.track).map(x=>[x.track.globalId,x]));
    const confirmedIds=new Set();
    for(const tr of survivors||[]){
      if(!tr)continue;
      if(tr.cayIdentityConfirmed===true){confirmedIds.add(tr.globalId);continue;}
      if(tr.cayIdentityConfirmed==null&&Number(tr.seen)>=minFrames&&tr.cayLastStrongFrame==null){
        tr.cayIdentityConfirmed=true;tr.cayConfirmedAt=Number(time);confirmedIds.add(tr.globalId);continue;
      }
      const item=strongById.get(tr.globalId);
      if(!item){tr.cayStrongStreak=0;continue;}
      if(tr.cayIdentityConfirmed==null)tr.cayIdentityConfirmed=false;
      const reappeared=item.reidentified===true;
      const consecutive=!reappeared&&Number(tr.cayLastStrongFrame)===frameIndex-1;
      tr.cayStrongStreak=consecutive?Math.max(1,Number(tr.cayStrongStreak)||0)+1:1;
      tr.cayLastStrongFrame=frameIndex;
      if(tr.cayStrongStreak>=minFrames){
        tr.cayIdentityConfirmed=true;tr.cayConfirmedAt=Number(time);confirmedIds.add(tr.globalId);
      }
    }
    const suppressed=strongItems.filter(x=>x&&x.track&&!confirmedIds.has(x.track.globalId)).length;
    state.cayTentativeSuppressed=(state.cayTentativeSuppressed||0)+suppressed;
    state.cayMinimumConsecutiveFrames=minFrames;
    return {minFrames,confirmedIds,suppressed};
  }
  function assignFrame(state,detections,time,options){
    requireDeps();
    const opts=options||{},maxPlayers=Math.max(1,Math.min(11,Number(opts.maxPlayers)||11));
    const split=Cascade.splitDetections(detections,opts);
    const high=split.high.map((d,i)=>marker(d,i,'H'));
    const low=split.low.map((d,i)=>marker(d,i,'L'));
    const missedBeforeHigh=new Map((state.active||[]).map(tr=>[tr.globalId,Number(tr.missed)||0]));
    const highAssigned=coreAssign(state,high,time,{...opts,maxPlayers,allowNew:false,reidentifyArchived:false,lostAfter:999999});
    const highIds=new Set(highAssigned.map(a=>a.trackId));
    const usedHighKeys=new Set(highAssigned.map(a=>a._cayCascadeKey).filter(Boolean));
    const protectedTracks=state.active.filter(tr=>highIds.has(tr.globalId));
    const recoveryTracks=state.active.filter(tr=>!highIds.has(tr.globalId));
    for(const tr of recoveryTracks)tr.missed=missedBeforeHigh.get(tr.globalId)||0;
    const recoverySlots=Math.max(0,maxPlayers-highAssigned.length);
    state.active=recoveryTracks;
    let lowAssigned=[];
    if(recoverySlots>0&&low.length){
      lowAssigned=coreAssign(state,low,time,{
        ...opts,maxPlayers:recoverySlots,allowNew:false,reidentifyArchived:false,lostAfter:999999,
        baseThreshold:Cascade.recoveryThreshold(Number.isFinite(Number(opts.baseThreshold))?Number(opts.baseThreshold):.50,opts)
      });
    }else{
      for(const tr of state.active)tr.missed=(missedBeforeHigh.get(tr.globalId)||0)+1;
    }
    let survivors=uniqueByTrackId([...state.active,...protectedTracks].map(track=>({trackId:track.globalId,track}))).map(x=>x.track);
    const remainingSlots=Math.max(0,maxPlayers-survivors.length);
    const remainingHigh=high.filter(d=>!usedHighKeys.has(d._cayCascadeKey));
    let newAssigned=[];
    if(remainingSlots>0&&remainingHigh.length&&opts.allowNew!==false){
      state.active=[];
      newAssigned=coreAssign(state,remainingHigh,time,{...opts,maxPlayers:remainingSlots,allowNew:true,lostAfter:999999});
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
    const confirmation=applyConfirmation(state,highAssigned,newAssigned,state.active,time,opts);
    const assignedRaw=uniqueByTrackId([...highAssigned,...lowAssigned,...newAssigned]).slice(0,maxPlayers);
    const assigned=assignedRaw.filter(item=>confirmation.minFrames<=1||item?.track?.cayIdentityConfirmed===true).map(stripMarker);
    state.maxVisible=Math.max(state.maxVisible||0,assigned.length);
    state.byteTrackLowScoreRecoveries=(state.byteTrackLowScoreRecoveries||0)+lowAssigned.length;
    state.byteTrackWeakDiscarded=(state.byteTrackWeakDiscarded||0)+(split.discarded||[]).length;
    if(assigned.length>maxPlayers)throw new Error('invariant violé: capacité CAY simultanée dépassée');
    return {assigned,split,highAssigned:highAssigned.map(stripMarker),lowAssigned:lowAssigned.map(stripMarker),newAssigned:newAssigned.map(stripMarker),confirmation:{minimumConsecutiveFrames:confirmation.minFrames,tentativeSuppressed:confirmation.suppressed}};
  }
  return {assignFrame,uniqueByTrackId,confirmationThreshold};
});