(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./app_domain_models_v1.js'):root.CAYAppDomainModels,
    typeof module==='object'&&module.exports?require('./player_card_roster_binding_v1.js'):root.CAYPlayerCardRosterBinding
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerIdentityBindingSession=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Domain,Binding){
'use strict';
const clean=v=>String(v==null?'':v).trim();
function normalizeTrackIds(raw){
  const ids=[],seen=new Set();
  for(const item of raw||[]){
    const candidate=item&&typeof item==='object'?(item.trackId??item.id):item;
    const id=Binding.normalizeTrackId(candidate);
    if(id===null)continue;
    const key=typeof id+':'+String(id);
    if(seen.has(key))continue;
    seen.add(key);ids.push(id);
  }
  return ids;
}
function playerSummary(p){
  return {id:p.id,displayName:p.displayName||[p.firstName,p.lastName].filter(Boolean).join(' ')||null,number:p.number??null,primaryPosition:p.primaryPosition||null,secondaryPosition:p.secondaryPosition||null,photoUrl:p.photoUrl||null,status:p.status||null,isGoalkeeper:p.isGoalkeeper===true};
}
function createSession(input={}){
  const team=Domain.createTeam(input.team||{}),trackIds=normalizeTrackIds(input.tracks||[]);
  let bindings=[];
  const seed=Binding.buildIndex(team,input.bindings||[]);
  bindings=seed.accepted.map(x=>({trackId:x.trackId,playerId:x.playerId,validated:true,confidence:x.confidence,source:x.source||'manual_validation'}));
  function index(){return Binding.buildIndex(team,bindings);}
  function isKnownTrack(trackId){
    const id=Binding.normalizeTrackId(trackId); if(id===null)return false;
    return trackIds.some(x=>typeof x===typeof id&&String(x)===String(id));
  }
  function candidates(trackId){
    const id=Binding.normalizeTrackId(trackId);
    if(id===null||!isKnownTrack(id))return [];
    const idx=index(),claimed=new Set(idx.accepted.map(x=>x.playerId));
    const existing=idx.accepted.find(x=>typeof x.trackId===typeof id&&String(x.trackId)===String(id));
    return (team.roster||[])
      .filter(p=>!claimed.has(p.id)||(existing&&existing.playerId===p.id))
      .map(playerSummary)
      .sort((a,b)=>(a.number==null?999:a.number)-(b.number==null?999:b.number)||clean(a.displayName).localeCompare(clean(b.displayName),'fr'));
  }
  function assign(trackId,playerId,confirmation={}){
    const id=Binding.normalizeTrackId(trackId),pid=clean(playerId);
    if(id===null||!isKnownTrack(id))return {accepted:false,reason:'UNKNOWN_TRACK'};
    if(confirmation.confirmed!==true)return {accepted:false,reason:'EXPLICIT_CONFIRMATION_REQUIRED'};
    if(!pid)return {accepted:false,reason:'INVALID_PLAYER_ID'};
    const retained=bindings.filter(b=>!(typeof b.trackId===typeof id&&String(b.trackId)===String(id))&&b.playerId!==pid);
    const candidate={trackId:id,playerId:pid,validated:true,confidence:1,source:clean(confirmation.source)||'manual_ui_confirmation'};
    const trial=Binding.buildIndex(team,[...retained,candidate]);
    const hit=trial.accepted.find(x=>typeof x.trackId===typeof id&&String(x.trackId)===String(id)&&x.playerId===pid);
    if(!hit){
      const rejection=trial.rejected.find(x=>x.binding&&String(x.binding.playerId||'')===pid)||trial.rejected[0];
      return {accepted:false,reason:rejection&&rejection.reason||'BINDING_REJECTED'};
    }
    bindings=[...retained,candidate];
    return {accepted:true,binding:{...candidate}};
  }
  function unassign(trackId){
    const id=Binding.normalizeTrackId(trackId); if(id===null)return {removed:false,reason:'INVALID_TRACK'};
    const before=bindings.length;
    bindings=bindings.filter(b=>!(typeof b.trackId===typeof id&&String(b.trackId)===String(id)));
    return {removed:bindings.length<before,reason:bindings.length<before?null:'NOT_BOUND'};
  }
  function exportBindings(){return index().accepted.map(x=>({trackId:x.trackId,playerId:x.playerId,validated:true,confidence:x.confidence,source:x.source}));}
  function summary(){
    const accepted=exportBindings(),boundTracks=new Set(accepted.map(b=>typeof b.trackId+':'+String(b.trackId)));
    return {teamId:team.id,tracks:trackIds.length,linked:accepted.length,unlinked:trackIds.length-boundTracks.size,complete:trackIds.length>0&&boundTracks.size===trackIds.length,requiresExplicitConfirmation:true,policy:'AUCUNE_IDENTITÉ_AUTOMATIQUE; VALIDATION_HUMAINE_UN_A_UN_AVANT_AFFICHAGE_DU_NOM'};
  }
  return {team,trackIds:[...trackIds],candidates,assign,unassign,exportBindings,summary};
}
return {normalizeTrackIds,createSession};
});
