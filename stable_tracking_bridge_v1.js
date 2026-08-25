(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./tracking_core_v1.js') : root.CAYTrackingCore,
    typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStableTrackingBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Stats){
  'use strict';
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  function requireDeps(){
    if(!Core||typeof Core.createState!=='function'||typeof Core.assignFrame!=='function')throw new Error('CAYTrackingCore indisponible');
    if(!Stats||typeof Stats.buildReport!=='function')throw new Error('CAYPlayerStats indisponible');
  }
  function boxAnchor(b){
    if(!b)return null;
    const w=Math.max(1,Number(b.w)||0),h=Math.max(1,Number(b.h)||0),x=Number(b.x)||0,y=Number(b.y)||0;
    return (w/h)>1.05?{x:x+w*.5,y:y+h*.64}:{x:x+w*.5,y:y+h*.96};
  }
  function normalizeDetection(d,width,height){
    if(!d)return null;
    let x=Number(d.x),y=Number(d.y);
    if(!(Number.isFinite(x)&&Number.isFinite(y))){
      const a=boxAnchor(d.b||d.box);
      if(!a||!(width>0&&height>0))return null;
      x=a.x/width;y=a.y/height;
    }
    return {...d,cat:d.cat==='goalkeeper'?'goalkeeper':'team',x:clamp01(x),y:clamp01(y),score:Number.isFinite(Number(d.score))?Number(d.score):0,feature:Array.isArray(d.feature)?d.feature:null};
  }
  function detectionEligibility(d){
    if(!d)return {accepted:false,reason:'invalid_detection'};
    const zone=String(d.sourceZone||d.zone||'').toLowerCase();
    const role=String(d.sceneRole||d.role||'').toLowerCase();
    if(d.onField===false||d.insidePlayableArea===false||d.fieldEligible===false)return {accepted:false,reason:'outside_playable_field'};
    if(d.isBench===true||zone==='bench'||zone==='dugout'||role==='bench')return {accepted:false,reason:'bench'};
    if(d.isSpectator===true||zone==='spectator'||zone==='stands'||role==='spectator')return {accepted:false,reason:'spectator'};
    if(d.yellowDetailOnly===true||d.falseCAYYellowDetail===true)return {accepted:false,reason:'yellow_detail_only'};
    if(d.teamEvidenceValid===false||d.cayEligible===false)return {accepted:false,reason:'team_evidence_rejected'};
    return {accepted:true,reason:null};
  }
  function bindProjectorsToSegments(projectors){
    const supplied=projectors||{},bound={};
    for(const [key,entry] of Object.entries(supplied)){
      const segment=Number(key);
      if(!entry||typeof entry!=='object'){ bound[key]=entry; continue; }
      const declared=Number(entry.segment);
      if(entry.validated===true&&(!Number.isFinite(declared)||declared!==segment))bound[key]={...entry,validated:false,project:null,reason:Number.isFinite(declared)?`calibration liée au segment ${declared}, incompatible avec le segment ${segment}`:`calibration validée sans liaison explicite au segment ${segment}`};
      else bound[key]=entry;
    }
    return bound;
  }
  function create(options){
    requireDeps();
    const opts={maxPlayers:11,lostAfter:8,reidentifyArchived:true,reidAppearanceThreshold:.10,...(options||{})};
    const state=Core.createState();
    let lastTime=null,frames=0,segmentBreaks=0,rejectedDetections=0;
    const rejectedByReason={},timeline=[];
    const segmentMeta=new Map([[state.segment||1,{segment:state.segment||1,start:null,end:null,frames:0,breakReason:'analysis_start',rejectedDetections:0}]]);
    function ensureSegmentMeta(reason){
      const seg=state.segment;
      if(!segmentMeta.has(seg))segmentMeta.set(seg,{segment:seg,start:null,end:null,frames:0,breakReason:reason||'camera_cut',rejectedDetections:0});
      return segmentMeta.get(seg);
    }
    function startSegment(reason,time){
      const why=reason||'camera_cut'; Core.startSegment(state,why); segmentBreaks++; ensureSegmentMeta(why);
      timeline.push({type:'SEGMENT_BREAK',time:Number.isFinite(Number(time))?Number(time):lastTime,segment:state.segment,reason:why});
    }
    function processFrame(input,time,context){
      const ctx=context||{},t=Number(time);
      if(!Number.isFinite(t))throw new Error('temps frame invalide');
      if(lastTime!==null&&t<lastTime)startSegment('timeline_rewind',t);
      if(ctx.segmentBreak===true)startSegment(ctx.segmentReason||'camera_cut',t);
      const width=Number(ctx.width)||0,height=Number(ctx.height)||0,accepted=[],frameRejected=[];
      for(const raw of (input||[])){
        const eligibility=detectionEligibility(raw);
        if(!eligibility.accepted){ frameRejected.push(eligibility.reason); continue; }
        const d=normalizeDetection(raw,width,height); if(d)accepted.push(d); else frameRejected.push('normalization_failed');
      }
      const meta=ensureSegmentMeta();
      for(const reason of frameRejected){ rejectedDetections++; meta.rejectedDetections++; rejectedByReason[reason]=(rejectedByReason[reason]||0)+1; }
      const assigned=Core.assignFrame(state,accepted,t,{maxPlayers:Math.min(11,Math.max(1,Number(ctx.maxPlayers)||opts.maxPlayers)),lostAfter:Number.isFinite(ctx.lostAfter)?ctx.lostAfter:opts.lostAfter,allowNew:ctx.allowNew!==false,reidentifyArchived:ctx.reidentifyArchived!==false&&opts.reidentifyArchived!==false,reidAppearanceThreshold:Number.isFinite(ctx.reidAppearanceThreshold)?ctx.reidAppearanceThreshold:opts.reidAppearanceThreshold,baseThreshold:Number.isFinite(ctx.baseThreshold)?ctx.baseThreshold:opts.baseThreshold});
      const ids=new Set();
      for(const a of assigned){ if(ids.has(a.trackId))throw new Error('invariant violé: ID joueur dupliqué sur une frame'); ids.add(a.trackId); }
      if(assigned.length>11)throw new Error('invariant violé: plus de 11 CAY simultanés');
      if(meta.start===null)meta.start=t; meta.end=t; meta.frames++;
      timeline.push({type:'FRAME',time:t,segment:state.segment,observedPlayers:assigned.length,trackIds:[...ids],rejectedDetections:frameRejected.length,rejectionReasons:[...new Set(frameRejected)]});
      frames++; lastTime=t; return assigned;
    }
    function mergePlayers(targetId,sourceId){ return Core.mergeTracks(state,targetId,sourceId); }
    function summary(){ return Core.summary(state); }
    function provenance(){ return [...segmentMeta.values()].filter(s=>s.frames>0).map(s=>({...s,duration:s.start!==null&&s.end!==null?Math.max(0,s.end-s.start):0})); }
    function report(projectors){
      const supplied=bindProjectorsToSegments(projectors||{}),r=Stats.buildReport(state,Core,supplied);
      const segments=provenance().map(s=>{ const c=typeof Stats.projectorInfo==='function'?Stats.projectorInfo(supplied[s.segment]):{validated:false,source:null,confidence:null,reason:'validation calibration indisponible'}; return {...s,metricProjectionValidated:c.validated,metricCalibrationSource:c.source,metricCalibrationConfidence:c.confidence,metricCalibrationReason:c.reason}; });
      return {...r,bridge:{frames,segmentBreaks,lastTime,timeline:[...timeline],segments,rejectedDetections,rejectedByReason:{...rejectedByReason}}};
    }
    function snapshot(){ const s=summary(); return {frames,segmentBreaks,lastTime,segments:s.segments,rosterTotal:s.rosterTotal,maxVisible:s.maxVisible,timelineEvents:timeline.length,segmentProvenance:provenance(),rejectedDetections,rejectedByReason:{...rejectedByReason}}; }
    return {state,processFrame,startSegment,mergePlayers,summary,report,snapshot,provenance};
  }
  return {create,normalizeDetection,boxAnchor,detectionEligibility,bindProjectorsToSegments};
});