(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.CAYManualIdentityMergeGuard=api;
    if(root.CAYStableTrackingBridge)root.CAYStableTrackingBridge=api.decorate(root.CAYStableTrackingBridge);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function cleanReason(v){
    const s=String(v??'').trim();
    return s.slice(0,240);
  }
  function decorate(Bridge){
    if(!Bridge||typeof Bridge.create!=='function')throw new Error('CAYStableTrackingBridge.create requis');
    if(Bridge.__manualIdentityMergeGuardV1===true)return Bridge;
    const wrapped={...Bridge,__manualIdentityMergeGuardV1:true};
    wrapped.create=function(options){
      const bridge=Bridge.create(options);
      if(!bridge||typeof bridge.mergePlayers!=='function')throw new Error('bridge.mergePlayers requis');
      const baseMerge=bridge.mergePlayers.bind(bridge);
      const baseReport=typeof bridge.report==='function'?bridge.report.bind(bridge):null;
      const baseSnapshot=typeof bridge.snapshot==='function'?bridge.snapshot.bind(bridge):null;
      const audit=[];
      bridge.mergePlayers=function(targetId,sourceId,confirmation){
        const c=confirmation||{};
        if(c.confirmed!==true)throw new Error('fusion manuelle refusée: confirmation utilisateur explicite requise');
        const reason=cleanReason(c.reason);
        if(!reason)throw new Error('fusion manuelle refusée: raison utilisateur requise');
        const before=typeof bridge.summary==='function'?bridge.summary():null;
        const targetBefore=before?.tracks?.find(t=>t.id===targetId)||null;
        const sourceBefore=before?.tracks?.find(t=>t.id===sourceId)||null;
        const merged=baseMerge(targetId,sourceId);
        const snap=baseSnapshot?baseSnapshot():null;
        audit.push({
          type:'MANUAL_IDENTITY_MERGE',
          targetId,sourceId,canonicalId:merged?.globalId??targetId,
          confirmed:true,reason,
          time:Number.isFinite(Number(snap?.lastTime))?Number(snap.lastTime):null,
          targetSegments:targetBefore?.segments?[...targetBefore.segments]:[],
          sourceSegments:sourceBefore?.segments?[...sourceBefore.segments]:[],
          resultingSegments:Array.isArray(merged?.segmentsSeen)?[...merged.segmentsSeen]:[],
          policy:'USER_CONFIRMED_ONLY'
        });
        return merged;
      };
      function diagnostics(){
        return {policy:'USER_CONFIRMED_ONLY',count:audit.length,audit:audit.map(x=>({...x,targetSegments:[...x.targetSegments],sourceSegments:[...x.sourceSegments],resultingSegments:[...x.resultingSegments]}))};
      }
      if(baseReport)bridge.report=function(projectors){ const r=baseReport(projectors); return {...r,manualIdentityMerges:diagnostics()}; };
      if(baseSnapshot)bridge.snapshot=function(){ const s=baseSnapshot(); return {...s,manualIdentityMerges:diagnostics()}; };
      bridge.manualIdentityMergeDiagnostics=diagnostics;
      return bridge;
    };
    return wrapped;
  }
  return {decorate,cleanReason};
});