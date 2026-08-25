(function(root){
'use strict';

function $(id){ return document.getElementById(id); }
function clamp01(v){ return Math.max(0,Math.min(1,Number(v)||0)); }
function appearanceVector(f){
  if(Array.isArray(f)) return f.map(Number).filter(Number.isFinite);
  if(!f||typeof f!=='object') return null;
  const h=Number(f.h)||0,s=Number(f.s)||0,v=Number(f.v)||0;
  const r=Number(f.r)||0,g=Number(f.g)||0,b=Number(f.b)||0;
  const a=h*Math.PI/180;
  return [Math.cos(a),Math.sin(a),s,v,r/255,g/255,b/255];
}
function ensureStatsPanel(){
  let panel=$('stablePlayerStatsV2');
  if(panel)return panel;
  const anchor=$('trackingGallery')||$('trackingSection')||$('runTracking');
  if(!anchor)return null;
  panel=document.createElement('section');
  panel.id='stablePlayerStatsV2';
  panel.style.cssText='margin-top:16px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(0,0,0,.22)';
  panel.innerHTML='<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px"><strong>STATISTIQUES INDIVIDUELLES — TRACKING LONGUE DURÉE</strong><span id="stableStatsCoverageV2" style="opacity:.72;font-size:12px">—</span></div><div id="stableStatsCardsV2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px"></div>';
  if(anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor.nextSibling);
  return panel;
}
function qualityBadge(q){
  const text=q||'INDISPONIBLE';
  const bg=text==='FIABLE'?'#215f39':text==='PARTIEL'?'#6c511d':'#4b4b52';
  return '<span style="display:inline-block;padding:2px 7px;border-radius:999px;background:'+bg+';font-size:10px;font-weight:800">'+text+'</span>';
}
function heatmapHtml(hm){
  if(!hm||!Array.isArray(hm.cells))return '';
  const max=Math.max(1,Number(hm.max)||1);let out='<div style="display:grid;grid-template-columns:repeat('+hm.cols+',1fr);gap:2px;margin-top:8px">';
  for(const row of hm.cells)for(const n of row){
    const op=.08+.82*(Number(n)||0)/max;
    out+='<span title="'+n+' observation(s)" style="height:12px;border-radius:2px;background:rgba(99,216,137,'+op.toFixed(2)+')"></span>';
  }
  return out+'</div>';
}
function renderPlayerStats(report){
  if(!report)return;
  ensureStatsPanel();
  const cards=$('stableStatsCardsV2'),coverage=$('stableStatsCoverageV2');
  if(!cards)return;
  const players=report.players||[];
  const pct=Math.round((report.team?.avgMetricCoverage||0)*100);
  if(coverage)coverage.textContent=report.team?.playersWithMetricData?('couverture métrique moyenne '+pct+' %'):'métrique terrain indisponible — stats observables conservées';
  cards.innerHTML=players.map(p=>{
    const metric=p.metric||{};
    const metricText=metric.metricCoverage>0
      ? ((metric.distanceM??0)+' m • '+(metric.avgSpeedKmh??'—')+' km/h moy. • '+(metric.maxSpeedKmh??'—')+' km/h max • '+(metric.sprintCount??'—')+' sprint(s) • couverture '+Math.round(metric.metricCoverage*100)+' %')
      : 'Distance / km/h / sprints : INDISPONIBLE (projection métrique non validée)';
    return '<article style="padding:10px;border-radius:10px;background:rgba(255,255,255,.045);font-size:12px;line-height:1.45">'+
      '<div style="display:flex;justify-content:space-between;align-items:center"><strong>'+(p.cat==='goalkeeper'?'GK':'J')+' #'+p.id+'</strong>'+qualityBadge(p.identityQuality)+'</div>'+
      '<div>Temps observé : <b>'+(p.observedDuration||0).toFixed(1)+' s</b> • '+p.observations+' obs.</div>'+
      '<div>Segments : '+(p.segments||[]).join(', ')+' • ré-ID : '+(p.reidentifications||0)+'</div>'+
      '<div>Déplacement normalisé : '+(p.normalizedTravel??0)+'</div>'+
      '<div style="margin-top:4px;opacity:.8">'+metricText+'</div>'+heatmapHtml(p.heatmap)+'</article>';
  }).join('');
}
function drawLongTrackFrame(c,assigned){
  const x=c.getContext('2d');
  x.font='bold '+Math.max(11,c.width/86)+'px Arial';
  for(const a of assigned){
    const tr=a.track,b=a.b,col=a.cat==='goalkeeper'?'#56a9ff':'#63d889';
    const seg=tr.segment;
    const path=(tr.fullPath||[]).filter(p=>p.segment===seg).slice(-120);
    if(path.length>1){
      x.strokeStyle=col;x.globalAlpha=.68;x.lineWidth=Math.max(2,c.width/520);x.beginPath();
      path.forEach((p,i)=>{const px=p.x*c.width,py=p.y*c.height;i?x.lineTo(px,py):x.moveTo(px,py);});x.stroke();x.globalAlpha=1;
    }
    x.strokeStyle=col;x.lineWidth=Math.max(2,c.width/430);x.strokeRect(b.x,b.y,b.w,b.h);
    const label=(a.cat==='goalkeeper'?'GK':'J')+' #'+a.trackId;
    const tw=x.measureText(label).width+8,th=Math.max(16,c.width/70),ly=Math.max(0,b.y-th);
    x.fillStyle=col;x.fillRect(b.x,ly,tw,th);x.fillStyle='#08100b';x.textBaseline='middle';x.fillText(label,b.x+4,ly+th/2);
  }
  x.textBaseline='alphabetic';
}
async function runTrackingLongTermStable(){
  if(typeof root.CAYStableTrackingBridge?.create!=='function')throw new Error('bridge tracking longue durée indisponible');
  if(!currentFile){ status($('trackingStatus'),'Charge d’abord une vidéo.','warning');return; }
  if(refsFor('team').length<3){ status($('trackingStatus'),'Ajoute au moins 3 références de ton équipe.','warning');return; }
  const start=trackingStart(),duration=+$('trackDuration').value||60,step=+$('trackStep').value||.5;
  const end=Math.min(video.duration-.2,start+duration),times=[];for(let t=start;t<=end+.001;t+=step)times.push(t);
  $('runTracking').disabled=true;$('trackingProgress').classList.remove('hidden');$('trackingGallery').innerHTML='';$('exportTracking').disabled=true;
  ['tFrames','tIds','tStable','tMatches'].forEach(id=>$(id).textContent='0');$('tLongest').textContent='0';$('tSegments').textContent='1';
  ensureStatsPanel();if($('stableStatsCardsV2'))$('stableStatsCardsV2').innerHTML='';
  const bridge=root.CAYStableTrackingBridge.create({maxPlayers:11,lostAfter:8,reidentifyArchived:true,reidAppearanceThreshold:.16});
  const frames=[];let prevSig=null,prevDetCount=0,sparseFrames=0;
  try{
    const model=await getModel(),stride=Math.max(1,Math.floor(times.length/12));
    for(let i=0;i<times.length;i++){
      const t=times[i],c=await frame(t,900),poly=trackingPoly(t,c);if(!poly)continue;
      let raw=await detectTracking(model,c);
      const inField=[];for(const b of raw){const fs=playerFieldState(b,poly,c.width,c.height);if(fs.state==='IN'||fs.state==='EDGE')inField.push(b);}
      const frameCls=classifyFootballFrame(c,inField),dets=[];
      for(let bi=0;bi<inField.length;bi++){
        const b=inField[bi],cls=frameCls[bi];if(cls.cat!=='team'&&cls.cat!=='goalkeeper')continue;
        const p=normTrackAnchor(b,c);dets.push({b,cat:cls.cat,feature:appearanceVector(cls.feature),x:clamp01(p.x),y:clamp01(p.y),source:b.source||'unknown',score:cls.score,isCAY:true});
      }
      const sig=trackingImageSignature(c),visualDiff=prevSig?hd(prevSig,sig):0;
      const countShock=prevDetCount>=5&&dets.length<=Math.max(1,prevDetCount*.34);
      const strongCut=!!prevSig&&(visualDiff>.74||(visualDiff>.52&&countShock));
      if(dets.length<=1&&prevDetCount>=5)sparseFrames++;else if(dets.length>=3)sparseFrames=0;
      const segmentBreak=strongCut||sparseFrames>=2;
      const assigned=bridge.processFrame(dets,t,{width:c.width,height:c.height,maxPlayers:11,allowNew:dets.length>=2||bridge.state.active.length>0,segmentBreak,segmentReason:strongCut?'visual_cut':'sparse_team'});
      if(segmentBreak)sparseFrames=0;
      drawLongTrackFrame(c,assigned);prevSig=sig;prevDetCount=dets.length;
      frames.push({time:+t.toFixed(2),label:tf(t),segment:bridge.state.segment,detections:assigned.map(a=>({id:a.trackId,cat:a.cat,x:+a.x.toFixed(4),y:+a.y.toFixed(4),source:a.source,score:+Number(a.score||0).toFixed(4)}))});
      if(i%stride===0||i===times.length-1){const card=document.createElement('div');card.className='trackcard';const copy=document.createElement('canvas');copy.width=c.width;copy.height=c.height;copy.getContext('2d').drawImage(c,0,0);const info=document.createElement('div');info.className='trackinfo';info.innerHTML='<span>'+tf(t)+'</span><strong>'+assigned.length+' joueur(s)</strong>';card.append(copy,info);$('trackingGallery').append(card);}
      const sum=bridge.summary(),stable=sum.tracks.filter(s=>s.observations>=5).length,longest=sum.tracks.reduce((m,s)=>Math.max(m,s.observations||0),0);
      $('tFrames').textContent=i+1;$('tIds').textContent=sum.rosterTotal;$('tStable').textContent=stable;$('tLongest').textContent=longest+' img';$('tMatches').textContent=sum.totalAssociations;$('tSegments').textContent=sum.segments;$('trackingBar').style.width=Math.round((i+1)/times.length*100)+'%';
      status($('trackingStatus'),'Tracking longue durée '+(i+1)+'/'+times.length+' • '+tf(t)+' • '+assigned.length+' joueur(s)');await new Promise(r=>setTimeout(r,0));
    }
    const sum=bridge.summary(),playerStats=bridge.report({});
    const tracks=sum.tracks.map(s=>({...s,seen:s.observations,lastTime:s.lastTime,normalizedTravel:s.normalizedTravel}));
    const stable=tracks.filter(t=>t.seen>=5).length;
    lastTrackingReport={version:'STABLE_LONG_TERM_V2',video:currentFile.name,team:($('analysisTeamName')?.value||'').trim(),start:+start.toFixed(2),end:+end.toFixed(2),step,createdIds:sum.rosterTotal,totalAssociations:sum.totalAssociations,segments:sum.segments,maxVisible:sum.maxVisible,reidentified:sum.reidentified,manualMerges:sum.manualMerges,tracks,frames,playerStats,unavailable:playerStats.unavailable};
    renderPlayerStats(playerStats);$('exportTracking').disabled=false;
    status($('trackingStatus'),'Tracking longue durée terminé ✓ • '+sum.segments+' segment(s) • max '+sum.maxVisible+'/11 • roster '+sum.rosterTotal+' • '+stable+' track(s) stables','success');
    return lastTrackingReport;
  }catch(err){status($('trackingStatus'),'Erreur tracking longue durée : '+err.message,'warning');throw err;}
  finally{$('runTracking').disabled=false;}
}
function install(){
  if(typeof root.CAYStableTrackingBridge?.create!=='function')return;
  try{ runTrackingTest=runTrackingLongTermStable; }catch(_){ root.runTrackingTest=runTrackingLongTermStable; }
  const btn=$('runTracking');if(btn)btn.onclick=runTrackingLongTermStable;
  ensureStatsPanel();
  root.runTrackingLongTermStable=runTrackingLongTermStable;
  root.renderCAYPlayerStats=renderPlayerStats;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})(typeof globalThis!=='undefined'?globalThis:window);
