(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackerState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='1.0.0';
const MAX_GALLERY_SAMPLES=48;
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
function normalizeFeature(value){
  if(!Array.isArray(value)||!value.length)return null;
  const out=value.map(v=>Number(v));
  return out.every(Number.isFinite)?out:null;
}
function normalizeGallery(value,featureLength=null){
  if(!Array.isArray(value))return [];
  const out=[];
  for(const row of value){
    if(!row||typeof row!=='object')continue;
    const feature=normalizeFeature(row.feature);
    if(!feature)continue;
    if(Number.isInteger(featureLength)&&featureLength>0&&feature.length!==featureLength)continue;
    out.push({feature,quality:Math.max(0,Math.min(1,finite(row.quality,1)))});
  }
  return out.slice(-MAX_GALLERY_SAMPLES);
}
function normalizeTrack(t={}){
  const id=clean(t.trackId??t.globalId??t.id);
  if(!id)throw new Error('TRACK_ID_REQUIRED');
  const playerId=clean(t.playerId)||null;
  const observations=Math.max(0,Math.floor(finite(t.observations??t.seen,0)));
  const identityConfidence=Math.max(0,Math.min(1,finite(t.identityConfidence,0)));
  const feature=normalizeFeature(t.feature??t.appearance);
  const appearanceGallery=normalizeGallery(t.appearanceGallery,feature?feature.length:null);
  return {
    trackId:id,playerId,team:clean(t.team)||null,category:clean(t.category??t.cat)||null,
    observations,identityConfidence,firstTime:finite(t.firstTime),lastTime:finite(t.lastTime),
    segments:Array.isArray(t.segments)?[...new Set(t.segments.map(x=>clean(x)).filter(Boolean))]:(Array.isArray(t.segmentsSeen)?[...new Set(t.segmentsSeen.map(x=>clean(x)).filter(Boolean))]:[]),
    feature:feature?[...feature]:null,
    appearance:feature?[...feature]:null,
    appearanceGallery,
    status:clean(t.status)||(t.archived?'ARCHIVED':'OBSERVED')
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
    provenance:{inspiredBy:'TrackLab tracker state persistence + BoT-SORT appearance memory',license:'MIT design references',adaptation:'CAY JSON snapshot; no upstream code copied'}
  };
}
function validateTrackAppearance(t,errors){
  const featureRaw=t&&Object.prototype.hasOwnProperty.call(t,'feature')?t.feature:t&&t.appearance;
  const feature=featureRaw==null?null:normalizeFeature(featureRaw);
  if(featureRaw!=null&&!feature)errors.push('TRACK_FEATURE_INVALID');
  if(t&&t.appearanceGallery!=null){
    if(!Array.isArray(t.appearanceGallery))errors.push('TRACK_GALLERY_INVALID');
    else {
      if(t.appearanceGallery.length>MAX_GALLERY_SAMPLES)errors.push('TRACK_GALLERY_TOO_LARGE');
      for(const row of t.appearanceGallery){
        const rowFeature=row&&normalizeFeature(row.feature);
        if(!row||!rowFeature){errors.push('TRACK_GALLERY_INVALID');continue;}
        if(feature&&rowFeature.length!==feature.length)errors.push('TRACK_GALLERY_DIMENSION_MISMATCH');
        const q=Number(row.quality);
        if(row.quality!=null&&(!Number.isFinite(q)||q<0||q>1))errors.push('TRACK_GALLERY_QUALITY_INVALID');
      }
    }
  }
}
function validateSnapshot(s={}){
  const errors=[];
  try{assertNoSecrets(s);}catch(e){errors.push(e.message);}
  if(s.schema!=='CAY_TRACKER_STATE')errors.push('INVALID_SCHEMA');
  if(s.version!==VERSION)errors.push('UNSUPPORTED_VERSION');
  if(!Array.isArray(s.tracks))errors.push('TRACKS_REQUIRED');
  else {
    const ids=s.tracks.map(t=>clean(t.trackId??t.globalId??t.id));
    if(ids.some(x=>!x))errors.push('TRACK_ID_REQUIRED');
    if(new Set(ids).size!==ids.length)errors.push('DUPLICATE_TRACK_ID');
    for(const t of s.tracks)validateTrackAppearance(t,errors);
  }
  return {valid:errors.length===0,errors:[...new Set(errors)]};
}
function canResume(snapshot,ctx={}){
  const v=validateSnapshot(snapshot);if(!v.valid)return {allowed:false,reason:'INVALID_STATE',errors:v.errors};
  const stateTeam=clean(snapshot.teamId);
  const stateVideo=clean(snapshot.videoFingerprint);
  const contextTeam=clean(ctx.teamId);
  const contextVideo=clean(ctx.videoFingerprint);
  if(!stateTeam)return {allowed:false,reason:'STATE_TEAM_SCOPE_REQUIRED'};
  if(!stateVideo)return {allowed:false,reason:'STATE_VIDEO_SCOPE_REQUIRED'};
  if(!contextTeam)return {allowed:false,reason:'CONTEXT_TEAM_REQUIRED'};
  if(!contextVideo)return {allowed:false,reason:'CONTEXT_VIDEO_REQUIRED'};
  if(stateTeam!==contextTeam)return {allowed:false,reason:'TEAM_MISMATCH'};
  if(stateVideo!==contextVideo)return {allowed:false,reason:'VIDEO_MISMATCH'};
  return {allowed:true,reason:'MATCH'};
}
function exportJson(snapshot){const v=validateSnapshot(snapshot);if(!v.valid)throw new Error(v.errors.join(','));return JSON.stringify(snapshot);}
function importJson(text){
  const parsed=JSON.parse(String(text));const v=validateSnapshot(parsed);if(!v.valid)throw new Error(v.errors.join(','));
  const out=cloneSafe(parsed);
  out.tracks=(out.tracks||[]).map(t=>normalizeTrack(t));
  return out;
}
return {VERSION,MAX_GALLERY_SAMPLES,assertNoSecrets,createSnapshot,validateSnapshot,canResume,exportJson,importJson};
});
