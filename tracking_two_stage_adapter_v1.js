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
  function featureDistance(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length)return .45;
    let sum=0;
    for(let i=0;i<a.length;i++){
      const delta=(Number(a[i])||0)-(Number(b[i])||0);
      sum+=delta*delta;
    }
    return Math.min(1.2,Math.sqrt(sum/a.length));
  }
  function predictedPoint(track,time){
    const history=Array.isArray(track&&track.motionHistory)?track.motionHistory:[];
    const last=history[history.length-1]||{x:Number(track&&track.x)||0,y:Number(track&&track.y)||0,time:Number(time)||0};
    if(history.length<2)return {x:last.x,y:last.y};
    const prev=history[history.length-2],dt=Math.max(.1,Number(last.time)-Number(prev.time));
    const horizon=Math.max(0,Number(time)-Number(last.time));
    return {x:Number(last.x)+(Number(last.x)-Number(prev.x))/dt*horizon,y:Number(last.y)+(Number(last.y)-Number(prev.y))/dt*horizon};
  }
  function associationPreselectionCost(track,detection,time){
    const p=predictedPoint(track,time);
    const dx=(Number(p.x)||0)-(Number(detection&&detection.x)||0),dy=(Number(p.y)||0)-(Number(detection&&detection.y)||0);
    const spatial=Math.hypot(dx,dy);
    const appearance=featureDistance(track&&track.feature,detection&&detection.feature);
    const trackCat=(track&&track.cat)||'team',detCat=(detection&&detection.cat)||'team';
    const categoryPenalty=trackCat===detCat?0:((trackCat==='goalkeeper'||detCat==='goalkeeper')?.55:.16);
    return spatial*2.65+appearance*.60+categoryPenalty;
  }
  function preselectAssociationCandidates(state,detections,time,maxPlayers,opts){
    const items=[...(detections||[])];
    if(items.length<=maxPlayers)return items;
    const active=(state&&Array.isArray(state.active)?state.active:[]).filter(tr=>tr&&!tr.archived);
    if(!active.length)return items.slice(0,maxPlayers);
    const threshold=Number.isFinite(Number(opts&&opts.associationPreselectionThreshold))?Math.max(.1,Number(opts.associationPreselectionThreshold)):.72;
    const remaining=new Set(items.map((_,index)=>index)),selected=[];
    const trackOrder=[...active].sort((a,b)=>(Number(a.missed)||0)-(Number(b.missed)||0)||(Number(b.seen)||0)-(Number(a.seen)||0));
    for(const tr of trackOrder){
      if(selected.length>=maxPlayers)break;
      let bestIndex=-1,bestCost=Infinity;
      for(const index of remaining){
        const cost=associationPreselectionCost(tr,items[index],time);
        if(cost<bestCost){bestCost=cost;bestIndex=index;}
      }
      if(bestIndex>=0&&bestCost<=threshold){
        selected.push(items[bestIndex]);
        remaining.delete(bestIndex);
      }
    }
    if(selected.length<maxPlayers){
      const fill=[...remaining].map(index=>items[index]).sort((a,b)=>{
        if(a.cat!==b.cat)return a.cat==='goalkeeper'?-1:1;
        return (Number(b.score)||0)-(Number(a.score)||0);
      });
      selected.push(...fill.slice(0,maxPlayers-selected.length));
    }
    return selected.slice(0,maxPlayers);
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
    const highAssociation=preselectAssociationCandidates(state,high,time,maxPlayers,opts);
    const missedBeforeHigh=new Map((state.active||[]).map(tr=>[tr.globalId,Number(tr.missed)||0]));
    const highAssigned=coreAssign(state,highAssociation,time,{...opts,maxPlayers,allowNew:false,reidentifyArchived:false,lostAfter:999999});
    const highIds=new Set(highAssigned.map(a=>a.trackId));
    const usedHighKeys=new Set(highAssigned.map(a=>a._cayCascadeKey).filter(Boolean));
    const protectedTracks=state.active.filter(tr=>highIds.has(tr.globalId));
    const recoveryTracks=state.active.filter(tr=>!highIds.has(tr.globalId));
    for(const tr of recoveryTracks)tr.missed=missedBeforeHigh.get(tr.globalId)||0;
    const recoverySlots=Math.max(0,maxPlayers-highAssigned.length);
    state.active=recoveryTracks;
    let lowAssigned=[];
    if(recoverySlots>0&&low.length){
      const lowAssociation=preselectAssociationCandidates(state,low,time,recoverySlots,opts);
      lowAssigned=coreAssign(state,lowAssociation,time,{
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
    state.byteTrackPreselectionOverflow=(state.byteTrackPreselectionOverflow||0)+Math.max(0,high.length-maxPlayers);
    if(assigned.length>maxPlayers)throw new Error('invariant violé: capacité CAY simultanée dépassée');
    return {assigned,split,highAssigned:highAssigned.map(stripMarker),lowAssigned:lowAssigned.map(stripMarker),newAssigned:newAssigned.map(stripMarker),confirmation:{minimumConsecutiveFrames:confirmation.minFrames,tentativeSuppressed:confirmation.suppressed}};
  }
  return {assignFrame,uniqueByTrackId,confirmationThreshold,preselectAssociationCandidates};
});