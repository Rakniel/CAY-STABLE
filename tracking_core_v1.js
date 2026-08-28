(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const dist=(a,b)=>Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));
  function appearanceDistance(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||!a.length||a.length!==b.length)return .45;
    let s=0; for(let i=0;i<a.length;i++){ const d=(Number(a[i])||0)-(Number(b[i])||0); s+=d*d; }
    return Math.min(1.2,Math.sqrt(s/a.length));
  }
  function velocity(track){
    const h=track.motionHistory;
    if(h.length<2)return {x:0,y:0};
    const a=h[h.length-2],b=h[h.length-1],dt=Math.max(.1,b.time-a.time);
    return {x:(b.x-a.x)/dt,y:(b.y-a.y)/dt};
  }
  function prediction(track,t){
    const last=track.motionHistory[track.motionHistory.length-1]||{x:track.x,y:track.y,time:t};
    const v=velocity(track),dt=Math.max(0,t-last.time);
    return {x:last.x+v.x*dt,y:last.y+v.y*dt};
  }
  function matchCost(track,d,t){
    const spatial=dist(prediction(track,t),d);
    const appearance=appearanceDistance(track.feature,d.feature);
    const catPenalty=track.cat===d.cat?0:((track.cat==='goalkeeper'||d.cat==='goalkeeper')?.55:.16);
    return spatial*2.65+appearance*.60+catPenalty+Math.min(.25,track.missed*.05);
  }
  function createState(){
    return {nextGlobalId:1,segment:1,segments:1,active:[],archive:[],created:0,totalMatches:0,maxVisible:0,skippedWeak:0,reidentified:0,manualMerges:0,reidRejectedAmbiguous:0,reidRejectedStale:0,reidRejectedLowScore:0};
  }
  function archiveTrack(state,tr,reason){
    if(tr.archived)return;
    tr.archived=true; tr.exitReason=reason||'lost'; state.archive.push(tr);
  }
  function startSegment(state,reason){
    for(const tr of state.active)archiveTrack(state,tr,reason||'camera_cut');
    state.active=[]; state.segment++; state.segments++;
  }
  function pointFor(state,d,t){ return {x:clamp01(d.x),y:clamp01(d.y),time:t,segment:state.segment}; }
  function recordObservation(tr,p,score){
    const prev=tr.fullPath[tr.fullPath.length-1]||null;
    tr.x=p.x; tr.y=p.y; tr.missed=0; tr.seen++; tr.lastTime=p.time;
    tr.motionHistory.push(p); if(tr.motionHistory.length>30)tr.motionHistory.shift();
    tr.fullPath.push(p);
    if(Number.isFinite(score))tr.confidenceSamples.push(score);
    if(prev&&prev.segment===p.segment){
      const dt=Math.max(0,p.time-prev.time);
      if(dt<=3)tr.observedDuration=(tr.observedDuration||0)+dt;
    }
    const lastInterval=tr.presenceIntervals[tr.presenceIntervals.length-1];
    if(lastInterval&&lastInterval.segment===p.segment&&p.time-lastInterval.end<=3){
      lastInterval.end=p.time; lastInterval.observations++;
    }else{
      tr.presenceIntervals.push({segment:p.segment,start:p.time,end:p.time,observations:1});
    }
  }
  function newTrack(state,d,t){
    const p=pointFor(state,d,t);
    const tr={
      globalId:state.nextGlobalId++,segment:state.segment,segmentsSeen:[state.segment],cat:d.cat||'team',feature:d.feature||null,
      x:p.x,y:p.y,missed:0,seen:0,firstTime:t,lastTime:t,archived:false,exitReason:null,
      motionHistory:[],fullPath:[],confidenceSamples:[],presenceIntervals:[],observedDuration:0,
      reidentifications:0,mergedFrom:[]
    };
    recordObservation(tr,p,d.score);
    state.active.push(tr); state.created++; return tr;
  }
  function reidCandidateScore(tr,d,t,opts,appearance,gap){
    const threshold=Math.max(.0001,Number.isFinite(opts.reidAppearanceThreshold)?opts.reidAppearanceThreshold:.10);
    const maxGap=Math.max(1,Number.isFinite(opts.maxReidGap)?opts.maxReidGap:180);
    const sameSegment=tr.segment===opts.currentSegment;
    const appearanceStrength=clamp01(1-appearance/threshold);
    let spatialStrength=.55;
    if(sameSegment){
      const radius=Math.min(.80,.18+Math.max(0,gap)*.12);
      spatialStrength=clamp01(1-dist(prediction(tr,t),d)/Math.max(.08,radius));
    }
    const historyStrength=clamp01((tr.seen||0)/8);
    const detectionStrength=clamp01(d.score);
    const temporalStrength=clamp01(1-gap/maxGap);
    const segmentStrength=sameSegment?1:.72;
    return clamp01(.62*appearanceStrength+.14*spatialStrength+.08*historyStrength+.08*detectionStrength+.05*temporalStrength+.03*segmentStrength);
  }
  function reidentifyArchived(state,d,t,opts){
    if(opts.reidentifyArchived!==true)return null;
    const threshold=Number.isFinite(opts.reidAppearanceThreshold)?opts.reidAppearanceThreshold:.10;
    const minSameSegmentGap=Number.isFinite(opts.minSameSegmentReidGap)?Math.max(0,opts.minSameSegmentReidGap):2;
    const maxGap=Number.isFinite(opts.maxReidGap)?Math.max(minSameSegmentGap,opts.maxReidGap):180;
    const minScore=Number.isFinite(opts.reidScoreThreshold)?clamp01(opts.reidScoreThreshold):.78;
    const uniquenessMargin=Number.isFinite(opts.reidScoreUniquenessMargin)?Math.max(0,opts.reidScoreUniquenessMargin):.035;
    const candidates=[];
    for(let i=0;i<state.archive.length;i++){
      const tr=state.archive[i];
      if(!tr||tr.cat!==(d.cat||'team'))continue;
      const gap=Math.max(0,t-tr.lastTime);
      if(gap>maxGap){ state.reidRejectedStale++; continue; }
      if(tr.segment===state.segment&&gap<minSameSegmentGap)continue;
      const appearance=appearanceDistance(tr.feature,d.feature);
      if(appearance>threshold)continue;
      const score=reidCandidateScore(tr,d,t,{...opts,currentSegment:state.segment},appearance,gap);
      candidates.push({i,tr,appearance,gap,score});
    }
    candidates.sort((a,b)=>b.score-a.score || a.appearance-b.appearance || a.gap-b.gap || b.tr.lastTime-a.tr.lastTime);
    if(!candidates.length)return null;
    const best=candidates[0],second=candidates[1]||null;
    if(best.score<minScore){ state.reidRejectedLowScore++; return null; }
    if(second&&best.score-second.score<uniquenessMargin){
      state.reidRejectedAmbiguous++;
      return null;
    }
    const tr=best.tr;
    state.archive.splice(best.i,1);
    const p=pointFor(state,d,t);
    tr.archived=false; tr.exitReason=null; tr.segment=state.segment;
    if(!tr.segmentsSeen.includes(state.segment))tr.segmentsSeen.push(state.segment);
    tr.feature=d.feature||tr.feature; tr.motionHistory=[];
    recordObservation(tr,p,d.score);
    tr.reidentifications=(tr.reidentifications||0)+1;
    tr.lastReidScore=best.score;
    tr.lastReidEvidence={appearance:+best.appearance.toFixed(6),gap:+best.gap.toFixed(3),score:+best.score.toFixed(4),segment:state.segment};
    state.active.push(tr); state.reidentified++;
    return tr;
  }
  function assignFrame(state,inputDetections,t,opts){
    opts=opts||{};
    const maxPlayers=Math.max(1,Math.min(11,opts.maxPlayers||11));
    const lostAfter=Number.isFinite(opts.lostAfter)?opts.lostAfter:8;
    const dets=[...(inputDetections||[])].map(d=>({...d,x:clamp01(d.x),y:clamp01(d.y)}))
      .sort((a,b)=>{ if(a.cat!==b.cat)return a.cat==='goalkeeper'?-1:1; return (b.score||0)-(a.score||0); })
      .slice(0,maxPlayers);
    const pairs=[];
    for(let ti=0;ti<state.active.length;ti++){
      const tr=state.active[ti]; if(tr.missed>lostAfter)continue;
      for(let di=0;di<dets.length;di++){
        const cost=matchCost(tr,dets[di],t);
        const last=tr.motionHistory[tr.motionHistory.length-1],dt=last?Math.max(1,t-last.time):1;
        const threshold=(opts.baseThreshold||.50)+Math.min(.34,dt*.045);
        if(cost<=threshold)pairs.push({ti,di,cost});
      }
    }
    pairs.sort((a,b)=>a.cost-b.cost);
    const usedT=new Set(),usedD=new Set(),assigned=[];
    for(const p of pairs){
      if(usedT.has(p.ti)||usedD.has(p.di))continue;
      const tr=state.active[p.ti],d=dets[p.di]; usedT.add(p.ti);usedD.add(p.di);
      const point=pointFor(state,d,t);
      tr.cat=d.cat||tr.cat;tr.feature=d.feature||tr.feature;
      recordObservation(tr,point,d.score);
      assigned.push({...d,trackId:tr.globalId,track:tr,reidentified:false}); state.totalMatches++;
    }
    for(let i=0;i<state.active.length;i++)if(!usedT.has(i))state.active[i].missed++;
    if(opts.allowNew!==false){
      for(let di=0;di<dets.length;di++)if(!usedD.has(di)){
        const d=dets[di];
        const tr=reidentifyArchived(state,d,t,opts)||newTrack(state,d,t);
        assigned.push({...d,trackId:tr.globalId,track:tr,reidentified:(tr.reidentifications||0)>0});
      }
    } else state.skippedWeak+=dets.filter((_,i)=>!usedD.has(i)).length;
    const keep=[];
    for(const tr of state.active){ if(tr.missed>lostAfter)archiveTrack(state,tr,'lost'); else keep.push(tr); }
    state.active=keep;
    state.maxVisible=Math.max(state.maxVisible,assigned.length);
    return assigned;
  }
  function allUniqueTracks(state){
    const unique=new Map();
    for(const tr of [...state.archive,...state.active])unique.set(tr.globalId,tr);
    return [...unique.values()];
  }
  function simultaneousConflict(a,b){
    const bySegment=new Map();
    for(const p of a.fullPath||[]){ if(!bySegment.has(p.segment))bySegment.set(p.segment,[]); bySegment.get(p.segment).push(p.time); }
    for(const p of b.fullPath||[]){
      const times=bySegment.get(p.segment); if(!times)continue;
      if(times.some(t=>Math.abs(t-p.time)<=.05))return true;
    }
    return false;
  }
  function mergeTracks(state,targetId,sourceId){
    if(targetId===sourceId)throw new Error('IDs identiques');
    const tracks=allUniqueTracks(state);
    const target=tracks.find(t=>t.globalId===targetId),source=tracks.find(t=>t.globalId===sourceId);
    if(!target||!source)throw new Error('ID introuvable');
    if(target.cat!==source.cat)throw new Error('catégories incompatibles');
    if(simultaneousConflict(target,source))throw new Error('fusion refusée: IDs simultanés sur une même image');
    const targetWasActive=state.active.includes(target),sourceWasActive=state.active.includes(source);
    const freshest=(source.lastTime||0)>(target.lastTime||0)?source:target;
    target.fullPath=[...(target.fullPath||[]),...(source.fullPath||[])].sort((a,b)=>a.time-b.time||a.segment-b.segment);
    target.confidenceSamples=[...(target.confidenceSamples||[]),...(source.confidenceSamples||[])];
    target.presenceIntervals=[...(target.presenceIntervals||[]),...(source.presenceIntervals||[])].sort((a,b)=>a.start-b.start||a.segment-b.segment);
    target.segmentsSeen=[...new Set([...(target.segmentsSeen||[]),...(source.segmentsSeen||[])])].sort((a,b)=>a-b);
    target.firstTime=Math.min(target.firstTime,source.firstTime); target.lastTime=Math.max(target.lastTime,source.lastTime);
    target.seen=(target.seen||0)+(source.seen||0); target.observedDuration=(target.observedDuration||0)+(source.observedDuration||0);
    target.reidentifications=(target.reidentifications||0)+(source.reidentifications||0);
    target.mergedFrom=[...new Set([...(target.mergedFrom||[]),source.globalId,...(source.mergedFrom||[])])];
    target.x=freshest.x; target.y=freshest.y; target.segment=freshest.segment; target.feature=freshest.feature||target.feature;
    target.missed=freshest.missed||0; target.motionHistory=target.fullPath.filter(p=>p.segment===target.segment).slice(-30);
    const removeAll=arr=>{ for(let i=arr.length-1;i>=0;i--)if(arr[i]===target||arr[i]===source||arr[i].globalId===sourceId)arr.splice(i,1); };
    removeAll(state.archive); removeAll(state.active);
    if(targetWasActive||sourceWasActive){ target.archived=false; target.exitReason=null; state.active.push(target); }
    else { target.archived=true; target.exitReason=freshest.exitReason||target.exitReason||source.exitReason||'merged'; state.archive.push(target); }
    state.manualMerges=(state.manualMerges||0)+1;
    return target;
  }
  function segmentStats(tr){
    const map=new Map();
    for(const p of tr.fullPath||[]){
      if(!map.has(p.segment))map.set(p.segment,{segment:p.segment,observations:0,normalizedTravel:0,firstTime:p.time,lastTime:p.time});
      const s=map.get(p.segment); s.observations++; s.firstTime=Math.min(s.firstTime,p.time); s.lastTime=Math.max(s.lastTime,p.time);
    }
    for(let i=1;i<(tr.fullPath||[]).length;i++){
      const a=tr.fullPath[i-1],b=tr.fullPath[i]; if(a.segment===b.segment)map.get(a.segment).normalizedTravel+=dist(a,b);
    }
    return [...map.values()].map(s=>({...s,normalizedTravel:+s.normalizedTravel.toFixed(6),observedSpan:+Math.max(0,s.lastTime-s.firstTime).toFixed(3)}));
  }
  function summarizeTrack(tr){
    let travel=0;
    for(let i=1;i<tr.fullPath.length;i++){
      const a=tr.fullPath[i-1],b=tr.fullPath[i]; if(a.segment===b.segment)travel+=dist(a,b);
    }
    const scores=tr.confidenceSamples||[];
    const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
    const quality=tr.seen>=10?'FIABLE':'PARTIEL';
    return {
      id:tr.globalId,segments:[...(tr.segmentsSeen||[tr.segment])],cat:tr.cat,observations:tr.seen,pathPoints:tr.fullPath.length,
      firstTime:+tr.firstTime.toFixed(3),lastTime:+tr.lastTime.toFixed(3),observedSpan:+Math.max(0,tr.lastTime-tr.firstTime).toFixed(3),
      observedDuration:+(tr.observedDuration||0).toFixed(3),presenceIntervals:(tr.presenceIntervals||[]).map(x=>({...x})),segmentStats:segmentStats(tr),
      normalizedTravel:+travel.toFixed(6),identityConfidence:avg===null?null:+avg.toFixed(4),exitReason:tr.exitReason||null,
      reidentifications:tr.reidentifications||0,lastReidScore:Number.isFinite(tr.lastReidScore)?+tr.lastReidScore.toFixed(4):null,lastReidEvidence:tr.lastReidEvidence?{...tr.lastReidEvidence}:null,
      mergedFrom:[...(tr.mergedFrom||[])],quality,
      dataQuality:{identity:quality,normalizedMovement:tr.fullPath.length>=2?quality:'INDISPONIBLE',metricDistance:'INDISPONIBLE',metricSpeed:'INDISPONIBLE'},
      unavailableReasons:{metricDistance:'projection terrain métrique non fournie au tracking core',metricSpeed:'projection terrain métrique non fournie au tracking core'}
    };
  }
  function summary(state){
    // Tentative IDs remain internal association state only. Pre-policy tracks (undefined) stay compatible.
    const tracks=allUniqueTracks(state).filter(tr=>tr.cayIdentityConfirmed!==false).map(summarizeTrack).sort((a,b)=>a.id-b.id);
    return {segments:state.segments,rosterTotal:tracks.length,maxVisible:state.maxVisible,totalAssociations:state.totalMatches,reidentified:state.reidentified,manualMerges:state.manualMerges||0,reidRejectedAmbiguous:state.reidRejectedAmbiguous||0,reidRejectedStale:state.reidRejectedStale||0,reidRejectedLowScore:state.reidRejectedLowScore||0,tracks};
  }
  return {createState,startSegment,assignFrame,summary,mergeTracks,matchCost,appearanceDistance,reidCandidateScore};
});