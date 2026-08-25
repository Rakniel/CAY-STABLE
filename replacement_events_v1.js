(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYReplacementEvents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  function normalizeEvent(raw,knownIds){
    if(!raw||raw.validated!==true)return {accepted:false,reason:'EVENT_NOT_VALIDATED'};
    const type=String(raw.type||raw.kind||'').toUpperCase();
    if(type!=='REPLACEMENT'&&type!=='SUBSTITUTION')return {accepted:false,reason:'UNSUPPORTED_EVENT_TYPE'};
    const outId=Number(raw.outPlayerId),inId=Number(raw.inPlayerId),time=Number(raw.time);
    if(!Number.isInteger(outId)||!Number.isInteger(inId)||outId===inId)return {accepted:false,reason:'INVALID_PLAYER_IDS'};
    if(!Number.isFinite(time)||time<0)return {accepted:false,reason:'INVALID_TIME'};
    if(knownIds&&(!knownIds.has(outId)||!knownIds.has(inId)))return {accepted:false,reason:'UNKNOWN_PLAYER_ID'};
    const confidence=Number.isFinite(Number(raw.confidence))?clamp01(raw.confidence):1;
    if(confidence<.8)return {accepted:false,reason:'VALIDATION_CONFIDENCE_TOO_LOW'};
    return {accepted:true,event:{
      type:'REPLACEMENT',validated:true,outPlayerId:outId,inPlayerId:inId,time:+time.toFixed(3),
      segment:Number.isInteger(Number(raw.segment))?Number(raw.segment):null,
      source:raw.source||raw.provenance||'manual_validation',confidence:+confidence.toFixed(4),
      note:raw.note||null
    }};
  }
  function buildValidatedReplacementLayer(events,playerIds){
    const knownIds=playerIds?new Set(playerIds.map(Number)):null;
    const accepted=[],rejected=[];
    for(const raw of events||[]){
      const r=normalizeEvent(raw,knownIds);
      if(r.accepted)accepted.push(r.event); else rejected.push({reason:r.reason,event:raw||null});
    }
    accepted.sort((a,b)=>a.time-b.time||a.outPlayerId-b.outPlayerId||a.inPlayerId-b.inPlayerId);
    const deduped=[],seen=new Set();
    for(const e of accepted){
      const key=`${e.outPlayerId}:${e.inPlayerId}:${e.time}:${e.segment??'x'}`;
      if(seen.has(key)){ rejected.push({reason:'DUPLICATE_EVENT',event:e}); continue; }
      seen.add(key); deduped.push(e);
    }
    const byPlayer={};
    for(const e of deduped){
      (byPlayer[e.outPlayerId]||(byPlayer[e.outPlayerId]=[])).push({direction:'OUT',counterpartId:e.inPlayerId,...e});
      (byPlayer[e.inPlayerId]||(byPlayer[e.inPlayerId]=[])).push({direction:'IN',counterpartId:e.outPlayerId,...e});
    }
    return {
      events:deduped,byPlayer,confirmedCount:deduped.length,
      quality:deduped.length?'FIABLE':'INDISPONIBLE',
      rejectedCount:rejected.length,rejected,
      rule:'SEULS_LES_EVENEMENTS_EXPLICITEMENT_VALIDES_SONT_COMPTES'
    };
  }
  function applyToPlayerCard(card,layer){
    const events=(layer&&layer.byPlayer&&layer.byPlayer[card.id])||[];
    return {...card,replacementEvents:events.map(e=>({...e})),rosterState:{...(card.rosterState||{}),replacementConfirmed:events.length>0,replacementReason:events.length?'événement de remplacement explicitement validé':'aucun événement de remplacement validé'}};
  }
  return {normalizeEvent,buildValidatedReplacementLayer,applyToPlayerCard};
});
