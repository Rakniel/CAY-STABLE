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

  function invalidFrameKey(time,segment){
    const t=Number(time),s=Number(segment);
    if(!Number.isFinite(t)||!Number.isFinite(s))return null;
    return Math.round(t*1e6)+'@'+s;
  }

  function create(options){
    const bridge=Base.create(options);
    const baseProcess=bridge.processFrame.bind(bridge);
    const baseReport=bridge.report.bind(bridge);
    const baseSnapshot=bridge.snapshot.bind(bridge);
    const invalidFrames=[];
    const configuredGap=Number(options&&options.unavailableGapSegmentSeconds);
    const configuredLongGap=Number(options&&options.longGapSeconds);
    const unavailableGapSegmentSeconds=Math.max(.5,Number.isFinite(configuredGap)?configuredGap:(Number.isFinite(configuredLongGap)?configuredLongGap:2.5));
    let lastUsableTime=null,lastUsableSegment=null,unavailableRunStart=null,unavailableRunLast=null,unavailableRunFrames=0,unavailableRecoverySegmentBreaks=0;

    function noteUnavailable(time){
      const t=Number(time);
      if(!Number.isFinite(t))return;
      if(unavailableRunFrames===0)unavailableRunStart=t;
      unavailableRunLast=t;
      unavailableRunFrames++;
    }

    function clearUnavailableRun(){
      unavailableRunStart=null;
      unavailableRunLast=null;
      unavailableRunFrames=0;
    }

    function continuityValidated(ctx){
      return ctx&&(
        ctx.continuityValidated===true||
        ctx.sameShotContinuous===true||
        ctx.sameCameraContinuous===true
      );
    }

    function recoveryContext(time,context){
      const ctx=context||{},t=Number(time);
      if(unavailableRunFrames<1||lastUsableTime===null||!Number.isFinite(t))return ctx;
      const blindGap=Math.max(0,t-lastUsableTime);
      const currentSegment=bridge.state&&Number(bridge.state.segment);
      const alreadySegmented=Number.isFinite(currentSegment)&&Number.isFinite(lastUsableSegment)&&currentSegment!==lastUsableSegment;
      if(blindGap<unavailableGapSegmentSeconds||alreadySegmented||continuityValidated(ctx)||ctx.segmentBreak===true)return ctx;
      unavailableRecoverySegmentBreaks++;
      return {...ctx,segmentBreak:true,segmentReason:'unavailable_observation_gap',unavailableGapSeconds:blindGap,unavailableFrames:unavailableRunFrames};
    }

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
      noteUnavailable(time);
      return event;
    }

    function processUnavailableFrame(time,context){
      const ctx=context||{},reason=String(ctx.reason||ctx.unavailableReason||'OBSERVATION_UNAVAILABLE');
      baseProcess([],time,{...ctx,allowNew:false});
      recordUnavailable(time,reason,{eligibleDetections:0,assignableDetections:0,normalizationRejected:0,maxPlayers:Math.min(11,Math.max(1,Number(ctx.maxPlayers)||Number(options&&options.maxPlayers)||11))});
      return [];
    }

    function processFrame(input,time,context){
      const ctx=recoveryContext(time,context||{});
      const limit=Math.min(11,Math.max(1,Number(ctx.maxPlayers)||Number(options&&options.maxPlayers)||11));
      const counts=detectionCounts(input,ctx);
      if(counts.assignable>limit){
        const t=Number(time);
        // Age existing tracks and let the base bridge apply any real/recovery segment break,
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
      const assigned=baseProcess(input,time,ctx);
      const t=Number(time);
      if(Number.isFinite(t)){
        lastUsableTime=t;
        lastUsableSegment=bridge.state&&Number(bridge.state.segment);
      }
      clearUnavailableRun();
      return assigned;
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
      const invalidByFrame=new Map();
      for(const x of invalid){
        const key=invalidFrameKey(x.time,x.segment);
        if(key!==null&&!invalidByFrame.has(key))invalidByFrame.set(key,x);
      }
      const timeline=(r.bridge&&Array.isArray(r.bridge.timeline)?r.bridge.timeline:[]).map(ev=>{
        if(ev.type!=='FRAME')return ev;
        const key=invalidFrameKey(ev.time,ev.segment),hit=key===null?null:invalidByFrame.get(key);
        return hit?{...ev,dataQuality:'INDISPONIBLE',invalidReason:hit.reason,eligibleDetections:hit.eligibleDetections,assignableDetections:hit.assignableDetections,normalizationRejected:hit.normalizationRejected,policy:hit.policy}:ev;
      });
      const observationCoverage=coverageFromTimeline(timeline);
      return {...r,bridge:{...(r.bridge||{}),timeline,invalidObservationFrames:invalid.length,invalidFrames:invalid,noSilentTruncation:true,overflowCountsAssignableDetections:true,invalidFrameProvenance:'TIME_AND_SEGMENT',invalidFrameLookup:'INDEXED_TIME_AND_SEGMENT',unavailableGapSegmentSeconds,unavailableRecoverySegmentBreaks,unavailableRecoveryPolicy:'SEGMENT_IF_LONG_BLIND_GAP_WITHOUT_VALIDATED_CONTINUITY',...observationCoverage}};
    }

    function snapshot(){
      const base={...baseSnapshot(),invalidObservationFrames:invalidFrames.length,invalidFrames:invalidFrames.map(x=>({...x})),noSilentTruncation:true,overflowCountsAssignableDetections:true,invalidFrameProvenance:'TIME_AND_SEGMENT',invalidFrameLookup:'INDEXED_TIME_AND_SEGMENT',unavailableGapSegmentSeconds,unavailableRecoverySegmentBreaks,unavailableRun:{frames:unavailableRunFrames,start:unavailableRunStart,last:unavailableRunLast},unavailableRecoveryPolicy:'SEGMENT_IF_LONG_BLIND_GAP_WITHOUT_VALIDATED_CONTINUITY'};
      return base;
    }

    return {...bridge,processFrame,processUnavailableFrame,report,snapshot};
  }

  return {...Base,create,eligibleCount,detectionCounts,strictFrameGuardVersion:'1.5.0'};
});