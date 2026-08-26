(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./stable_tracking_bridge_v1.js') : root.CAYStableTrackingBridge
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStableTrackingBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Base){
  'use strict';
  if(!Base||typeof Base.create!=='function')throw new Error('CAYStableTrackingBridge indisponible pour le garde strict');

  function eligibleCount(input){
    let count=0;
    for(const raw of (input||[])){
      const e=typeof Base.detectionEligibility==='function' ? Base.detectionEligibility(raw) : {accepted:true};
      if(e&&e.accepted!==false)count++;
    }
    return count;
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
      const eligible=eligibleCount(input);
      if(eligible>limit){
        const t=Number(time);
        const event={
          time:Number.isFinite(t)?t:null,
          segment:bridge.state&&bridge.state.segment||null,
          status:'INDISPONIBLE',
          reason:'MORE_THAN_11_CAY_DETECTIONS',
          eligibleDetections:eligible,
          maxPlayers:limit,
          policy:'no_silent_truncation'
        };
        invalidFrames.push(event);
        // Age existing tracks normally but do not select an arbitrary top 11.
        // This keeps temporal continuity while excluding the incoherent instant
        // from every player/team statistic derived from assigned observations.
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
        return hit?{...ev,dataQuality:'INDISPONIBLE',invalidReason:hit.reason,eligibleDetections:hit.eligibleDetections,policy:hit.policy}:ev;
      });
      return {...r,bridge:{...(r.bridge||{}),timeline,invalidObservationFrames:invalid.length,invalidFrames:invalid,noSilentTruncation:true}};
    }

    function snapshot(){
      return {...baseSnapshot(),invalidObservationFrames:invalidFrames.length,invalidFrames:invalidFrames.map(x=>({...x})),noSilentTruncation:true};
    }

    return {...bridge,processFrame,report,snapshot};
  }

  return {...Base,create,strictFrameGuardVersion:'1.0.0'};
});