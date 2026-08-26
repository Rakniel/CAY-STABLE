(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./stable_tracking_bridge_v1.js') : root.CAYStableTrackingBridge
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStableTrackingBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
  'use strict';
  if(!Base||typeof Base.create!=='function')throw new Error('CAYStableTrackingBridge indisponible pour le garde strict');

  function detectionCounts(input,context){
    const ctx=context||{},width=Number(ctx.width)||0,height=Number(ctx.height)||0;
    let eligible=0,assignable=0,normalizationRejected=0;
    for(const raw of (input||[])){
      const e=typeof Base.detectionEligibility==='function' ? Base.detectionEligibility(raw) : {accepted:true};
      if(!e||e.accepted===false)continue;
      eligible++;
      const normalized=typeof Base.normalizeDetection==='function' ? Base.normalizeDetection(raw,width,height) : raw;
      if(normalized)assignable++;
      else normalizationRejected++;
    }
    return {eligible,assignable,normalizationRejected};
  }

  function eligibleCount(input,context){
    return detectionCounts(input,context).assignable;
  }

  function create(options){
    const bridge=Base.create(options);
    const baseProcess=bridge.processFrame.bind(bridge);
    const baseReport=bridge.report.bind(bridge);
    const baseSnapshot=bridge.snapshot.bind(bridge);
    const invalidFrames=[];

    function processFrame(input,time,context){
      const ctx=context||{};
      const limit=Math.min(11,Math.max(1,Number(ctx.maxPlayers)||Number(options&&options.maxPlayers)||11));
      const counts=detectionCounts(input,ctx);
      if(counts.assignable>limit){
        const t=Number(time);
        const event={
          time:Number.isFinite(t)?t:null,
          segment:bridge.state&&bridge.state.segment||null,
          status:'INDISPONIBLE',
          reason:'MORE_THAN_11_CAY_DETECTIONS',
          eligibleDetections:counts.eligible,
          assignableDetections:counts.assignable,
          normalizationRejected:counts.normalizationRejected,
          maxPlayers:limit,
          policy:'no_silent_truncation'
        };
        invalidFrames.push(event);
        // Age existing tracks normally but do not select an arbitrary top 11.
        // Only detections that can actually reach assignment count toward overflow:
        // malformed/unprojectable observations are rejected by the normalizer, not
        // allowed to make an otherwise defensible frame unavailable.
        baseProcess([],time,{...ctx,allowNew:false});
        return [];
      }
      return baseProcess(input,time,ctx);
    }

    function report(projectors){
      const r=baseReport(projectors);
      const invalid=invalidFrames.map(x=>({...x}));
      const timeline=(r.bridge&&Array.isArray(r.bridge.timeline)?r.bridge.timeline:[]).map(ev=>{
        if(ev.type!=='FRAME')return ev;
        const hit=invalid.find(x=>x.time!==null&&Math.abs(Number(ev.time)-x.time)<1e-6);
        return hit?{...ev,dataQuality:'INDISPONIBLE',invalidReason:hit.reason,eligibleDetections:hit.eligibleDetections,assignableDetections:hit.assignableDetections,normalizationRejected:hit.normalizationRejected,policy:hit.policy}:ev;
      });
      return {...r,bridge:{...(r.bridge||{}),timeline,invalidObservationFrames:invalid.length,invalidFrames:invalid,noSilentTruncation:true,overflowCountsAssignableDetections:true}};
    }

    function snapshot(){
      return {...baseSnapshot(),invalidObservationFrames:invalidFrames.length,invalidFrames:invalidFrames.map(x=>({...x})),noSilentTruncation:true,overflowCountsAssignableDetections:true};
    }

    return {...bridge,processFrame,report,snapshot};
  }

  return {...Base,create,eligibleCount,detectionCounts,strictFrameGuardVersion:'1.1.0'};
});