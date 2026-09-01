(function(root,factory){
  const api=factory(root.CAYBallEvents,root.CAYBallKickEvidence);
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./ball_event_state_v1.js'),require('./ball_kick_evidence_v1.js'));
  else root.CAYBallEventEvidenceBridge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BallEvents,KickEvidence){
  'use strict';
  function analyze(samples,options){
    if(!BallEvents||typeof BallEvents.analyzeBallEvents!=='function')return {quality:'INDISPONIBLE',reason:'BALL_EVENT_ENGINE_UNAVAILABLE',events:[],passes:'INDISPONIBLE'};
    const base=BallEvents.analyzeBallEvents(samples,options);
    if(options?.requireKickEvidence!==true)return {...base,kickEvidenceQuality:'NON_REQUIS'};
    if(!KickEvidence||typeof KickEvidence.filterPassEvents!=='function')return {...base,quality:'INDISPONIBLE',reason:'KICK_EVIDENCE_ENGINE_UNAVAILABLE',events:[],passes:'INDISPONIBLE',kickEvidenceQuality:'INDISPONIBLE'};
    return KickEvidence.filterPassEvents(samples,base,options?.kickEvidence||options);
  }
  return {analyze};
});
