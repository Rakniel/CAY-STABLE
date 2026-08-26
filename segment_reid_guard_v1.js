(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.CAYSegmentReidGuard=api;
    if(root.CAYStableTrackingBridge)root.CAYStableTrackingBridge=api.decorate(root.CAYStableTrackingBridge);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function compatibilityKey(context){
    const c=context||{};
    const raw=c.segmentCompatibilityKey??c.fieldGeometryId??c.calibrationFamily??c.cameraViewId??null;
    if(raw===null||raw===undefined||String(raw).trim()==='')return null;
    return String(raw).trim();
  }
  function decorate(Bridge){
    if(!Bridge||typeof Bridge.create!=='function')throw new Error('CAYStableTrackingBridge.create requis');
    if(Bridge.__segmentReidGuardV1===true)return Bridge;
    const wrapped={...Bridge,__segmentReidGuardV1:true};
    wrapped.create=function(options){
      const bridge=Bridge.create(options);
      const keys=new Map();
      let blockedCandidates=0,blockedFirstFrame=0;
      const baseProcessFrame=bridge.processFrame.bind(bridge);
      const baseReport=typeof bridge.report==='function'?bridge.report.bind(bridge):null;
      const baseSnapshot=typeof bridge.snapshot==='function'?bridge.snapshot.bind(bridge):null;
      const initialKey=compatibilityKey(options||{});
      if(initialKey)keys.set(Number(bridge.state?.segment)||1,initialKey);

      bridge.processFrame=function(input,time,context){
        const ctx={...(context||{})};
        const beforeSegment=Number(bridge.state?.segment)||1;
        const snap=baseSnapshot?baseSnapshot():{lastTime:null};
        const decision=typeof Bridge.inferSegmentBreak==='function'?Bridge.inferSegmentBreak(ctx,snap?.lastTime??null,time,options||{}):{break:ctx.segmentBreak===true};
        const incomingKey=compatibilityKey(ctx);
        const targetSegment=decision&&decision.break?beforeSegment+1:beforeSegment;
        const oldKey=keys.get(beforeSegment)||null;

        if(decision&&decision.break&&incomingKey&&oldKey&&incomingKey!==oldKey){
          ctx.reidentifyArchived=false;
          blockedFirstFrame++;
        }

        const currentKey=(decision&&decision.break)?incomingKey:(incomingKey||keys.get(beforeSegment)||null);
        let blocked=[];
        if(!(decision&&decision.break)&&currentKey&&Array.isArray(bridge.state?.archive)){
          const allowed=[];
          for(const tr of bridge.state.archive){
            const trKey=keys.get(Number(tr?.segment))||null;
            if(trKey&&trKey!==currentKey){ blocked.push(tr); blockedCandidates++; }
            else allowed.push(tr);
          }
          if(blocked.length)bridge.state.archive=allowed;
        }

        let result;
        try{ result=baseProcessFrame(input,time,ctx); }
        finally{
          if(blocked.length){
            const live=Array.isArray(bridge.state.archive)?bridge.state.archive:[];
            const ids=new Set(live.map(t=>t&&t.globalId));
            bridge.state.archive=[...live,...blocked.filter(t=>!ids.has(t&&t.globalId))];
          }
        }
        const actualSegment=Number(bridge.state?.segment)||targetSegment;
        if(incomingKey)keys.set(actualSegment,incomingKey);
        return result;
      };

      function diagnostics(){
        return {
          policy:'EXPLICIT_SEGMENT_COMPATIBILITY_ONLY',
          blockedCandidates,
          blockedFirstFrame,
          segmentKeys:[...keys.entries()].sort((a,b)=>a[0]-b[0]).map(([segment,key])=>({segment,key})),
          unknownCompatibility:'ALLOW_STRONG_REID_WITH_EXISTING_THRESHOLDS'
        };
      }
      if(baseReport)bridge.report=function(projectors){ const r=baseReport(projectors); return {...r,segmentReidGuard:diagnostics()}; };
      if(baseSnapshot)bridge.snapshot=function(){ const s=baseSnapshot(); return {...s,segmentReidGuard:diagnostics()}; };
      bridge.segmentReidGuardDiagnostics=diagnostics;
      return bridge;
    };
    return wrapped;
  }
  return {decorate,compatibilityKey};
});
