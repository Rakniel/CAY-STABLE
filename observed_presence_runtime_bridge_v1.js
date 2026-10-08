(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports ? require('./stable_tracking_bridge_v1.js') : root.CAYStableTrackingBridge,
    typeof module==='object'&&module.exports ? require('./observed_presence_v1.js') : root.CAYObservedPresence,
    typeof module==='object'&&module.exports ? require('./observed_presence_report_v1.js') : root.CAYObservedPresenceReport
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.CAYObservedPresenceRuntimeBridge=api;
    if(root.CAYStableTrackingBridge)root.CAYStableTrackingBridge=api.decorate(root.CAYStableTrackingBridge);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(DefaultBridge,ObservedPresence,PresenceReport){
  'use strict';
  function ensureDeps(Bridge){
    if(!Bridge||typeof Bridge.create!=='function')throw new Error('CAYStableTrackingBridge.create requis');
    if(!ObservedPresence||typeof ObservedPresence.createState!=='function'||typeof ObservedPresence.observeFrame!=='function')throw new Error('CAYObservedPresence requis');
    if(!PresenceReport||typeof PresenceReport.applyToReport!=='function')throw new Error('CAYObservedPresenceReport.applyToReport requis');
  }
  function decorate(Bridge){
    Bridge=Bridge||DefaultBridge;
    ensureDeps(Bridge);
    if(Bridge.__observedPresenceRuntimeV1===true)return Bridge;
    const wrapped={...Bridge,__observedPresenceRuntimeV1:true};
    wrapped.create=function(options){
      const bridge=Bridge.create(options);
      const presenceState=ObservedPresence.createState();
      const baseProcessFrame=bridge.processFrame.bind(bridge);
      const baseReport=bridge.report.bind(bridge);
      bridge.processFrame=function(input,time,context){
        const assigned=baseProcessFrame(input,time,context);
        ObservedPresence.observeFrame(presenceState,assigned,time,{segment:Number.isInteger(bridge.state?.segment)?bridge.state.segment:1});
        return assigned;
      };
      bridge.report=function(projectors){
        const supplied=projectors||{};
        const base=baseReport(supplied);
        const timeline=base?.bridge?.timeline;
        if(Array.isArray(timeline)){
          const events=timeline.filter(event=>event?.type==='FRAME');
          const aligned=events.length===presenceState.frames.length;
          for(let index=0;index<presenceState.frames.length;index++){
            const frame=presenceState.frames[index],event=events[index];
            const sameFrame=aligned&&event&&Number(event.time)===frame.time&&Number(event.segment)===frame.segment;
            const reason=!sameFrame?'TRACKING_PRESENCE_TIMELINE_MISMATCH':
              (event.dataQuality==='INDISPONIBLE'||event.invalidReason?String(event.invalidReason||'TRACKING_FRAME_UNAVAILABLE'):null);
            if(reason){
              frame.frameEvidenceValid=false;
              frame.frameEvidenceReason=reason;
              frame.frameEvidenceSource='STRICT_TRACKING_FRAME_GUARD';
            }
          }
        }
        return PresenceReport.applyToReport(base,presenceState,supplied);
      };
      bridge.presenceState=presenceState;
      bridge.presenceSummary=function(){return ObservedPresence.summarize(presenceState);};
      return bridge;
    };
    return wrapped;
  }
  return {decorate};
});
