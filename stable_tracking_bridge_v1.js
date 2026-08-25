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
    const ar=w/h;
    return ar>1.05?{x:x+w*.5,y:y+h*.64}:{x:x+w*.5,y:y+h*.96};
  }
  function normalizeDetection(d,width,height){
    if(!d)return null;
    let x=Number(d.x),y=Number(d.y);
    if(!(Number.isFinite(x)&&Number.isFinite(y))){
      const a=boxAnchor(d.b||d.box);
      if(!a||!(width>0&&height>0))return null;
      x=a.x/width;y=a.y/height;
    }
    const cat=d.cat==='goalkeeper'?'goalkeeper':'team';
    return {
      ...d,
      cat,
      x:clamp01(x),y:clamp01(y),
      score:Number.isFinite(Number(d.score))?Number(d.score):0,
      feature:Array.isArray(d.feature)?d.feature:null
    };
  }
  function create(options){
    requireDeps();
    const opts={maxPlayers:11,lostAfter:8,reidentifyArchived:true,reidAppearanceThreshold:.10,...(options||{})};
    const state=Core.createState();
    let lastTime=null;
    let frames=0;
    let segmentBreaks=0;

    function startSegment(reason){
      Core.startSegment(state,reason||'camera_cut');
      segmentBreaks++;
    }
    function processFrame(input,time,context){
      const ctx=context||{};
      const t=Number(time);
      if(!Number.isFinite(t))throw new Error('temps frame invalide');
      if(lastTime!==null&&t<lastTime)startSegment('timeline_rewind');
      if(ctx.segmentBreak===true)startSegment(ctx.segmentReason||'camera_cut');
      const width=Number(ctx.width)||0,height=Number(ctx.height)||0;
      const normalized=(input||[]).map(d=>normalizeDetection(d,width,height)).filter(Boolean);
      const assigned=Core.assignFrame(state,normalized,t,{
        maxPlayers:Math.min(11,Math.max(1,Number(ctx.maxPlayers)||opts.maxPlayers)),
        lostAfter:Number.isFinite(ctx.lostAfter)?ctx.lostAfter:opts.lostAfter,
        allowNew:ctx.allowNew!==false,
        reidentifyArchived:ctx.reidentifyArchived!==false&&opts.reidentifyArchived!==false,
        reidAppearanceThreshold:Number.isFinite(ctx.reidAppearanceThreshold)?ctx.reidAppearanceThreshold:opts.reidAppearanceThreshold,
        baseThreshold:Number.isFinite(ctx.baseThreshold)?ctx.baseThreshold:opts.baseThreshold
      });
      const ids=new Set();
      for(const a of assigned){
        if(ids.has(a.trackId))throw new Error('invariant violé: ID joueur dupliqué sur une frame');
        ids.add(a.trackId);
      }
      if(assigned.length>11)throw new Error('invariant violé: plus de 11 CAY simultanés');
      frames++;
      lastTime=t;
      return assigned;
    }
    function mergePlayers(targetId,sourceId){ return Core.mergeTracks(state,targetId,sourceId); }
    function summary(){ return Core.summary(state); }
    function report(projectors){
      const r=Stats.buildReport(state,Core,projectors||{});
      return {...r,bridge:{frames,segmentBreaks,lastTime}};
    }
    function snapshot(){
      const s=summary();
      return {frames,segmentBreaks,lastTime,segments:s.segments,rosterTotal:s.rosterTotal,maxVisible:s.maxVisible};
    }
    return {state,processFrame,startSegment,mergePlayers,summary,report,snapshot};
  }
  return {create,normalizeDetection,boxAnchor};
});