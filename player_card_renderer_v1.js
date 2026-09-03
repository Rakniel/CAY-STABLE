(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerCardRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
function metricText(metric,unit){
  if(!metric||metric.status==='INDISPONIBLE'||!finite(metric.value))return 'INDISPONIBLE';
  const value=Number(metric.value),rounded=unit==='m'?Math.round(value):unit==='sprint'?Math.round(value):value.toFixed(1);
  return rounded+(unit==='sprint'?'':(' '+unit));
}
function badge(status){
  const s=String(status||'INDISPONIBLE').toUpperCase();
  const bg=s==='FIABLE'?'#20663d':s==='PARTIEL'?'#7a571c':s==='DISPONIBLE'||s==='LIÉ'?'#8d1018':'#4b4b52';
  return '<span style="padding:3px 8px;border-radius:999px;background:'+bg+';font-size:10px;font-weight:900;letter-spacing:.03em">'+esc(s)+'</span>';
}
function heatmapHtml(h){
  if(!h||!Array.isArray(h.cells)||!h.cells.length)return '<div style="opacity:.62">Heatmap indisponible</div>';
  const cols=Number(h.cols)||h.cells[0]?.length||1,max=Math.max(1,...h.cells.flat().map(Number).filter(Number.isFinite));
  let out='<div aria-label="heatmap joueur" style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:2px;background:#09090b;padding:5px;border-radius:8px;border:1px solid rgba(255,255,255,.08)">';
  for(const row of h.cells)for(const n of row){const a=.08+.82*Math.max(0,Number(n)||0)/max;out+='<span style="height:10px;border-radius:2px;background:rgba(205,31,45,'+a.toFixed(2)+')" title="'+esc(n)+'"></span>';}
  return out+'</div>';
}
function rosterHeader(card){
  const r=card?.roster||null,linked=r&&r.status==='LIÉ';
  const fallback=(card?.category==='goalkeeper'?'GK':'J')+' • track '+esc(card?.id??'—');
  if(!linked)return '<div><strong style="font-size:16px">'+fallback+'</strong><div style="font-size:10px;opacity:.58;margin-top:2px">Roster non lié — aucune identité déduite automatiquement</div></div>';
  const name=esc(r.displayName||('Joueur '+(r.number??''))||fallback),num=r.number==null?'':' #'+esc(r.number),position=[r.primaryPosition,r.secondaryPosition].filter(Boolean).map(esc).join(' / ');
  const img=r.photoUrl?'<img src="'+esc(r.photoUrl)+'" alt="portrait '+name+'" style="width:44px;height:44px;object-fit:cover;border-radius:10px;border:1px solid rgba(205,31,45,.55);background:#111">':'<div aria-hidden="true" style="width:44px;height:44px;border-radius:10px;border:1px solid rgba(205,31,45,.35);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;background:#111">CAY</div>';
  return '<div style="display:flex;align-items:center;gap:9px">'+img+'<div><strong style="font-size:16px">'+name+num+'</strong><div style="font-size:10px;opacity:.66;margin-top:2px">'+(position||'Poste non renseigné')+' • track '+esc(card?.id??'—')+'</div></div></div>';
}
function cardHtml(card){
  const p=card?.presence||{},obs=card?.observedVisuals||{},pitch=card?.pitchVisuals||{},m=card?.metrics||{};
  const obsLabel=obs.status==='DISPONIBLE'?'CAMÉRA • '+(p.trackingCoverage||0)+' %':'CAMÉRA INDISPONIBLE';
  const pitchLabel=pitch.status==='DISPONIBLE'?'TERRAIN • '+(pitch.metricCoverage||0)+' %':'TERRAIN INDISPONIBLE';
  return '<article class="cay-player-card-v1" style="padding:14px;border-radius:14px;background:linear-gradient(145deg,#151518,#09090b);border:1px solid rgba(205,31,45,.42);box-shadow:0 8px 24px rgba(0,0,0,.22);color:#fff">'+
    '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center">'+rosterHeader(card)+badge(card?.identity?.status)+'</div>'+
    '<div style="margin-top:5px;font-size:11px;opacity:.72">'+esc(obsLabel)+' • '+esc(pitchLabel)+'</div>'+
    '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px;font-size:12px">'+
      '<div><span style="opacity:.65">Temps observé</span><br><b>'+(finite(p.observedDuration)?Number(p.observedDuration).toFixed(1)+' s':'—')+'</b></div>'+
      '<div><span style="opacity:.65">Observations</span><br><b>'+esc(p.observations||0)+'</b></div>'+
      '<div><span style="opacity:.65">Distance</span><br><b>'+esc(metricText(m.distanceM,'m'))+'</b></div>'+
      '<div><span style="opacity:.65">Vitesse max</span><br><b>'+esc(metricText(m.maxSpeedKmh,'km/h'))+'</b></div>'+
      '<div><span style="opacity:.65">Vitesse moyenne</span><br><b>'+esc(metricText(m.avgSpeedKmh,'km/h'))+'</b></div>'+
      '<div><span style="opacity:.65">Sprints</span><br><b>'+esc(metricText(m.sprintCount,'sprint'))+'</b></div>'+
    '</div>'+
    '<div style="margin-top:10px"><div style="font-size:10px;font-weight:800;letter-spacing:.06em;margin-bottom:5px">PRÉSENCE CAMÉRA — PAS UNE CARTE TACTIQUE</div>'+heatmapHtml(obs.heatmap)+'</div>'+
    (pitch.status==='DISPONIBLE'?'<div style="margin-top:10px"><div style="font-size:10px;font-weight:800;letter-spacing:.06em;margin-bottom:5px">OCCUPATION TERRAIN VALIDÉE</div>'+heatmapHtml(pitch.heatmap)+'</div>':'')+
    '<div style="margin-top:8px;font-size:10px;opacity:.58">Stats physiques publiées uniquement sur projection terrain validée.</div></article>';
}
function render(model,target){
  const el=typeof target==='string'?(typeof document!=='undefined'?document.getElementById(target):null):target;
  if(!el)return false;
  const cards=Array.isArray(model?.players)?model.players:[];
  el.innerHTML=cards.length?cards.map(cardHtml).join(''):'<div style="opacity:.7">Aucune fiche joueur disponible.</div>';
  return true;
}
function install(){
  const Bridge=typeof globalThis!=='undefined'?globalThis.CAYStableTrackingBridge:null;
  if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayPlayerCardRendererPatched)return false;
  const baseCreate=Bridge.create.bind(Bridge);
  Bridge.create=function(options){
    const instance=baseCreate(options),baseReport=instance.report.bind(instance);
    instance.report=function(projectors,visualOptions){
      const report=baseReport(projectors,visualOptions);
      if(typeof document!=='undefined'&&report?.playerCards?.players)render(report.playerCards,'stableStatsCardsV2');
      return report;
    };
    return instance;
  };
  Bridge.__cayPlayerCardRendererPatched=true;
  return true;
}
if(typeof document!=='undefined')install();
return {cardHtml,rosterHeader,heatmapHtml,metricText,render,install};
});
