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
  // Track IDs may recur across videos; never trust unscoped legacy bindings.
  function scopedBindingKey(analysisId){
    if(typeof analysisId!=='string'||!analysisId.trim())return null;
    return BINDING_KEY+':'+encodeURIComponent(analysisId.trim());
  }
  function bindings(analysisId){
    const key=scopedBindingKey(analysisId);if(!key)return [];
    const v=read(key,[]);return Array.isArray(v)?v:[];
  }
  function saveBindings(v,analysisId){
    const key=scopedBindingKey(analysisId);if(!key)return [];
    const list=Array.isArray(v)?v:[];write(key,list);return list;
  }
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
  const kept=store.bindings(lastAnalysisId).filter(b=>clean(b.playerId)!==id);store.saveBindings(kept,lastAnalysisId);
  return {removed:true,team:next};
}

function rosterImportParser(){
  if(root.Papa?.parse)return root.Papa;
  if(typeof module==='object'&&module.exports&&typeof require==='function'){
    try{return require('./vendor/papaparse.min.js');}catch(_){}
  }
  return null;
}
let rosterParserLoading=null;
function loadRosterImportParser(){
  const parser=rosterImportParser();
  if(parser?.parse)return Promise.resolve(parser);
  if(typeof document==='undefined')return Promise.reject(new Error('CSV_PARSER_UNAVAILABLE'));
  if(rosterParserLoading)return rosterParserLoading;
  rosterParserLoading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='./vendor/papaparse.min.js';script.async=true;script.dataset.cayPapaParse='5.7.0';
    script.onload=()=>{const p=rosterImportParser();p?.parse?resolve(p):reject(new Error('CSV_PARSER_UNAVAILABLE'));};
    script.onerror=()=>reject(new Error('CSV_PARSER_LOAD_FAILED'));
    (document.head||document.documentElement).appendChild(script);
  }).catch(error=>{rosterParserLoading=null;throw error;});
  return rosterParserLoading;
}
function prepareRosterImport(text,parser,team){
  if(!parser?.parse)return {accepted:false,reason:'CSV_PARSER_REQUIRED'};
  if(typeof text!=='string'||!text.trim())return {accepted:false,reason:'ROSTER_IMPORT_EMPTY'};
  if(text.length>50000)return {accepted:false,reason:'ROSTER_IMPORT_TOO_LARGE'};
  let parsed;
  try{parsed=parser.parse(text,{skipEmptyLines:'greedy',dynamicTyping:false,delimiter:''});}
  catch(_){return {accepted:false,reason:'ROSTER_CSV_PARSE_FAILED'};}
  if(!Array.isArray(parsed?.data)||parsed.errors?.length)return {accepted:false,reason:'ROSTER_CSV_PARSE_FAILED'};
  const rows=parsed.data.slice();
  // Only map explicit spreadsheet headers; never infer identities from a player row.
  const header=v=>{
    const value=clean(v);
    if(value==='#')return 'number'; // preserve legacy #;Nom CSV headers
    const normalized=value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
    const aliases={
      number:['numero','number','n','no','num','maillot','numerodemaillot'],
      name:['nom','name','joueur','nomdujoueur','nomcomplet','prenomnom','nomprenom'],
      position:['poste','position','primaryposition']
    };
    return Object.keys(aliases).find(key=>aliases[key].includes(normalized))||null;
  };
  const headings=Array.isArray(rows[0])?rows[0].map(header):[];
  const hasHeader=headings.length>=2&&headings.length<=3&&headings.every(Boolean)
    &&new Set(headings).size===headings.length&&headings.includes('name')
    &&(headings.includes('number')||headings.includes('position'));
  const columns=hasHeader
    ?{number:headings.indexOf('number'),name:headings.indexOf('name'),position:headings.indexOf('position')}
    :{number:0,name:1,position:2};
  const headerOffset=hasHeader?1:0;
  if(hasHeader)rows.shift();
  if(!rows.length)return {accepted:false,reason:'ROSTER_IMPORT_EMPTY'};
  if(rows.length>100)return {accepted:false,reason:'ROSTER_IMPORT_OVER_100'};
  const base=team&&typeof team==='object'?team:currentTeam();
  const seen=new Set((base.roster||[]).map(p=>clean(p.displayName).toLowerCase()+'|'+(p.number??'')));
  const players=[];
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    if(!Array.isArray(row)||(hasHeader?row.length!==headings.length:(row.length!==2&&row.length!==3)))return {accepted:false,reason:'ROSTER_IMPORT_COLUMNS_INVALID',line:i+1+headerOffset};
    const number=columns.number<0?'':clean(row[columns.number]);
    const name=columns.name<0?'':clean(row[columns.name]);
    const position=columns.position<0?'':clean(row[columns.position]).toUpperCase();
    if(!name)return {accepted:false,reason:'PLAYER_NAME_REQUIRED',line:i+1+headerOffset};
    if(number&&!/^[0-9]{1,2}$/.test(number))return {accepted:false,reason:'INVALID_SHIRT_NUMBER',line:i+1+headerOffset};
    if(position&&!Domain.POSITIONS.includes(position))return {accepted:false,reason:'INVALID_PRIMARY_POSITION',line:i+1+headerOffset};
    const draft=sanitizePlayerDraft({id:'cay_import_'+Date.now().toString(36)+'_'+i+'_'+Math.random().toString(36).slice(2,9),displayName:name,number,primaryPosition:position});
    let player;
    try{player=Domain.createPlayer(draft);}catch(e){return {accepted:false,reason:e.message||'PLAYER_REJECTED',line:i+1+headerOffset};}
    const key=player.displayName.toLowerCase()+'|'+(player.number??'');
    if(seen.has(key))return {accepted:false,reason:'ROSTER_IMPORT_DUPLICATE_PLAYER',line:i+1+headerOffset};
    seen.add(key);players.push(player);
  }
  try{return {accepted:true,added:players.length,team:Domain.createTeam({...base,roster:[...(base.roster||[]),...players]})};}
  catch(e){return {accepted:false,reason:e.message||'ROSTER_IMPORT_REJECTED'};}
}
function addPlayersBulk(text,parser=rosterImportParser()){
  const result=prepareRosterImport(text,parser,currentTeam());
  if(!result.accepted)return result;
  try{return {...result,team:store.saveTeam(result.team)};}
  catch(_){return {accepted:false,reason:'ROSTER_SAVE_FAILED'};}
}

function ensureRosterPanel(){
  if(typeof document==='undefined')return null;
  let panel=document.getElementById('cayClubRosterPanelV1');if(panel)return panel;
  const anchor=document.getElementById('analysisTeamName');if(!anchor)return null;
  panel=document.createElement('section');panel.id='cayClubRosterPanelV1';
  panel.style.cssText='margin-top:12px;padding:14px;border:1px solid rgba(205,31,45,.35);border-radius:14px;background:linear-gradient(145deg,rgba(205,31,45,.08),rgba(0,0,0,.22));color:#fff';
  panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><strong>ÉQUIPE / TROMBINOSCOPE</strong><div style="font-size:11px;opacity:.68">Roster supérieur à 11 autorisé • 11 CAY maximum simultanément sur le terrain.</div></div><span id="cayRosterCountV1" style="font-size:12px;opacity:.72">0 joueur</span></div><div style="display:grid;grid-template-columns:80px minmax(150px,1fr) 100px minmax(150px,1fr) auto;gap:7px;margin-top:10px"><input id="cayRosterNumberV1" type="number" min="1" max="99" placeholder="#" aria-label="numéro"><input id="cayRosterNameV1" type="text" placeholder="Nom du joueur" aria-label="nom du joueur"><select id="cayRosterPositionV1" aria-label="poste"></select><input id="cayRosterPhotoV1" type="url" placeholder="Photo URL (optionnel)" aria-label="photo URL"><button id="cayRosterAddV1" type="button">AJOUTER</button></div><div id="cayRosterMessageV1" style="margin-top:7px;font-size:11px;opacity:.72"></div><div id="cayRosterListV1" style="display:flex;flex-wrap:wrap;gap:7px;margin-top:10px"></div>';
  const host=anchor.closest('.grid2')||anchor.parentElement;host?.insertAdjacentElement('afterend',panel);
  panel.insertAdjacentHTML('beforeend','<details style="margin-top:12px;border-top:1px solid rgba(255,255,255,.12);padding-top:10px"><summary style="cursor:pointer;font-weight:700">IMPORTER PLUSIEURS JOUEURS (CSV / EXCEL)</summary><p style="font-size:12px;opacity:.75">Colle Numéro, Nom et Poste dans l’ordre souhaité, avec ou sans en-têtes. Le collage Excel fonctionne aussi.</p><textarea id="cayRosterBulkTextV1" rows="5" aria-label="liste des joueurs" placeholder="8;Prénom Nom;CM&#10;9;Prénom Nom;ST" style="width:100%;box-sizing:border-box;resize:vertical;border-radius:8px;padding:9px;background:#171717;color:#fff;border:1px solid #555"></textarea><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px"><button id="cayRosterBulkAddV1" type="button">IMPORTER LA LISTE</button><span id="cayRosterBulkStatusV1" role="status" aria-live="polite" style="font-size:12px;opacity:.85"></span></div></details>');
  const importButton=panel.querySelector('#cayRosterBulkAddV1');
  importButton.onclick=async()=>{
    const status=panel.querySelector('#cayRosterBulkStatusV1');
    importButton.disabled=true;status.textContent='Lecture de la liste…';
    try{
      const parser=await loadRosterImportParser();
      const result=addPlayersBulk(panel.querySelector('#cayRosterBulkTextV1').value,parser);
      status.textContent=result.accepted?result.added+' joueur(s) importé(s) ✓':'Import refusé : '+result.reason+(result.line?' (ligne '+result.line+')':'');
      if(result.accepted){panel.querySelector('#cayRosterBulkTextV1').value='';renderRoster();renderIdentityPanel();}
    }catch(error){status.textContent='Import indisponible : '+(error?.message||'CSV_PARSER_UNAVAILABLE');}
    finally{importButton.disabled=false;}
  };

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
let lastReport=null,lastSession=null,lastAnalysisId=null;
let analysisSequence=0;
function newAnalysisScope(){
  const uuid=root.crypto&&typeof root.crypto.randomUUID==='function'?root.crypto.randomUUID():null;
  return uuid||'cay_run_'+Date.now().toString(36)+'_'+(++analysisSequence).toString(36)+'_'+Math.random().toString(36).slice(2);
}
function ensureIdentityPanel(){
  if(typeof document==='undefined')return null;let panel=document.getElementById('cayIdentityBindingPanelV1');if(panel)return panel;
  const stats=document.getElementById('stablePlayerStatsV2')||document.getElementById('trackingGallery');if(!stats)return null;
  panel=document.createElement('section');panel.id='cayIdentityBindingPanelV1';panel.style.cssText='margin-top:12px;padding:14px;border:1px solid rgba(205,31,45,.4);border-radius:14px;background:#0d0d0f;color:#fff';panel.innerHTML='<div><strong>IDENTIFIER LES JOUEURS</strong><div style="font-size:11px;opacity:.68">Aucune identité automatique : sélectionne un joueur du roster puis confirme.</div></div><div id="cayIdentitySummaryV1" style="margin-top:8px;font-size:12px;opacity:.78"></div><div id="cayIdentityRowsV1" style="display:grid;gap:8px;margin-top:10px"></div>';
  stats.insertAdjacentElement('afterend',panel);return panel;
}
function refreshPlayerCards(){
  if(!lastReport||!ViewModel?.build)return false;const model=ViewModel.build(lastReport,{team:currentTeam(),bindings:lastSession?lastSession.exportBindings():store.bindings(lastAnalysisId)});
  if(root.CAYPlayerCardRenderer?.render)return root.CAYPlayerCardRenderer.render(model,'stableStatsCardsV2');
  return false;
}
function renderIdentityPanel(){
  if(!lastReport)return false;const panel=ensureIdentityPanel();if(!panel)return false;
  const team=currentTeam(),tracks=(lastReport.players||[]).map(p=>({id:p.id}));lastSession=BindingSession.createSession({team,tracks,bindings:store.bindings(lastAnalysisId)});
  const summary=lastSession.summary(),rows=panel.querySelector('#cayIdentityRowsV1');panel.querySelector('#cayIdentitySummaryV1').innerHTML='<b>'+summary.linked+'/'+summary.tracks+' liés</b> • '+summary.unlinked+' à identifier';
  rows.innerHTML='';
  for(const trackId of lastSession.trackIds){
    const existing=lastSession.exportBindings().find(b=>String(b.trackId)===String(trackId)),candidatePlayers=lastSession.candidates(trackId),row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:110px minmax(160px,1fr) auto auto;gap:8px;align-items:center;padding:8px;border-radius:10px;background:rgba(255,255,255,.04)';
    const label=document.createElement('strong');label.textContent='Track #'+trackId;const select=document.createElement('select');select.setAttribute('aria-label','joueur pour track '+trackId);const empty=document.createElement('option');empty.value='';empty.textContent=existing?'Modifier l’identité…':'Choisir le joueur…';select.appendChild(empty);for(const p of candidatePlayers){const o=document.createElement('option');o.value=p.id;o.textContent=(p.number==null?'':'#'+p.number+' ')+(p.displayName||'Joueur')+(p.primaryPosition?' • '+p.primaryPosition:'');select.appendChild(o);}
    const confirm=document.createElement('button');confirm.type='button';confirm.textContent='CONFIRMER';confirm.disabled=!candidatePlayers.length;confirm.onclick=()=>{if(!select.value)return;const r=lastSession.assign(trackId,select.value,{confirmed:true,source:'coach_click'});if(r.accepted){store.saveBindings(lastSession.exportBindings(),lastAnalysisId);renderIdentityPanel();refreshPlayerCards();}};
    const linked=document.createElement('span');linked.style.cssText='font-size:11px;opacity:.72';linked.textContent=existing?'LIÉ ✓':'NON LIÉ';if(existing){const un=document.createElement('button');un.type='button';un.textContent='DÉLIER';un.onclick=()=>{lastSession.unassign(trackId);store.saveBindings(lastSession.exportBindings(),lastAnalysisId);renderIdentityPanel();refreshPlayerCards();};row.append(label,select,confirm,un);}else row.append(label,select,confirm,linked);rows.appendChild(row);
  }
  refreshPlayerCards();return true;
}
function patchBridge(){
  const Bridge=root.CAYStableTrackingBridge;if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayClubRosterIdentityUIPatched)return false;
  const baseCreate=Bridge.create.bind(Bridge);Bridge.create=function(options){const instance=baseCreate(options),baseReport=instance.report.bind(instance),analysisId=newAnalysisScope();instance.report=function(projectors,visualOptions){const report=baseReport(projectors,visualOptions);if(lastAnalysisId!==analysisId){lastSession=null;lastAnalysisId=analysisId;}lastReport=report;setTimeout(()=>{try{renderRoster();renderIdentityPanel();}catch(_){}},0);return report;};return instance;};Bridge.__cayClubRosterIdentityUIPatched=true;return true;
}
function install(){if(typeof document==='undefined')return false;ensureRosterPanel();renderRoster();patchBridge();return true;}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
return {TEAM_KEY,BINDING_KEY,sanitizePlayerDraft,normalizeStoredTeam,createStore,addPlayer,prepareRosterImport,addPlayersBulk,rosterImportParser,loadRosterImportParser,removePlayer,currentTeam,renderRoster,renderIdentityPanel,refreshPlayerCards,patchBridge,install};
});
