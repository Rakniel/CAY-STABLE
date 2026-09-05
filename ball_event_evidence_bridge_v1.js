(function(root,factory){
  const api=factory(root.CAYBallEvents,root.CAYBallKickEvidence);
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./ball_event_state_v1.js'),require('./ball_kick_evidence_v1.js'));
  else root.CAYBallEventEvidenceBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BallEvents,KickEvidence){
  'use strict';
  const NON_LIVE_CLASSES=new Set(['REPLAY','SLOW_MOTION','SLOWMO','NON_LIVE','GRAPHICS','VAR_REPLAY']);
  const finite=v=>Number.isFinite(Number(v));
  const round4=v=>Number(Number(v).toFixed(4));
  function explicitNonLive(row){
    if(!row)return false;
    if(row.isReplay===true||row.replay===true||row.isLive===false||row.live===false)return true;
    const value=row.playState??row.frameClass??row.frameType??null;
    if(value===null||value===undefined)return false;
    return NON_LIVE_CLASSES.has(String(value).trim().toUpperCase());
  }
  function guardLivePlaySamples(samples){
    let nonLiveRun=0,inNonLive=false,excludedFrames=0;
    const guarded=(samples||[]).map((row,index)=>{
      if(!explicitNonLive(row)){
        inNonLive=false;
        return row;
      }
      if(!inNonLive){nonLiveRun+=1;inNonLive=true;}
      excludedFrames+=1;
      return {...row,segment:`CAY_NON_LIVE_${nonLiveRun}`,ball:{...(row.ball||{}),valid:false},players:[],cayNonLiveExcluded:true,cayNonLiveSourceIndex:index};
    });
    return {samples:guarded,excludedFrames,nonLiveRuns:nonLiveRun};
  }
  function applyPossessionEvidencePolicy(base){
    const timelineSeconds=finite(base?.timelineSeconds)?Math.max(0,Number(base.timelineSeconds)):0;
    const ownedSeconds=finite(base?.ownedSeconds)?Math.max(0,Number(base.ownedSeconds)):0;
    const minCoverage=finite(base?.thresholds?.minCoverage)?Math.max(0,Math.min(1,Number(base.thresholds.minCoverage))):.55;
    const possessionCoverage=timelineSeconds>0?ownedSeconds/timelineSeconds:0;
    const possessionQuality=base?.quality==='FIABLE'&&possessionCoverage>=minCoverage?'FIABLE':'INDISPONIBLE';
    const diagnosticPossession=base&&base.possession&&typeof base.possession==='object'?base.possession:null;
    const diagnosticPlayerPossession=base&&base.playerPossession&&typeof base.playerPossession==='object'?base.playerPossession:null;
    return {
      ...base,
      possessionCoverage:round4(possessionCoverage),
      possessionReason:possessionQuality==='FIABLE'?null:(base?.quality!=='FIABLE'?(base?.reason||'BALL_EVENT_EVIDENCE_TOO_LOW'):'POSSESSION_EVIDENCE_TOO_LOW'),
      diagnosticPossession,
      diagnosticPlayerPossession,
      possession:possessionQuality==='FIABLE'?base.possession:'INDISPONIBLE',
      playerPossession:possessionQuality==='FIABLE'?base.playerPossession:'INDISPONIBLE',
      fieldStatus:{
        ...(base?.fieldStatus||{}),
        passes:base?.quality==='FIABLE'?'FIABLE':'INDISPONIBLE',
        turnovers:base?.quality==='FIABLE'?'FIABLE':'INDISPONIBLE',
        possession:possessionQuality
      },
      possessionEvidencePolicy:'POSSESSION_PUBLIEE_SEULEMENT_SI_LE_BALLON_EST_FIABLE_ET_SI_LE_TEMPS_ATTRIBUE_A_UN_PROPRIETAIRE_STABLE_COUVRE_AU_MOINS_LE_MEME_SEUIL_QUE_LA_COUVERTURE_BALLON;_LE_RESULTAT_BRUT_RESTE_DIAGNOSTIQUE'
    };
  }
  function analyze(samples,options){
    if(!BallEvents||typeof BallEvents.analyzeBallEvents!=='function')return {quality:'INDISPONIBLE',reason:'BALL_EVENT_ENGINE_UNAVAILABLE',events:[],passes:'INDISPONIBLE',fieldStatus:{passes:'INDISPONIBLE',turnovers:'INDISPONIBLE',possession:'INDISPONIBLE'}};
    const guarded=guardLivePlaySamples(samples);
    const base=applyPossessionEvidencePolicy(BallEvents.analyzeBallEvents(guarded.samples,options));
    const withLiveGuard={...base,nonLiveExcludedFrames:guarded.excludedFrames,nonLiveRuns:guarded.nonLiveRuns,livePlayPolicy:'LES_REPLAYS_RALENTIS_ET_SEGMENTS_NON_LIVE_NE_SONT_EXCLUS_QUE_SUR_METADONNEE_EXPLICITE;_ILS_CASSENT_LA_CONTINUITE_ET_NE_PEUVENT_PRODUIRE_PASSE_POSSESSION_OU_TURNOVER'};
    if(options?.requireKickEvidence!==true)return {...withLiveGuard,kickEvidenceQuality:'NON_REQUIS'};
    if(!KickEvidence||typeof KickEvidence.filterPassEvents!=='function')return {...withLiveGuard,quality:'INDISPONIBLE',reason:'KICK_EVIDENCE_ENGINE_UNAVAILABLE',events:[],passes:'INDISPONIBLE',kickEvidenceQuality:'INDISPONIBLE',fieldStatus:{...(withLiveGuard.fieldStatus||{}),passes:'INDISPONIBLE'}};
    return KickEvidence.filterPassEvents(guarded.samples,withLiveGuard,options?.kickEvidence||options);
  }
  return {explicitNonLive,guardLivePlaySamples,applyPossessionEvidencePolicy,analyze};
});
