(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallEvents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const finite=v=>Number.isFinite(Number(v));
  const round=(v,n=3)=>Number(Number(v).toFixed(n));
  function pointOf(entity){
    if(!entity)return null;
    const x=finite(entity.pitchX)?Number(entity.pitchX):(finite(entity.xM)?Number(entity.xM):null);
    const y=finite(entity.pitchY)?Number(entity.pitchY):(finite(entity.yM)?Number(entity.yM):null);
    return x===null||y===null?null:{x,y};
  }
  function normalizePlayer(raw){
    if(!raw)return null;
    const id=raw.id??raw.playerId??null;
    const team=raw.team??raw.teamId??null;
    const p=pointOf(raw);
    if(id===null||team===null||!p)return null;
    const confidence=finite(raw.confidence)?clamp01(raw.confidence):1;
    if(raw.onField===false||raw.valid===false)return null;
    return {id,team,x:p.x,y:p.y,confidence};
  }
  function normalizeBall(raw){
    if(!raw||raw.valid===false||raw.visible===false)return null;
    const p=pointOf(raw);
    if(!p)return null;
    return {x:p.x,y:p.y,confidence:finite(raw.confidence)?clamp01(raw.confidence):0};
  }
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function inferOwner(sample,options){
    const cfg={minBallConfidence:.65,minPlayerConfidence:.45,ownerRadiusM:2.2,ambiguityMarginM:.65,...(options||{})};
    const ball=normalizeBall(sample&&sample.ball);
    if(!ball)return {status:'UNAVAILABLE',reason:'BALL_NOT_OBSERVED'};
    if(ball.confidence<cfg.minBallConfidence)return {status:'UNAVAILABLE',reason:'BALL_CONFIDENCE_TOO_LOW',ballConfidence:ball.confidence};
    const candidates=(sample.players||[]).map(normalizePlayer).filter(Boolean).filter(p=>p.confidence>=cfg.minPlayerConfidence)
      .map(p=>({...p,distanceM:distance(ball,p)})).sort((a,b)=>a.distanceM-b.distanceM);
    if(!candidates.length)return {status:'UNAVAILABLE',reason:'NO_VALID_ON_FIELD_PLAYER'};
    if(candidates[0].distanceM>cfg.ownerRadiusM)return {status:'FREE',reason:'NO_PLAYER_CLOSE_ENOUGH',nearestDistanceM:round(candidates[0].distanceM)};
    if(candidates[1]&&candidates[1].distanceM-candidates[0].distanceM<cfg.ambiguityMarginM){
      return {status:'AMBIGUOUS',reason:'MULTIPLE_PLAYERS_TOO_CLOSE',nearestDistanceM:round(candidates[0].distanceM),secondDistanceM:round(candidates[1].distanceM)};
    }
    const c=candidates[0];
    return {status:'OWNED',playerId:c.id,team:c.team,distanceM:round(c.distanceM),ballConfidence:round(ball.confidence,4),playerConfidence:round(c.confidence,4)};
  }
  function analyzeBallEvents(samples,options){
    const cfg={
      minBallConfidence:.65,minPlayerConfidence:.45,ownerRadiusM:2.2,ambiguityMarginM:.65,
      minStableOwnershipSec:.30,minCoverage:.55,maxObservationGapSec:.75,...(options||{})
    };
    const rows=(samples||[]).filter(s=>finite(s&&s.time)).slice().sort((a,b)=>Number(a.time)-Number(b.time));
    if(rows.length<2)return {quality:'INDISPONIBLE',reason:'INSUFFICIENT_TIMELINE',events:[],passes:0,turnovers:0,coverage:0};
    let total=0,observable=0,owned=0,stable=null,candidate=null,candidateSince=null,lastTime=null,lastObservableTime=null;
    const possessionSec={},playerPossessionSec={},events=[];
    function commitCandidate(now){
      if(!candidate||candidateSince===null||now-candidateSince<cfg.minStableOwnershipSec)return;
      if(stable&&stable.playerId!==candidate.playerId){
        const type=stable.team===candidate.team?'PASS':'TURNOVER';
        events.push({type,time:round(now),fromPlayerId:stable.playerId,toPlayerId:candidate.playerId,fromTeam:stable.team,toTeam:candidate.team,source:'validated_ball_ownership_transition'});
      }
      stable={...candidate,since:candidateSince};
    }
    for(const row of rows){
      const t=Number(row.time);
      if(lastTime!==null){
        const dt=Math.max(0,t-lastTime);
        if(dt<=cfg.maxObservationGapSec){
          total+=dt;
          if(lastObservableTime===lastTime)observable+=dt;
          if(stable&&lastObservableTime===lastTime){
            owned+=dt;
            possessionSec[stable.team]=(possessionSec[stable.team]||0)+dt;
            playerPossessionSec[stable.playerId]=(playerPossessionSec[stable.playerId]||0)+dt;
          }
        }
      }
      const owner=inferOwner(row,cfg);
      if(owner.status==='OWNED'){
        lastObservableTime=t;
        if(!candidate||candidate.playerId!==owner.playerId){candidate=owner;candidateSince=t;}
        commitCandidate(t);
      }else if(owner.status==='FREE'){
        lastObservableTime=t; candidate=null; candidateSince=null;
      }else{
        candidate=null; candidateSince=null;
      }
      lastTime=t;
    }
    const coverage=total>0?observable/total:0;
    const passCount=events.filter(e=>e.type==='PASS').length;
    const turnoverCount=events.filter(e=>e.type==='TURNOVER').length;
    const quality=coverage>=cfg.minCoverage?'FIABLE':'INDISPONIBLE';
    const reason=quality==='FIABLE'?null:'BALL_COVERAGE_TOO_LOW';
    const teamPossession={};
    const denom=Object.values(possessionSec).reduce((a,b)=>a+b,0);
    for(const [team,sec] of Object.entries(possessionSec))teamPossession[team]={seconds:round(sec),share:denom?round(sec/denom,4):0};
    return {
      quality,reason,coverage:round(coverage,4),observableSeconds:round(observable),timelineSeconds:round(total),ownedSeconds:round(owned),
      passes:quality==='FIABLE'?passCount:'INDISPONIBLE',turnovers:quality==='FIABLE'?turnoverCount:'INDISPONIBLE',
      possession:quality==='FIABLE'?teamPossession:'INDISPONIBLE',
      playerPossession:quality==='FIABLE'?Object.fromEntries(Object.entries(playerPossessionSec).map(([id,sec])=>[id,round(sec)])):'INDISPONIBLE',
      events:quality==='FIABLE'?events:[],
      thresholds:{minBallConfidence:cfg.minBallConfidence,minStableOwnershipSec:cfg.minStableOwnershipSec,minCoverage:cfg.minCoverage,ownerRadiusM:cfg.ownerRadiusM,ambiguityMarginM:cfg.ambiguityMarginM},
      rule:'POSSESSION_PASSES_ET_TURNOVERS_NE_SONT_PUBLIES_QUE_SI_LA_COUVERTURE_BALLON_EST_VALIDEE'
    };
  }
  return {normalizeBall,normalizePlayer,inferOwner,analyzeBallEvents};
});
