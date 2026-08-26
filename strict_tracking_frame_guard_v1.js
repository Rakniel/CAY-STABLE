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

    function recordUnavailable(time,reason,extra){
      const t=Number(time),event={
        time:Number.isFinite(t)?t:null,
        segment:bridge.state&&bridge.state.segment||null,
        status:'INDISPONIBLE',
        reason:reason||'OBSERVATION_UNAVAILABLE',
        policy:'explicit_unavailable_no_fallback',
        ...(extra||{})
      };
      invalidFrames.push(event);
      return event;
    }

    function processUnavailableFrame(time,context){
      const ctx=context||{},reason=String(ctx.reason||ctx.unavailableReason||'OBSERVATION_UNAVAILABLE');
      baseProcess([],time,{...ctx,allowNew:false});
      recordUnavailable(time,reason,{eligibleDetections:0,assignableDetections:0,normalizationRejected:0,maxPlayers:Math.min(11,Math.max(1,Number(ctx.maxPlayers)||Number(options&&options.maxPlayers)||11))});
      return [];
    }

    function processFrame(input,time,context){
      const ctx=context||{};
      const limit=Math.min(11,Math.max(1,Number(ctx.maxPlayers)||Number(options&&options.maxPlayers)||11));
      const counts=detectionCounts(input,ctx);
      if(counts.assignable>limit){
        const t=Number(time);
        // Age existing tracks and let the base bridge apply any real segment break,
        // but never feed an arbitrary top-N subset to the tracker.
        baseProcess([],time,{...ctx,allowNew:false});
        recordUnavailable(t,limit===11?'MORE_THAN_11_CAY_DETECTIONS':'MORE_THAN_CONFIGURED_CAY_DETECTIONS',{
          eligibleDetections:counts.eligible,
          assignableDetections:counts.assignable,
          normalizationRejected:counts.normalizationRejected,
          maxPlayers:limit,
          policy:'no_silent_truncation'
        });
        return [];
      }
      return baseProcess(input,time,ctx);
    }

    function coverageFromTimeline(timeline){
      const frameEvents=(timeline||[]).filter(ev=>ev.type==='FRAME');
      const unavailable=frameEvents.filter(ev=>ev.dataQuality==='INDISPONIBLE');
      const total=frameEvents.length,usable=Math.max(0,total-unavailable.length);
      const coverage=total?usable/total:0;
      const reasons=unavailable.reduce((acc,ev)=>{const r=ev.invalidReason||'OBSERVATION_UNAVAILABLE';acc[r]=(acc[r]||0)+1;return acc;},{});
      return {
        attemptedObservationFrames:total,
        usableObservationFrames:usable,
        unavailableObservationFrames:unavailable.length,
        observationCoverage:+coverage.toFixed(4),
        observationQuality:coverage>=.8?'FIABLE':coverage>0?'PARTIEL':'INDISPONIBLE',
        unavailableReasons:reasons,
        calculation:'FRAMES_UTILISABLES_SUR_FRAMES_TENTEES',
        policy:'AUCUN_INSTANT_INDISPONIBLE_MASQUE'
      };
    }

    function report(projectors){
      const r=baseReport(projectors);
      const invalid=invalidFrames.map(x=>({...x}));
      const timeline=(r.bridge&&Array.isArray(r.bridge.timeline)?r.bridge.timeline:[]).map(ev=>{
        if(ev.type!=='FRAME')return ev;
        const hit=invalid.find(x=>x.time!==null&&Math.abs(Number(ev.time)-x.time)<1e-6&&Number(ev.segment)===Number(x.segment));
        return hit?{...ev,dataQuality:'INDISPONIBLE',invalidReason:hit.reason,eligibleDetections:hit.eligibleDetections,assignableDetections:hit.assignableDetections,normalizationRejected:hit.normalizationRejected,policy:hit.policy}:ev;
      });
      const observationCoverage=coverageFromTimeline(timeline);
      return {...r,bridge:{...(r.bridge||{}),timeline,invalidObservationFrames:invalid.length,invalidFrames:invalid,noSilentTruncation:true,overflowCountsAssignableDetections:true,invalidFrameProvenance:'TIME_AND_SEGMENT',...observationCoverage}};
    }

    function snapshot(){
      const base={...baseSnapshot(),invalidObservationFrames:invalidFrames.length,invalidFrames:invalidFrames.map(x=>({...x})),noSilentTruncation:true,overflowCountsAssignableDetections:true,invalidFrameProvenance:'TIME_AND_SEGMENT'};
      return base;
    }

    return {...bridge,processFrame,processUnavailableFrame,report,snapshot};
  }

  return {...Base,create,eligibleCount,detectionCounts,strictFrameGuardVersion:'1.3.0'};
});