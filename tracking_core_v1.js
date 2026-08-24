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
    return {nextGlobalId:1,segment:1,segments:1,active:[],archive:[],created:0,totalMatches:0,maxVisible:0,skippedWeak:0};
  }
  function archiveTrack(state,tr,reason){
    if(tr.archived)return;
    tr.archived=true; tr.exitReason=reason||'lost'; state.archive.push(tr);
  }
  function startSegment(state,reason){
    for(const tr of state.active)archiveTrack(state,tr,reason||'camera_cut');
    state.active=[]; state.segment++; state.segments++;
  }
  function newTrack(state,d,t){
    const p={x:clamp01(d.x),y:clamp01(d.y),time:t,segment:state.segment};
    const tr={
      globalId:state.nextGlobalId++,segment:state.segment,cat:d.cat||'team',feature:d.feature||null,
      x:p.x,y:p.y,missed:0,seen:1,firstTime:t,lastTime:t,archived:false,exitReason:null,
      motionHistory:[p],fullPath:[p],confidenceSamples:[Number.isFinite(d.score)?d.score:null].filter(v=>v!==null)
    };
    state.active.push(tr); state.created++; return tr;
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
      const point={x:d.x,y:d.y,time:t,segment:state.segment};
      tr.x=d.x;tr.y=d.y;tr.cat=d.cat||tr.cat;tr.feature=d.feature||tr.feature;tr.missed=0;tr.seen++;tr.lastTime=t;
      tr.motionHistory.push(point); if(tr.motionHistory.length>30)tr.motionHistory.shift();
      tr.fullPath.push(point);
      if(Number.isFinite(d.score))tr.confidenceSamples.push(d.score);
      assigned.push({...d,trackId:tr.globalId,track:tr}); state.totalMatches++;
    }
    for(let i=0;i<state.active.length;i++)if(!usedT.has(i))state.active[i].missed++;
    if(opts.allowNew!==false){
      for(let di=0;di<dets.length;di++)if(!usedD.has(di)){
        const tr=newTrack(state,dets[di],t); assigned.push({...dets[di],trackId:tr.globalId,track:tr});
      }
    } else state.skippedWeak+=dets.filter((_,i)=>!usedD.has(i)).length;
    const keep=[];
    for(const tr of state.active){ if(tr.missed>lostAfter)archiveTrack(state,tr,'lost'); else keep.push(tr); }
    state.active=keep;
    state.maxVisible=Math.max(state.maxVisible,assigned.length);
    return assigned;
  }
  function summarizeTrack(tr){
    let travel=0; for(let i=1;i<tr.fullPath.length;i++)travel+=dist(tr.fullPath[i-1],tr.fullPath[i]);
    const scores=tr.confidenceSamples||[];
    const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null;
    return {
      id:tr.globalId,segment:tr.segment,cat:tr.cat,observations:tr.seen,pathPoints:tr.fullPath.length,
      firstTime:+tr.firstTime.toFixed(3),lastTime:+tr.lastTime.toFixed(3),observedSpan:+Math.max(0,tr.lastTime-tr.firstTime).toFixed(3),
      normalizedTravel:+travel.toFixed(6),identityConfidence:avg===null?null:+avg.toFixed(4),exitReason:tr.exitReason||null,
      quality:tr.seen>=10?'FIABLE':'PARTIEL'
    };
  }
  function summary(state){
    const all=[...state.archive,...state.active];
    const unique=new Map(); for(const tr of all)unique.set(tr.globalId,tr);
    const tracks=[...unique.values()].map(summarizeTrack).sort((a,b)=>a.id-b.id);
    return {segments:state.segments,rosterTotal:tracks.length,maxVisible:state.maxVisible,totalAssociations:state.totalMatches,tracks};
  }
  return {createState,startSegment,assignFrame,summary,matchCost};
});
