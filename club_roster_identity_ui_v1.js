(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./app_domain_models_v1.js'):root.CAYAppDomainModels,
    typeof module==='object'&&module.exports?require('./player_identity_binding_session_v1.js'):root.CAYPlayerIdentityBindingSession,
    typeof module==='object'&&module.exports?require('./player_card_view_model_v1.js'):root.CAYPlayerCardViewModel,
    root
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYClubRosterIdentityUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Domain,BindingSession,ViewModel,root){
'use strict';
const TEAM_KEY='CAY_STABLE_TEAM_ROSTER_V1';
const BINDING_KEY='CAY_STABLE_TRACK_ROSTER_BINDINGS_V1';
const clean=v=>String(v==null?'':v).trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeParse(raw,fallback){try{return JSON.parse(raw);}catch(_){return fallback;}}
function sanitizePlayerDraft(raw={}){
  const number=raw.number==null||raw.number===''?null:Number(raw.number);
  return {id:clean(raw.id),displayName:clean(raw.displayName),number:Number.isInteger(number)?number:null,primaryPosition:clean(raw.primaryPosition).toUpperCase(),photoUrl:clean(raw.photoUrl),status:'ACTIVE'};
}
function normalizeStoredTeam(raw={}){
  const roster=[];
  for(const item of Array.isArray(raw.roster)?raw.roster:[]){
    try{
      const p=Domain.createPlayer(sanitizePlayerDraft(item));
      if(p.displayName)roster.push(p);
    }catch(_){ }
  }
  const ids=new Set(),deduped=[];
  for(const p of roster){if(ids.has(p.id))continue;ids.add(p.id);deduped.push(p);}
  const defaultLineup=Array.isArray(raw.defaultLineup)?raw.defaultLineup.map(clean).filter(Boolean):[];
  const bench=Array.isArray(raw.bench)?raw.bench.map(clean).filter(Boolean):[];
  return Domain.createTeam({id:clean(raw.id)||'cay_team',name:clean(raw.name)||'C.A. Yenne',category:clean(raw.category)||'SENIOR',roster:deduped,kits:Array.isArray(raw.kits)?raw.kits:[],defaultLineup,bench});
}
function createStore(storage){
  const s=storage||null;
  const read=(key,fallback)=>s&&typeof s.getItem==='function'?safeParse(s.getItem(key)||'',fallback):fallback;
  const write=(key,value)=>{if(s&&typeof s.setItem==='function')s.setItem(key,JSON.stringify(value));};
  function team(){return normalizeStoredTeam(read(TEAM_KEY,{}));}
  function saveTeam(value){const t=normalizeStoredTeam(value);write(TEAM_KEY,t);return t;}
  function bindings(){const v=read(BINDING_KEY,[]);return Array.isArray(v)?v:[];}
  function saveBindings(v){const list=Array.isArray(v)?v:[];write(BINDING_KEY,list);return list;}
  return {team,saveTeam,bindings,saveBindings};
}
const store=createStore(typeof localStorage!=='undefined'?localStorage:null);
function teamNameFromPage(){return clean(typeof document!=='undefined'?document.getElementById('analysisTeamName')?.value:'')||'C.A. Yenne';}
function currentTeam(){const t=store.team();return normalizeStoredTeam({...t,name:teamNameFromPage()});}
function positions(){return Array.isArray(Domain?.POSITIONS)?Domain.POSITIONS:['GK','RB','CB','LB','DM','CM','AM','RW','LW','ST'];}
function addPlayer(raw){
  const team=currentTeam(),draft=sanitizePlayerDraft(raw);
  if(!draft.displayName)return {accepted:false,reason:'PLAYER_NAME_REQUIRED'};
  if(draft.number!==null&&(draft.number<1||draft.number>99))return {accepted:false,reason:'INVALID_SHIRT_NUMBER'};
  if(!draft.id)draft.id='cay_player_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
  try{
    const player=Domain.createPlayer(draft);
    const next=store.saveTeam({...team,roster:[...(team.roster||[]),player]});
    return {accepted:true,player,team:next};
  }catch(e){return {accepted:false,reason:e.message||'PLAYER_REJECTED'};}
}
function removePlayer(playerId){
  const id=clean(playerId),team=currentTeam();
  const before=team.roster.length,nextRoster=team.roster.filter(p=>p.id!==id);
  if(nextRoster.length===before)return {removed:false,reason:'UNKNOWN_ROSTER_PLAYER'};
  const next=store.saveTeam({...team,roster:nextRoster,defaultLineup:(team.defaultLineup||[]).filter(x=>String(x)!==id),bench:(team.bench||[]).filter(x=>String(x)!==id)});
  const kept=store.bindings().filter(b=>clean(b.playerId)!==id);store.saveBindings(kept);
  return {removed:true,team:next};
}
function ensureRosterPanel(){
  if(typeof document==='undefined')return null;
  let panel=document.getElementById('cayClubRosterPanelV1');if(panel)return panel;
  const anchor=document.getElementById('analysisTeamName');if(!anchor)return null;
  panel=document.createElement('section');panel.id='cayClubRosterPanelV1';
  panel.style.cssText='margin-top:12px;padding:14px;border:1px solid rgba(205,31,45,.35);border-radius:14px;background:linear-gradient(145deg,rgba(205,31,45,.08),rgba(0,0,0,.22));color:#fff';
  panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><strong>ÉQUIPE / TROMBINOSCOPE</strong><div style="font-size:11px;opacity:.68">Roster supérieur à 11 autorisé • 11 CAY maximum simultanément sur le terrain.</div></div><span id="cayRosterCountV1" style="font-size:12px;opacity:.72">0 joueur</span></div><div style="display:grid;grid-template-columns:80px minmax(150px,1fr) 100px minmax(150px,1fr) auto;gap:7px;margin-top:10px"><input id="cayRosterNumberV1" type="number" min="1" max="99" placeholder="#" aria-label="numéro"><input id="cayRosterNameV1" type="text" placeholder="Nom du joueur" aria-label="nom du joueur"><select id="cayRosterPositionV1" aria-label="poste"></select><input id="cayRosterPhotoV1" type="url" placeholder="Photo URL (optionnel)" aria-label="photo URL"><button id="cayRosterAddV1" type="button">AJOUTER</button></div><div id="cayRosterMessageV1" style="margin-top:7px;font-size:11px;opacity:.72"></div><div id="cayRosterListV1" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px"></div>';
  const host=anchor.closest('.grid2')||anchor.parentElement;host?.insertAdjacentElement('afterend',panel);
  const select=panel.querySelector('#cayRosterPositionV1');for(const p of positions()){const o=document.createElement('option');o.value=p;o.textContent=p;select.appendChild(o);}select.value='CM';
  panel.querySelector('#cayRosterAddV1').onclick=()=>{
    const result=addPlayer({number:panel.querySelector('#cayRosterNumberV1').value,displayName:panel.querySelector('#cayRosterNameV1').value,primaryPosition:select.value,photoUrl:panel.querySelector('#cayRosterPhotoV1').value});
    panel.querySelector('#cayRosterMessageV1').textContent=result.accepted?'Joueur ajouté ✓':'Ajout refusé : '+result.reason;
    if(result.accepted){panel.querySelector('#cayRosterNumberV1').value='';panel.querySelector('#cayRosterNameV1').value='';panel.querySelector('#cayRosterPhotoV1').value='';renderRoster();renderIdentityPanel();}
  };
  return panel;
}
function renderRoster(){
  const panel=ensureRosterPanel();if(!panel)return false;const team=currentTeam(),list=panel.querySelector('#cayRosterListV1'),count=panel.querySelector('#cayRosterCountV1');
  count.textContent=team.roster.length+' joueur'+(team.roster.length>1?'s':'');
  list.innerHTML=team.roster.length?team.roster.map(p=>'<span data-player="'+esc(p.id)+'" style="display:inline-flex;align-items:center;gap:6px;padding:6px 8px;border-radius:10px;background:#111;border:1px solid rgba(255,255,255,.09);font-size:12px"><b>'+(p.number==null?'—':'#'+esc(p.number))+'</b> '+esc(p.displayName)+' <small style="opacity:.6">'+esc(p.primaryPosition||'')+'</small><button type="button" data-remove="'+esc(p.id)+'" title="Retirer" style="border:0;background:transparent;color:#ff8e96;cursor:pointer">×</button></span>').join(''):'<span style="opacity:.6;font-size:12px">Ajoute les joueurs avant l’identification des tracks.</span>';
  list.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{removePlayer(btn.getAttribute('data-remove'));renderRoster();renderIdentityPanel();});return true;
}
let lastReport=null,lastSession=null;
function ensureIdentityPanel(){
  if(typeof document==='undefined')return null;let panel=document.getElementById('cayIdentityBindingPanelV1');if(panel)return panel;
  const stats=document.getElementById('stablePlayerStatsV2')||document.getElementById('trackingGallery');if(!stats)return null;
  panel=document.createElement('section');panel.id='cayIdentityBindingPanelV1';panel.style.cssText='margin-top:12px;padding:14px;border:1px solid rgba(205,31,45,.4);border-radius:14px;background:#0d0d0f;color:#fff';panel.innerHTML='<div><strong>IDENTIFIER LES JOUEURS</strong><div style="font-size:11px;opacity:.68">Aucune identité automatique : sélectionne un joueur du roster puis confirme.</div></div><div id="cayIdentitySummaryV1" style="margin-top:8px;font-size:12px;opacity:.78"></div><div id="cayIdentityRowsV1" style="display:grid;gap:8px;margin-top:10px"></div>';
  stats.insertAdjacentElement('afterend',panel);return panel;
}
function refreshPlayerCards(){
  if(!lastReport||!ViewModel?.build)return false;const model=ViewModel.build(lastReport,{team:currentTeam(),bindings:lastSession?lastSession.exportBindings():store.bindings()});
  if(root.CAYPlayerCardRenderer?.render)return root.CAYPlayerCardRenderer.render(model,'stableStatsCardsV2');
  return false;
}
function renderIdentityPanel(){
  if(!lastReport)return false;const panel=ensureIdentityPanel();if(!panel)return false;
  const team=currentTeam(),tracks=(lastReport.players||[]).map(p=>({id:p.id}));lastSession=BindingSession.createSession({team,tracks,bindings:store.bindings()});
  const summary=lastSession.summary(),rows=panel.querySelector('#cayIdentityRowsV1');panel.querySelector('#cayIdentitySummaryV1').innerHTML='<b>'+summary.linked+'/'+summary.tracks+' liés</b> • '+summary.unlinked+' à identifier';
  rows.innerHTML='';
  for(const trackId of lastSession.trackIds){
    const existing=lastSession.exportBindings().find(b=>String(b.trackId)===String(trackId)),candidatePlayers=lastSession.candidates(trackId),row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:110px minmax(160px,1fr) auto auto;gap:8px;align-items:center;padding:8px;border-radius:10px;background:rgba(255,255,255,.04)';
    const label=document.createElement('strong');label.textContent='Track #'+trackId;const select=document.createElement('select');select.setAttribute('aria-label','joueur pour track '+trackId);const empty=document.createElement('option');empty.value='';empty.textContent=existing?'Modifier l’identité…':'Choisir le joueur…';select.appendChild(empty);for(const p of candidatePlayers){const o=document.createElement('option');o.value=p.id;o.textContent=(p.number==null?'':'#'+p.number+' ')+(p.displayName||'Joueur')+(p.primaryPosition?' • '+p.primaryPosition:'');select.appendChild(o);}
    const confirm=document.createElement('button');confirm.type='button';confirm.textContent='CONFIRMER';confirm.disabled=!candidatePlayers.length;confirm.onclick=()=>{if(!select.value)return;const r=lastSession.assign(trackId,select.value,{confirmed:true,source:'coach_click'});if(r.accepted){store.saveBindings(lastSession.exportBindings());renderIdentityPanel();refreshPlayerCards();}};
    const linked=document.createElement('span');linked.style.cssText='font-size:11px;opacity:.72';linked.textContent=existing?'LIÉ ✓':'NON LIÉ';if(existing){const un=document.createElement('button');un.type='button';un.textContent='DÉLIER';un.onclick=()=>{lastSession.unassign(trackId);store.saveBindings(lastSession.exportBindings());renderIdentityPanel();refreshPlayerCards();};row.append(label,select,confirm,un);}else row.append(label,select,confirm,linked);rows.appendChild(row);
  }
  refreshPlayerCards();return true;
}
function patchBridge(){
  const Bridge=root.CAYStableTrackingBridge;if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayClubRosterIdentityUIPatched)return false;
  const baseCreate=Bridge.create.bind(Bridge);Bridge.create=function(options){const instance=baseCreate(options),baseReport=instance.report.bind(instance);instance.report=function(projectors,visualOptions){const report=baseReport(projectors,visualOptions);lastReport=report;setTimeout(()=>{try{renderRoster();renderIdentityPanel();}catch(_){}},0);return report;};return instance;};Bridge.__cayClubRosterIdentityUIPatched=true;return true;
}
function install(){if(typeof document==='undefined')return false;ensureRosterPanel();renderRoster();patchBridge();return true;}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
return {TEAM_KEY,BINDING_KEY,sanitizePlayerDraft,normalizeStoredTeam,createStore,addPlayer,removePlayer,currentTeam,renderRoster,renderIdentityPanel,refreshPlayerCards,patchBridge,install};
});
