(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYReplacementEvents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  function normalizePlayerId(value){
    if(typeof value==='number')return Number.isInteger(value)?value:null;
    if(typeof value==='string'){
      const trimmed=value.trim();
      if(!trimmed)return null;
      if(/^\d+$/.test(trimmed)){
        const numeric=Number(trimmed);
        return Number.isSafeInteger(numeric)?numeric:null;
      }
      return trimmed;
    }
    return null;
  }
  const comparePlayerIds=(a,b)=>{
    if(typeof a==='number'&&typeof b==='number')return a-b;
    return String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'});
  };
  function normalizeEvent(raw,knownIds){
    if(!raw||raw.validated!==true)return {accepted:false,reason:'EVENT_NOT_VALIDATED'};
    const type=String(raw.type||raw.kind||'').toUpperCase();
    if(type!=='REPLACEMENT'&&type!=='SUBSTITUTION')return {accepted:false,reason:'UNSUPPORTED_EVENT_TYPE'};
    const outId=normalizePlayerId(raw.outPlayerId),inId=normalizePlayerId(raw.inPlayerId),time=Number(raw.time);
    if(outId===null||inId===null||outId===inId)return {accepted:false,reason:'INVALID_PLAYER_IDS'};
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
    const normalizedKnownIds=Array.isArray(playerIds)?playerIds.map(normalizePlayerId):null;
    const knownIds=normalizedKnownIds?new Set(normalizedKnownIds.filter(id=>id!==null)):null;
    const accepted=[],rejected=[];
    for(const raw of events||[]){
      const r=normalizeEvent(raw,knownIds);
      if(r.accepted)accepted.push(r.event); else rejected.push({reason:r.reason,event:raw||null});
    }
    accepted.sort((a,b)=>a.time-b.time||comparePlayerIds(a.outPlayerId,b.outPlayerId)||comparePlayerIds(a.inPlayerId,b.inPlayerId));
    const deduped=[],seen=new Set();
    for(const e of accepted){
      const key=`${typeof e.outPlayerId}:${e.outPlayerId}|${typeof e.inPlayerId}:${e.inPlayerId}|${e.time}|${e.segment??'x'}`;
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
      idPolicy:'IDS_PERSISTANTS_CHAINE_OU_NUMERIQUES_SANS_COERCITION_DESTRUCTIVE',
      rule:'SEULS_LES_EVENEMENTS_EXPLICITEMENT_VALIDES_SONT_COMPTES'
    };
  }
  function auditRosterTimeline(layer,initialActiveIds,options){
    const maxActive=Math.max(1,Number(options&&options.maxActive)||11);
    if(!Array.isArray(initialActiveIds)||initialActiveIds.length===0){
      return {
        quality:'INDISPONIBLE',reason:'INITIAL_LINEUP_NOT_VALIDATED',maxActive,
        initialActiveIds:[],acceptedEvents:[],rejectedEvents:[],snapshots:[],finalActiveIds:[],
        rule:'AUCUN_ETAT_DE_ROSTER_N_EST_INFERE_SANS_COMPOSITION_INITIALE_VALIDEE'
      };
    }
    const initial=initialActiveIds.map(normalizePlayerId);
    if(initial.some(id=>id===null)||new Set(initial).size!==initial.length||initial.length>maxActive){
      return {
        quality:'INDISPONIBLE',reason:'INVALID_INITIAL_LINEUP',maxActive,
        initialActiveIds:initial,acceptedEvents:[],rejectedEvents:[],snapshots:[],finalActiveIds:[],
        rule:'COMPOSITION_INITIALE_INVALIDE_AUCUNE_TIMELINE_CALCULEE'
      };
    }
    const active=new Set(initial),acceptedEvents=[],rejectedEvents=[],snapshots=[];
    const events=(layer&&Array.isArray(layer.events)?layer.events:[]).slice().sort((a,b)=>a.time-b.time);
    for(const event of events){
      let reason=null;
      if(!active.has(event.outPlayerId)) reason='OUT_PLAYER_NOT_ACTIVE';
      else if(active.has(event.inPlayerId)) reason='IN_PLAYER_ALREADY_ACTIVE';
      if(reason){
        rejectedEvents.push({reason,event:{...event},activeIds:[...active].sort(comparePlayerIds)});
        continue;
      }
      const next=new Set(active); next.delete(event.outPlayerId); next.add(event.inPlayerId);
      if(next.size>maxActive){
        rejectedEvents.push({reason:'MAX_ACTIVE_PLAYERS_EXCEEDED',event:{...event},activeIds:[...active].sort(comparePlayerIds)});
        continue;
      }
      active.clear(); for(const id of next)active.add(id);
      acceptedEvents.push({...event});
      snapshots.push({time:event.time,segment:event.segment,activeIds:[...active].sort(comparePlayerIds),count:active.size,source:event.source});
    }
    return {
      quality:rejectedEvents.length?'PARTIEL':'FIABLE',reason:rejectedEvents.length?'INCONSISTENT_VALIDATED_REPLACEMENTS':null,
      maxActive,initialActiveIds:initial.slice().sort(comparePlayerIds),acceptedEvents,rejectedEvents,snapshots,
      finalActiveIds:[...active].sort(comparePlayerIds),coverage:{validatedEvents:events.length,consistentEvents:acceptedEvents.length,rejectedEvents:rejectedEvents.length},
      idPolicy:'IDS_PERSISTANTS_CHAINE_OU_NUMERIQUES_SANS_COERCITION_DESTRUCTIVE',
      rule:'TIMELINE_ROSTER_CALCULEE_UNIQUEMENT_DEPUIS_COMPOSITION_INITIALE_ET_REMPLACEMENTS_VALIDES'
    };
  }
  function applyToPlayerCard(card,layer){
    const events=(layer&&layer.byPlayer&&layer.byPlayer[card.id])||[];
    return {...card,replacementEvents:events.map(e=>({...e})),rosterState:{...(card.rosterState||{}),replacementConfirmed:events.length>0,replacementReason:events.length?'événement de remplacement explicitement validé':'aucun événement de remplacement validé'}};
  }
  return {normalizePlayerId,normalizeEvent,buildValidatedReplacementLayer,auditRosterTimeline,applyToPlayerCard};
});