(function(root,factory){
  const api=factory(root.CAYBallEvents,root.CAYBallKickEvidence);
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./ball_event_state_v1.js'),require('./ball_kick_evidence_v1.js'));
  else root.CAYBallEventEvidenceBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BallEvents,KickEvidence){
  'use strict';
  const NON_LIVE_CLASSES=new Set(['REPLAY','SLOW_MOTION','SLOWMO','NON_LIVE','GRAPHICS','VAR_REPLAY']);
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
  function analyze(samples,options){
    if(!BallEvents||typeof BallEvents.analyzeBallEvents!=='function')return {quality:'INDISPONIBLE',reason:'BALL_EVENT_ENGINE_UNAVAILABLE',events:[],passes:'INDISPONIBLE'};
    const guarded=guardLivePlaySamples(samples);
    const base=BallEvents.analyzeBallEvents(guarded.samples,options);
    const withLiveGuard={...base,nonLiveExcludedFrames:guarded.excludedFrames,nonLiveRuns:guarded.nonLiveRuns,livePlayPolicy:'LES_REPLAYS_RALENTIS_ET_SEGMENTS_NON_LIVE_NE_SONT_EXCLUS_QUE_SUR_METADONNEE_EXPLICITE;_ILS_CASSENT_LA_CONTINUITE_ET_NE_PEUVENT_PRODUIRE_PASSE_POSSESSION_OU_TURNOVER'};
    if(options?.requireKickEvidence!==true)return {...withLiveGuard,kickEvidenceQuality:'NON_REQUIS'};
    if(!KickEvidence||typeof KickEvidence.filterPassEvents!=='function')return {...withLiveGuard,quality:'INDISPONIBLE',reason:'KICK_EVIDENCE_ENGINE_UNAVAILABLE',events:[],passes:'INDISPONIBLE',kickEvidenceQuality:'INDISPONIBLE'};
    return KickEvidence.filterPassEvents(guarded.samples,withLiveGuard,options?.kickEvidence||options);
  }
  return {explicitNonLive,guardLivePlaySamples,analyze};
});
