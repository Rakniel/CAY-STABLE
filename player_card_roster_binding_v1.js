(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./app_domain_models_v1.js'):root.CAYAppDomainModels);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerCardRosterBinding=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Domain){
'use strict';
const clean=v=>String(v==null?'':v).trim();
const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
function normalizeTrackId(v){
  if(typeof v==='number'&&Number.isSafeInteger(v))return v;
  const s=clean(v); if(!s)return null;
  if(/^\d+$/.test(s)){const n=Number(s);return Number.isSafeInteger(n)?n:null;}
  return s;
}
function normalizeBinding(raw){
  if(!raw||raw.validated!==true)return {accepted:false,reason:'BINDING_NOT_VALIDATED'};
  const trackId=normalizeTrackId(raw.trackId),playerId=clean(raw.playerId),confidence=raw.confidence==null?1:clamp01(raw.confidence);
  if(trackId===null||!playerId)return {accepted:false,reason:'INVALID_BINDING_IDS'};
  if(confidence<.8)return {accepted:false,reason:'BINDING_CONFIDENCE_TOO_LOW'};
  return {accepted:true,binding:{trackId,playerId,validated:true,confidence:+confidence.toFixed(4),source:clean(raw.source)||'manual_validation'}};
}
function buildIndex(teamRaw,bindingsRaw){
  const team=Domain&&typeof Domain.createTeam==='function'?Domain.createTeam(teamRaw||{}):(teamRaw||{});
  const roster=Array.isArray(team.roster)?team.roster:[];
  const byPlayer=new Map(roster.map(p=>[clean(p.id),p]));
  const byTrack=new Map(),claimedPlayers=new Set(),accepted=[],rejected=[];
  for(const raw of bindingsRaw||[]){
    const n=normalizeBinding(raw); if(!n.accepted){rejected.push({reason:n.reason,binding:raw||null});continue;}
    const b=n.binding,player=byPlayer.get(b.playerId);
    if(!player){rejected.push({reason:'UNKNOWN_ROSTER_PLAYER',binding:b});continue;}
    const key=typeof b.trackId+':'+String(b.trackId);
    if(byTrack.has(key)){rejected.push({reason:'TRACK_ALREADY_BOUND',binding:b});continue;}
    if(claimedPlayers.has(b.playerId)){rejected.push({reason:'PLAYER_ALREADY_BOUND',binding:b});continue;}
    const record={...b,player}; byTrack.set(key,record);claimedPlayers.add(b.playerId);accepted.push(record);
  }
  return {team,accepted,rejected,byTrack,quality:rejected.length?'PARTIEL':'FIABLE',policy:'LIEN_TRACK_VERS_JOUEUR_EXPLICITE_UN_A_UN; AUCUNE_INFÉRENCE_DE_NOM_NUMÉRO_POSTE'};
}
function cardRoster(card,index,context){
  const trackId=normalizeTrackId(card&&card.id),key=typeof trackId+':'+String(trackId),hit=index&&index.byTrack?index.byTrack.get(key):null;
  if(!hit)return {status:'NON_LIÉ',trackId,playerId:null,displayName:null,number:null,photoUrl:null,primaryPosition:null,secondaryPosition:null,isGoalkeeper:card?.category==='goalkeeper',kit:null,reason:'aucune liaison roster explicitement validée'};
  const p=hit.player||{},kit=context&&context.activeKit||null;
  return {status:'LIÉ',trackId,playerId:p.id||hit.playerId,displayName:p.displayName||[p.firstName,p.lastName].filter(Boolean).join(' ')||null,number:p.number??null,photoUrl:p.photoUrl||null,primaryPosition:p.primaryPosition||null,secondaryPosition:p.secondaryPosition||null,isGoalkeeper:p.isGoalkeeper===true||p.primaryPosition==='GK',kit:kit?{id:kit.id||null,name:kit.name||null,shirtColor:kit.shirtColor||null,shortsColor:kit.shortsColor||null,socksColor:kit.socksColor||null}:null,binding:{confidence:hit.confidence,source:hit.source},reason:null};
}
function enrichModel(model,context){
  if(!model||!Array.isArray(model.players))return model;
  const ctx=context||{},index=buildIndex(ctx.team||{},ctx.bindings||[]);
  const players=model.players.map(card=>({...card,roster:cardRoster(card,index,ctx)}));
  return {...model,players,rosterBinding:{quality:index.quality,accepted:index.accepted.length,rejected:index.rejected.length,teamId:index.team&&index.team.id||null,policy:index.policy}};
}
return {normalizeTrackId,normalizeBinding,buildIndex,cardRoster,enrichModel};
});
