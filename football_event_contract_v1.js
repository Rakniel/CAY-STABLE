(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFootballEventContract=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='CAY_FOOTBALL_ACTIONS_V1';
  const SPADL_REFERENCE={
    project:'ML-KULeuven/socceraction',
    version:'1.5.3',
    revision:'93a1242d46c104889205753accaabadb00c45c6d',
    license:'MIT',
    adaptation:'clean-room schema inspiration only; no upstream source code copied'
  };
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const valueOrNull=v=>v===undefined||v===null||String(v).trim()===''?null:v;
  const numOrNull=v=>finite(v)?Number(v):null;

  function baseAction(event,index,context){
    return {
      actionId:index,
      matchId:valueOrNull(context.matchId),
      periodId:valueOrNull(context.periodId),
      timeSec:numOrNull(event.time),
      teamId:valueOrNull(event.fromTeam),
      playerId:valueOrNull(event.fromPlayerId),
      start:{xM:null,yM:null,status:'INDISPONIBLE',reason:'SOURCE_EVENT_COORDINATES_NOT_PUBLISHED'},
      end:{xM:null,yM:null,status:'INDISPONIBLE',reason:'SOURCE_EVENT_COORDINATES_NOT_PUBLISHED'},
      coordinateSystem:'CAY_PITCH_METERS',
      evidenceSource:valueOrNull(event.source)
    };
  }

  function normalizeEvent(event,index,context={}){
    if(!event||typeof event!=='object')return null;
    const type=String(event.type||'').trim().toUpperCase();
    if(type==='PASS'){
      return {
        ...baseAction(event,index,context),
        actionType:'pass',
        result:'complete',
        recipientPlayerId:valueOrNull(event.toPlayerId),
        recipientTeamId:valueOrNull(event.toTeam),
        distanceM:numOrNull(event.travelM),
        durationSec:numOrNull(event.transitionSec),
        meanBallSpeedMps:numOrNull(event.meanBallSpeedMps),
        detachedBallObserved:event.detachedBallObserved===true,
        detachedBallObservations:numOrNull(event.detachedBallObservations),
        detachedBallSpanSec:numOrNull(event.detachedBallSpanSec)
      };
    }
    if(type==='TURNOVER'){
      return {
        ...baseAction(event,index,context),
        actionType:'turnover',
        result:'lost',
        recipientPlayerId:valueOrNull(event.toPlayerId),
        recipientTeamId:valueOrNull(event.toTeam),
        distanceM:numOrNull(event.travelM),
        durationSec:numOrNull(event.transitionSec),
        transitionBallObservations:numOrNull(event.transitionBallObservations),
        receiverStableSec:numOrNull(event.receiverStableSec)
      };
    }
    return null;
  }

  function fromBallAnalysis(analysis,context={}){
    if(!analysis||analysis.quality!=='FIABLE'){
      return {
        contractVersion:VERSION,
        quality:'INDISPONIBLE',
        reason:analysis&&analysis.reason?analysis.reason:'BALL_EVENT_ANALYSIS_NOT_RELIABLE',
        actions:[],
        sourceQuality:analysis&&analysis.quality?analysis.quality:'INDISPONIBLE',
        reference:SPADL_REFERENCE
      };
    }
    const sourceEvents=Array.isArray(analysis.events)?analysis.events:[];
    const actions=[];
    let unsupportedEvents=0;
    sourceEvents.forEach((event,index)=>{
      const action=normalizeEvent(event,index,context);
      if(action)actions.push(action);else unsupportedEvents+=1;
    });
    return {
      contractVersion:VERSION,
      quality:'FIABLE',
      reason:null,
      matchId:valueOrNull(context.matchId),
      periodId:valueOrNull(context.periodId),
      actions,
      actionCount:actions.length,
      unsupportedEvents,
      sourceQuality:analysis.quality,
      sourceCoverage:finite(analysis.coverage)?Number(analysis.coverage):null,
      coordinatePolicy:'COORDONNEES_JAMAIS_INVENTEES;_ELLES_RESTENT_INDISPONIBLE_TANT_QUE_L_EVENEMENT_SOURCE_NE_LES_PUBLIE_PAS',
      reference:SPADL_REFERENCE
    };
  }

  return {VERSION,SPADL_REFERENCE,normalizeEvent,fromBallAnalysis};
});
