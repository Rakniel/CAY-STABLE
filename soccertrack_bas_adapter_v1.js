(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYSoccerTrackBASAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const LABELS=new Set(['PASS','DRIVE','HEADER','HIGH PASS','OUT','CROSS','THROW IN','SHOT','BALL PLAYER BLOCK','PLAYER SUCCESSFUL TACKLE','FREE KICK','GOAL']);
  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toUpperCase();
  const finite=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&Number.isFinite(Number(v));

  function parseAnnotation(raw){
    if(!raw)return null;
    const label=norm(raw.label);
    if(!LABELS.has(label))return {error:'UNKNOWN_BAS_LABEL',label:raw.label??null};
    const gameTime=String(raw.gameTime??'').trim();
    const m=gameTime.match(/^([12])\s*-\s*(\d{1,3}):(\d{2})$/);
    if(!m)return {error:'INVALID_GAME_TIME',gameTime};
    if(!finite(raw.position))return {error:'INVALID_POSITION_MS',position:raw.position??null};
    const half=Number(m[1]),positionMs=Number(raw.position);
    if(positionMs<0)return {error:'INVALID_POSITION_MS',position:raw.position};
    return {
      type:label,
      half,
      halfTimeSec:positionMs/1000,
      time:positionMs/1000,
      team:raw.team??null,
      playerId:raw.player_id??null,
      visibility:raw.visibility??null,
      source:'SOCCERTRACK_V2_BAS',
      raw
    };
  }

  function parseDataset(input){
    const annotations=Array.isArray(input)?input:(Array.isArray(input?.annotations)?input.annotations:[]);
    const events=[],errors=[];
    annotations.forEach((raw,index)=>{
      const parsed=parseAnnotation(raw);
      if(!parsed||parsed.error)errors.push({index,...(parsed||{error:'INVALID_ANNOTATION'})});
      else events.push(parsed);
    });
    return {events,errors,quality:errors.length?'PARTIAL':'EVALUABLE',labels:[...LABELS]};
  }

  function cayEventToBas(raw,options){
    if(!raw||raw.publishable===false)return null;
    const type=norm(raw.type??raw.eventType);
    const mapping={PASS:'PASS',SHOT:'SHOT',GOAL:'GOAL',CROSS:'CROSS',HEADER:'HEADER','HIGH_PASS':'HIGH PASS','HIGH PASS':'HIGH PASS',OUT:'OUT','THROW_IN':'THROW IN','THROW IN':'THROW IN','FREE_KICK':'FREE KICK','FREE KICK':'FREE KICK'};
    const label=mapping[type];
    if(!label||!LABELS.has(label))return null;
    const half=Number(raw.half??options?.half??1);
    if(half!==1&&half!==2)return null;
    const time=finite(raw.time)?Number(raw.time):(finite(raw.timestamp)?Number(raw.timestamp):null);
    if(time===null||time<0)return null;
    return {type:label,half,halfTimeSec:time,time,team:raw.team??raw.fromTeam??null,playerId:raw.playerId??raw.fromPlayerId??null,source:'CAY_PUBLISHABLE_EVENT'};
  }

  function exportCayEvents(events,options){
    const converted=(events||[]).map(e=>cayEventToBas(e,options)).filter(Boolean);
    return {events:converted,rejected:(events||[]).length-converted.length,quality:converted.length?'EVALUABLE':'INDISPONIBLE'};
  }

  return {LABELS:[...LABELS],parseAnnotation,parseDataset,cayEventToBas,exportCayEvents};
});