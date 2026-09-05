(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallKickEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const round=(v,n=3)=>Number(Number(v).toFixed(n));
  const pointOf=o=>{
    if(!o)return null;
    const x=finite(o.pitchX)?Number(o.pitchX):(finite(o.xM)?Number(o.xM):null);
    const y=finite(o.pitchY)?Number(o.pitchY):(finite(o.yM)?Number(o.yM):null);
    return x===null||y===null?null:{x,y};
  };
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const presentMarker=value=>value!==undefined&&value!==null&&!(typeof value==='string'&&value.trim()==='');
  function continuityKey(row){
    if(!row)return null;
    if(presentMarker(row.segment))return `segment:${String(row.segment)}`;
    if(presentMarker(row.segmentId))return `segment:${String(row.segmentId)}`;
    if(presentMarker(row.shotId))return `shot:${String(row.shotId)}`;
    if(presentMarker(row.planId))return `plan:${String(row.planId)}`;
    return null;
  }
  function continuousPair(a,b,maxObservationGapSec){
    const dt=Number(b?.time)-Number(a?.time);
    if(!(dt>0)||dt>maxObservationGapSec)return false;
    return continuityKey(a)===continuityKey(b);
  }
  function playerPoint(sample,id){
    const p=(sample?.players||[]).find(x=>String(x?.id??x?.playerId)===String(id));
    return pointOf(p);
  }
  function usableBall(ball,minBallConfidence){
    if(!ball||ball.valid===false||ball.visible===false||!pointOf(ball))return false;
    const confidence=finite(ball.confidence)?Number(ball.confidence):0;
    return confidence>=minBallConfidence;
  }
  function sampleRows(samples,minBallConfidence){
    return (samples||[]).filter(s=>finite(s?.time)&&usableBall(s?.ball,minBallConfidence)).slice().sort((a,b)=>Number(a.time)-Number(b.time));
  }
  function localSpeed(rows,i,maxObservationGapSec){
    if(i<=0||i>=rows.length)return null;
    const a=rows[i-1],b=rows[i];
    if(!continuousPair(a,b,maxObservationGapSec))return null;
    const dt=Number(b.time)-Number(a.time);
    return dist(pointOf(a.ball),pointOf(b.ball))/dt;
  }
  function validatePassKick(samples,event,options){
    const cfg={
      windowSec:finite(options?.windowSec)?Number(options.windowSec):.55,
      minBallConfidence:finite(options?.minBallConfidence)?Math.max(0,Math.min(1,Number(options.minBallConfidence))):.65,
      minReleaseSpeedMps:finite(options?.minReleaseSpeedMps)?Number(options.minReleaseSpeedMps):3,
      minSpeedGainMps:finite(options?.minSpeedGainMps)?Number(options.minSpeedGainMps):1.2,
      minSeparationGainM:finite(options?.minSeparationGainM)?Number(options.minSeparationGainM):.8,
      maxOwnerDistanceAtReleaseM:finite(options?.maxOwnerDistanceAtReleaseM)?Number(options.maxOwnerDistanceAtReleaseM):2.8,
      minObservations:Math.max(3,Math.round(finite(options?.minObservations)?Number(options.minObservations):4)),
      maxObservationGapSec:finite(options?.maxObservationGapSec)?Math.max(.001,Number(options.maxObservationGapSec)):.75
    };
    if(!event||event.type!=='PASS'||!finite(event.time)||!finite(event.transitionSec)||event.fromPlayerId===undefined){
      return {status:'INDISPONIBLE',reason:'PASS_EVENT_METADATA_MISSING'};
    }
    const start=Number(event.time)-Number(event.transitionSec),rows=sampleRows(samples,cfg.minBallConfidence).filter(r=>Math.abs(Number(r.time)-start)<=cfg.windowSec);
    if(rows.length<cfg.minObservations)return {status:'INDISPONIBLE',reason:'INSUFFICIENT_RELIABLE_BALL_OBSERVATIONS',observations:rows.length,minBallConfidence:cfg.minBallConfidence};
    let best=null,continuityRejectedPairs=0;
    for(let i=1;i<rows.length;i++){
      if(!continuousPair(rows[i-1],rows[i],cfg.maxObservationGapSec)){continuityRejectedPairs+=1;continue;}
      const speed=localSpeed(rows,i,cfg.maxObservationGapSec); if(speed===null)continue;
      const prev=i>1?localSpeed(rows,i-1,cfg.maxObservationGapSec):0;
      const ownerNow=playerPoint(rows[i],event.fromPlayerId),ownerPrev=playerPoint(rows[i-1],event.fromPlayerId);
      const ballNow=pointOf(rows[i].ball),ballPrev=pointOf(rows[i-1].ball);
      if(!ownerNow||!ownerPrev||!ballNow||!ballPrev)continue;
      const sepNow=dist(ballNow,ownerNow),sepPrev=dist(ballPrev,ownerPrev),sepGain=sepNow-sepPrev,speedGain=speed-(prev||0);
      const score=(speed/cfg.minReleaseSpeedMps)+(speedGain/cfg.minSpeedGainMps)+(sepGain/cfg.minSeparationGainM);
      const row={time:Number(rows[i].time),speed,speedGain,sepPrev,sepNow,sepGain,score};
      if(!best||row.score>best.score)best=row;
    }
    if(!best)return {status:'INDISPONIBLE',reason:continuityRejectedPairs?'NO_CONTINUOUS_KICK_EVIDENCE':'OWNER_OR_BALL_COORDINATES_MISSING',observations:rows.length,continuityRejectedPairs,maxObservationGapSec:cfg.maxObservationGapSec};
    const valid=best.speed>=cfg.minReleaseSpeedMps&&best.speedGain>=cfg.minSpeedGainMps&&best.sepGain>=cfg.minSeparationGainM&&best.sepPrev<=cfg.maxOwnerDistanceAtReleaseM;
    return {
      status:valid?'CONFIRMED':'REJECTED',reason:valid?null:'KICK_RELEASE_EVIDENCE_TOO_WEAK',
      releaseTime:round(best.time),releaseSpeedMps:round(best.speed),speedGainMps:round(best.speedGain),
      separationBeforeM:round(best.sepPrev),separationAfterM:round(best.sepNow),separationGainM:round(best.sepGain),
      observations:rows.length,continuityRejectedPairs,
      thresholds:{...cfg},
      provenance:'CAY_CLEAN_ROOM_KICK_RELEASE_EVIDENCE_ADAPTED_FROM_ELASTIC_FEATURE_IDEA_NO_UPSTREAM_CODE_COPIED'
    };
  }
  function filterPassEvents(samples,analysis,options){
    if(!analysis||!Array.isArray(analysis.events))return {...analysis,events:[],passes:'INDISPONIBLE',kickEvidenceQuality:'INDISPONIBLE',fieldStatus:{...(analysis?.fieldStatus||{}),passes:'INDISPONIBLE'}};
    if(analysis.quality!=='FIABLE')return {...analysis,kickEvidenceQuality:'INDISPONIBLE',kickEvidenceReason:'BALL_ANALYSIS_NOT_RELIABLE',fieldStatus:{...(analysis.fieldStatus||{}),passes:'INDISPONIBLE'}};
    const kept=[],rejected=[],unavailable=[];
    for(const e of analysis.events){
      if(e.type!=='PASS'){kept.push(e);continue;}
      const evidence=validatePassKick(samples,e,options);
      if(evidence.status==='CONFIRMED')kept.push({...e,kickEvidence:evidence});
      else if(evidence.status==='REJECTED')rejected.push({...e,kickEvidence:evidence});
      else unavailable.push({...e,kickEvidence:evidence});
    }
    const confirmedPasses=kept.filter(e=>e.type==='PASS').length;
    if(unavailable.length){
      return {
        ...analysis,
        events:kept,
        diagnosticPasses:confirmedPasses,
        passes:'INDISPONIBLE',
        kickEvidenceQuality:'INDISPONIBLE',
        kickEvidenceReason:'PASS_KICK_EVIDENCE_INCOMPLETE',
        kickEvidenceRejectedPasses:rejected.length,
        kickEvidenceUnavailablePasses:unavailable.length,
        rejectedPassEvidence:rejected,
        unavailablePassEvidence:unavailable,
        fieldStatus:{...(analysis.fieldStatus||{}),passes:'INDISPONIBLE'},
        passPublicationPolicy:'UNE_PASSE_EST_PUBLIEE_SEULEMENT_SI_TOUTE_PASSE_CANDIDATE_PEUT_ETRE_EVALUEE_PAR_LA_PREUVE_DE_FRAPPE;_UNE_PREUVE_INDISPONIBLE_REND_LE_COMPTE_PASSES_INDISPONIBLE_SANS_TRANSFORMER_L_ABSENCE_DE_PREUVE_EN_ZERO'
      };
    }
    return {
      ...analysis,
      events:kept,
      passes:confirmedPasses,
      kickEvidenceQuality:'FIABLE',
      kickEvidenceRejectedPasses:rejected.length,
      kickEvidenceUnavailablePasses:0,
      rejectedPassEvidence:rejected,
      unavailablePassEvidence:[],
      fieldStatus:{...(analysis.fieldStatus||{}),passes:'FIABLE'},
      passPublicationPolicy:'UNE_PASSE_EST_PUBLIEE_SEULEMENT_SI_TOUTE_PASSE_CANDIDATE_PEUT_ETRE_EVALUEE_PAR_LA_PREUVE_DE_FRAPPE;_UNE_PREUVE_INDISPONIBLE_REND_LE_COMPTE_PASSES_INDISPONIBLE_SANS_TRANSFORMER_L_ABSENCE_DE_PREUVE_EN_ZERO'
    };
  }
  return {validatePassKick,filterPassEvents};
});
