(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackRosterBinding=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MIN_RELIABLE_CONFIDENCE=.8;
  const ALLOWED_SOURCES=new Set(['MANUAL','JERSEY_NUMBER','REID_FUSED','MANUAL_PLUS_REID']);
  const clean=v=>String(v==null?'':v).trim();
  const finite01=v=>Number.isFinite(Number(v))?Math.max(0,Math.min(1,Number(v))):null;

  function createState(raw={}){
    const bindings=Array.isArray(raw.bindings)?raw.bindings.map(normalizeBinding):[];
    validateBindings(bindings);
    return {bindings,source:'TRACK_ROSTER_BINDING_V1'};
  }

  function normalizeBinding(raw={}){
    const trackId=clean(raw.trackId),playerId=clean(raw.playerId),source=clean(raw.source).toUpperCase();
    const confidence=finite01(raw.confidence);
    const confirmed=raw.confirmed===true;
    const atMs=Number.isFinite(Number(raw.atMs))?Number(raw.atMs):null;
    const evidence=Array.isArray(raw.evidence)?raw.evidence.map(clean).filter(Boolean):[];
    if(!trackId)throw new Error('TRACK_BINDING_TRACK_REQUIRED');
    if(!playerId)throw new Error('TRACK_BINDING_PLAYER_REQUIRED');
    if(!ALLOWED_SOURCES.has(source))throw new Error('TRACK_BINDING_SOURCE_INVALID');
    if(confidence===null)throw new Error('TRACK_BINDING_CONFIDENCE_REQUIRED');
    return {trackId,playerId,source,confidence,confirmed,atMs,evidence};
  }

  function validateBindings(bindings){
    const byTrack=new Set(),byPlayer=new Set();
    for(const row of bindings||[]){
      if(byTrack.has(row.trackId))throw new Error('TRACK_BINDING_DUPLICATE_TRACK');
      if(row.confirmed===true&&row.confidence>=MIN_RELIABLE_CONFIDENCE){
        if(byPlayer.has(row.playerId))throw new Error('TRACK_BINDING_DUPLICATE_RELIABLE_PLAYER');
        byPlayer.add(row.playerId);
      }
      byTrack.add(row.trackId);
    }
    return true;
  }

  function bind(state,raw={}){
    const current=createState(state||{}),next=normalizeBinding(raw);
    if(next.confirmed!==true)throw new Error('TRACK_BINDING_EXPLICIT_CONFIRMATION_REQUIRED');
    if(next.confidence<MIN_RELIABLE_CONFIDENCE)throw new Error('TRACK_BINDING_CONFIDENCE_INSUFFICIENT');
    if(next.source!=='MANUAL'&&next.evidence.length<1)throw new Error('TRACK_BINDING_EVIDENCE_REQUIRED');
    const kept=current.bindings.filter(row=>row.trackId!==next.trackId);
    if(kept.some(row=>row.confirmed===true&&row.confidence>=MIN_RELIABLE_CONFIDENCE&&row.playerId===next.playerId))throw new Error('TRACK_BINDING_PLAYER_ALREADY_BOUND');
    const bindings=kept.concat(next);
    validateBindings(bindings);
    return {bindings,source:'TRACK_ROSTER_BINDING_V1'};
  }

  function unbind(state,trackId){
    const current=createState(state||{}),id=clean(trackId);
    return {bindings:current.bindings.filter(row=>row.trackId!==id),source:'TRACK_ROSTER_BINDING_V1'};
  }

  function resolve(state,trackId){
    const current=createState(state||{}),row=current.bindings.find(item=>item.trackId===clean(trackId))||null;
    if(!row)return {status:'INDISPONIBLE',playerId:null,confidence:null,source:null,reason:'aucune association track-joueur confirmée'};
    if(row.confirmed!==true||row.confidence<MIN_RELIABLE_CONFIDENCE)return {status:'INDISPONIBLE',playerId:null,confidence:row.confidence,source:row.source,reason:'association non suffisamment fiable'};
    return {status:'FIABLE',playerId:row.playerId,confidence:row.confidence,source:row.source,evidence:row.evidence.slice(),atMs:row.atMs};
  }

  function resolveAtTime(state,trackId,participation,atMs){
    const resolved=resolve(state,trackId);
    if(resolved.status!=='FIABLE')return resolved;
    const time=Number(atMs);
    if(!Number.isFinite(time))return {...resolved,status:'INDISPONIBLE',playerId:null,reason:'temps observation invalide'};
    const intervals=participation?.byPlayerId?.[String(resolved.playerId)];
    if(!Array.isArray(intervals))return {...resolved,status:'INDISPONIBLE',playerId:null,reason:'fenêtres de participation indisponibles'};
    const active=intervals.some(interval=>time>=Number(interval.startMs)&&(interval.endMs===null||interval.endMs===undefined||time<=Number(interval.endMs)));
    if(!active)return {...resolved,status:'INDISPONIBLE',playerId:null,reason:'joueur hors fenêtre de participation confirmée'};
    return {...resolved,atMs:time};
  }

  function reliableBindings(state){
    const current=createState(state||{});
    return current.bindings.filter(row=>row.confirmed===true&&row.confidence>=MIN_RELIABLE_CONFIDENCE).map(row=>({...row,evidence:row.evidence.slice()}));
  }

  return {MIN_RELIABLE_CONFIDENCE,ALLOWED_SOURCES:[...ALLOWED_SOURCES],createState,normalizeBinding,validateBindings,bind,unbind,resolve,resolveAtTime,reliableBindings};
});
