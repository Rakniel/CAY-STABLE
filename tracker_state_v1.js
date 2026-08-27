(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackerState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='1.0.0';
const FORBIDDEN=new Set(['password','passwordHash','token','accessToken','refreshToken','secret','apiKey']);
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
function finite(v,fallback=null){const n=Number(v);return Number.isFinite(n)?n:fallback;}
function clean(v){return String(v==null?'':v).trim();}
function assertNoSecrets(value,path='root'){
  if(value==null||typeof value!=='object')return;
  for(const [k,v] of Object.entries(value)){
    if(FORBIDDEN.has(k))throw new Error(`SECRET_FIELD_FORBIDDEN:${path}.${k}`);
    assertNoSecrets(v,`${path}.${k}`);
  }
}
function cloneSafe(value){
  if(value==null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(Array.isArray(value))return value.map(cloneSafe);
  if(plain(value)){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(FORBIDDEN.has(k))throw new Error(`SECRET_FIELD_FORBIDDEN:${k}`);
      if(typeof v==='function'||typeof v==='undefined')continue;
      out[k]=cloneSafe(v);
    }
    return out;
  }
  return null;
}
function normalizeTrack(t={}){
  const id=clean(t.trackId??t.id);
  if(!id)throw new Error('TRACK_ID_REQUIRED');
  const playerId=clean(t.playerId)||null;
  const observations=Math.max(0,Math.floor(finite(t.observations,0)));
  const identityConfidence=Math.max(0,Math.min(1,finite(t.identityConfidence,0)));
  return {
    trackId:id,playerId,team:clean(t.team)||null,category:clean(t.category??t.cat)||null,
    observations,identityConfidence,firstTime:finite(t.firstTime),lastTime:finite(t.lastTime),
    segments:Array.isArray(t.segments)?[...new Set(t.segments.map(x=>clean(x)).filter(Boolean))]:[],
    appearance:Array.isArray(t.appearance)?t.appearance.map(x=>finite(x)).filter(Number.isFinite):null,
    status:clean(t.status)||'OBSERVED'
  };
}
function createSnapshot(input={}){
  assertNoSecrets(input);
  const tracks=Array.isArray(input.tracks)?input.tracks.map(normalizeTrack):[];
  if(new Set(tracks.map(t=>t.trackId)).size!==tracks.length)throw new Error('DUPLICATE_TRACK_ID');
  const now=clean(input.savedAt)||new Date().toISOString();
  return {
    schema:'CAY_TRACKER_STATE',version:VERSION,savedAt:now,
    analysisId:clean(input.analysisId)||null,teamId:clean(input.teamId)||null,videoFingerprint:clean(input.videoFingerprint)||null,
    source:'CAY_STABLE',resumePolicy:'SAME_VIDEO_AND_TEAM_ONLY',
    tracks,
    calibrationSegments:cloneSafe(Array.isArray(input.calibrationSegments)?input.calibrationSegments:[]),
    coverage:cloneSafe(input.coverage||{}),runtime:cloneSafe(input.runtime||{}),
    provenance:{inspiredBy:'TrackLab tracker state persistence',license:'MIT',adaptation:'CAY JSON snapshot; no upstream code copied'}
  };
}
function validateSnapshot(s={}){
  const errors=[];
  try{assertNoSecrets(s);}catch(e){errors.push(e.message);}
  if(s.schema!=='CAY_TRACKER_STATE')errors.push('INVALID_SCHEMA');
  if(s.version!==VERSION)errors.push('UNSUPPORTED_VERSION');
  if(!Array.isArray(s.tracks))errors.push('TRACKS_REQUIRED');
  else {
    const ids=s.tracks.map(t=>clean(t.trackId));
    if(ids.some(x=>!x))errors.push('TRACK_ID_REQUIRED');
    if(new Set(ids).size!==ids.length)errors.push('DUPLICATE_TRACK_ID');
  }
  return {valid:errors.length===0,errors};
}
function canResume(snapshot,ctx={}){
  const v=validateSnapshot(snapshot);if(!v.valid)return {allowed:false,reason:'INVALID_STATE',errors:v.errors};
  const sameTeam=!snapshot.teamId||!ctx.teamId||clean(snapshot.teamId)===clean(ctx.teamId);
  const sameVideo=!snapshot.videoFingerprint||!ctx.videoFingerprint||clean(snapshot.videoFingerprint)===clean(ctx.videoFingerprint);
  if(!sameTeam)return {allowed:false,reason:'TEAM_MISMATCH'};
  if(!sameVideo)return {allowed:false,reason:'VIDEO_MISMATCH'};
  return {allowed:true,reason:'MATCH'};
}
function exportJson(snapshot){const v=validateSnapshot(snapshot);if(!v.valid)throw new Error(v.errors.join(','));return JSON.stringify(snapshot);}
function importJson(text){const parsed=JSON.parse(String(text));const v=validateSnapshot(parsed);if(!v.valid)throw new Error(v.errors.join(','));return cloneSafe(parsed);}
return {VERSION,assertNoSecrets,createSnapshot,validateSnapshot,canResume,exportJson,importJson};
});
