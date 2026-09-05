(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallEvents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const configured=(value,fallback)=>finite(value)?Number(value):fallback;
  const round=(v,n=3)=>Number(Number(v).toFixed(n));
  function pointOf(entity){
    if(!entity)return null;
    const x=finite(entity.pitchX)?Number(entity.pitchX):(finite(entity.xM)?Number(entity.xM):null);
    const y=finite(entity.pitchY)?Number(entity.pitchY):(finite(entity.yM)?Number(entity.yM):null);
    return x===null||y===null?null:{x,y};
  }
  function presentContinuityMarker(value){
    return value!==undefined&&value!==null&&!(typeof value==='string'&&value.trim()==='');
  }
  function continuityKey(row){
    if(!row)return null;
    if(presentContinuityMarker(row.segment))return `segment:${String(row.segment)}`;
    if(presentContinuityMarker(row.segmentId))return `segment:${String(row.segmentId)}`;
    if(presentContinuityMarker(row.shotId))return `shot:${String(row.shotId)}`;
    if(presentContinuityMarker(row.planId))return `plan:${String(row.planId)}`;
    return null;
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
  function sameOwner(a,b){
    return !!a&&!!b&&a.playerId===b.playerId&&a.team===b.team;
  }
  function ownerConfig(options){
    const raw=options||{};
    return {
      minBallConfidence:configured(raw.minBallConfidence,.65),
      minPlayerConfidence:configured(raw.minPlayerConfidence,.45),
      ownerRadiusM:configured(raw.ownerRadiusM,2.2),
      ambiguityMarginM:configured(raw.ambiguityMarginM,.65),
      maxOwnershipBallSpeedMps:configured(raw.maxOwnershipBallSpeedMps,30),
      maxPlausibleBallSpeedMps:configured(raw.maxPlausibleBallSpeedMps,45)
    };
  }
  function inferOwner(sample,options){
    const cfg=ownerConfig(options);
    const ball=normalizeBall(sample&&sample.ball);
    if(!ball)return {status:'UNAVAILABLE',reason:'BALL_NOT_OBSERVED'};
    if(ball.confidence<cfg.minBallConfidence)return {status:'UNAVAILABLE',reason:'BALL_CONFIDENCE_TOO_LOW',ballConfidence:ball.confidence};
    const observedBallSpeedMps=finite(sample&&sample.observedBallSpeedMps)?Math.max(0,Number(sample.observedBallSpeedMps)):null;
    if(observedBallSpeedMps!==null&&observedBallSpeedMps>cfg.maxPlausibleBallSpeedMps){
      return {status:'UNAVAILABLE',reason:'BALL_MOTION_IMPLAUSIBLE',observedBallSpeedMps:round(observedBallSpeedMps),maxPlausibleBallSpeedMps:cfg.maxPlausibleBallSpeedMps};
    }
    if(observedBallSpeedMps!==null&&observedBallSpeedMps>cfg.maxOwnershipBallSpeedMps){
      return {status:'FREE',reason:'BALL_MOVING_TOO_FAST_FOR_STABLE_OWNERSHIP',observedBallSpeedMps:round(observedBallSpeedMps),maxOwnershipBallSpeedMps:cfg.maxOwnershipBallSpeedMps};
    }
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
    const raw=options||{};
    const cfg={
      minBallConfidence:configured(raw.minBallConfidence,.65),minPlayerConfidence:configured(raw.minPlayerConfidence,.45),ownerRadiusM:configured(raw.ownerRadiusM,2.2),ambiguityMarginM:configured(raw.ambiguityMarginM,.65),
      maxOwnershipBallSpeedMps:configured(raw.maxOwnershipBallSpeedMps,30),maxPlausibleBallSpeedMps:configured(raw.maxPlausibleBallSpeedMps,45),
      minStableOwnershipSec:configured(raw.minStableOwnershipSec,.30),minCoverage:configured(raw.minCoverage,.55),maxObservationGapSec:configured(raw.maxObservationGapSec,.75),
      minPassTravelM:configured(raw.minPassTravelM,3),maxPassTransitionSec:configured(raw.maxPassTransitionSec,3),minPassMeanSpeedMps:configured(raw.minPassMeanSpeedMps,2.5),minPassDetachedObservations:configured(raw.minPassDetachedObservations,2),minPassDetachedSpanSec:configured(raw.minPassDetachedSpanSec,.03),
      minTurnoverTravelM:configured(raw.minTurnoverTravelM,.75),maxTurnoverTransitionSec:configured(raw.maxTurnoverTransitionSec,1.5)
    };
    const rows=(samples||[]).filter(s=>finite(s&&s.time)).slice().sort((a,b)=>Number(a.time)-Number(b.time));
    if(rows.length<2)return {quality:'INDISPONIBLE',reason:'INSUFFICIENT_TIMELINE',events:[],passes:0,turnovers:0,coverage:0};
    let total=0,observable=0,owned=0,unobservedGapSeconds=0,largestGapSec=0,gapBreaks=0,segmentBreaks=0,continuityMetadataBreaks=0,segmentBoundarySeconds=0,stable=null,candidate=null,candidateSince=null,lastTime=null,lastFrameObservable=false,lastStableBall=null,transition=null,rejectedPassTransitions=0,rejectedTurnoverTransitions=0,lastContinuityKey=null;
    let lastMotionBall=null,lastMotionTime=null,lastMotionKey=null,motionRejectedFrames=0,fastBallFreeFrames=0,motionEvaluatedFrames=0;
    const possessionSec={},playerPossessionSecByTeam={},events=[];
    function resetOwnershipContinuity(){
      stable=null;
      candidate=null;
      candidateSince=null;
      lastStableBall=null;
      transition=null;
    }
    function creditPlayerPossession(owner,dt){
      const team=String(owner.team),playerId=String(owner.playerId);
      if(!playerPossessionSecByTeam[team])playerPossessionSecByTeam[team]={};
      playerPossessionSecByTeam[team][playerId]=(playerPossessionSecByTeam[team][playerId]||0)+dt;
    }
    function beginTransition(now,ball,detached){
      if(!stable)return;
      if(!transition||transition.fromPlayerId!==stable.playerId||transition.fromTeam!==stable.team){
        transition={fromPlayerId:stable.playerId,fromTeam:stable.team,startedAt:now,fromBall:lastStableBall?{...lastStableBall}:null,detachedObserved:false,detachedObservations:0,firstDetachedAt:null,lastDetachedAt:null,observations:0};
      }
      if(detached){
        transition.detachedObserved=true;
        if(ball&&(transition.lastDetachedAt===null||now-transition.lastDetachedAt>1e-6)){
          transition.detachedObservations+=1;
          if(transition.firstDetachedAt===null)transition.firstDetachedAt=now;
          transition.lastDetachedAt=now;
        }
      }
      if(ball){transition.lastBall={x:ball.x,y:ball.y};transition.observations+=1;}
    }
    function commitCandidate(now,rowBall){
      if(!candidate||candidateSince===null||now-candidateSince<cfg.minStableOwnershipSec)return;
      if(stable&&!sameOwner(stable,candidate)){
        if(stable.team===candidate.team){
          const endBall=rowBall?{x:rowBall.x,y:rowBall.y}:null;
          const travelM=transition&&transition.fromBall&&endBall?distance(transition.fromBall,endBall):0;
          const duration=transition?now-transition.startedAt:Infinity;
          const meanSpeedMps=duration>0&&Number.isFinite(duration)?travelM/duration:0;
          const detachedObservations=transition?transition.detachedObservations||0:0;
          const detachedSpanSec=transition&&transition.firstDetachedAt!==null&&transition.lastDetachedAt!==null?Math.max(0,transition.lastDetachedAt-transition.firstDetachedAt):0;
          const passVerified=!!(transition&&transition.fromPlayerId===stable.playerId&&transition.fromTeam===stable.team&&transition.detachedObserved&&detachedObservations>=cfg.minPassDetachedObservations&&detachedSpanSec>=cfg.minPassDetachedSpanSec&&travelM>=cfg.minPassTravelM&&duration<=cfg.maxPassTransitionSec&&meanSpeedMps>=cfg.minPassMeanSpeedMps);
          if(passVerified){
            events.push({type:'PASS',time:round(now),fromPlayerId:stable.playerId,toPlayerId:candidate.playerId,fromTeam:stable.team,toTeam:candidate.team,travelM:round(travelM),transitionSec:round(duration),meanBallSpeedMps:round(meanSpeedMps),detachedBallObserved:true,detachedBallObservations:detachedObservations,detachedBallSpanSec:round(detachedSpanSec),source:'validated_ball_flight_motion_and_ownership_transition'});
          }else rejectedPassTransitions+=1;
        }else{
          const endBall=rowBall?{x:rowBall.x,y:rowBall.y}:null;
          const travelM=transition&&transition.fromBall&&endBall?distance(transition.fromBall,endBall):0;
          const duration=transition?now-transition.startedAt:Infinity;
          const turnoverVerified=!!(transition&&transition.fromPlayerId===stable.playerId&&transition.fromTeam===stable.team&&travelM>=cfg.minTurnoverTravelM&&duration<=cfg.maxTurnoverTransitionSec);
          if(turnoverVerified){
            events.push({type:'TURNOVER',time:round(now),fromPlayerId:stable.playerId,toPlayerId:candidate.playerId,fromTeam:stable.team,toTeam:candidate.team,travelM:round(travelM),transitionSec:round(duration),source:'validated_ball_motion_and_ownership_transition'});
          }else rejectedTurnoverTransitions+=1;
        }
      }
      stable={...candidate,since:candidateSince};
      lastStableBall=rowBall?{x:rowBall.x,y:rowBall.y}:lastStableBall;
      transition=null;
    }
    for(const row of rows){
      const t=Number(row.time);
      const rowBall=normalizeBall(row.ball);
      const currentContinuityKey=continuityKey(row);
      let observedBallSpeedMps=null;
      if(rowBall&&rowBall.confidence>=cfg.minBallConfidence&&lastMotionBall&&lastMotionTime!==null){
        const dt=t-lastMotionTime;
        const sameKey=lastMotionKey===currentContinuityKey;
        if(dt>0&&dt<=cfg.maxObservationGapSec&&sameKey){
          observedBallSpeedMps=distance(rowBall,lastMotionBall)/dt;
          motionEvaluatedFrames+=1;
        }
      }
      const owner=inferOwner({...row,observedBallSpeedMps},cfg);
      if(owner.reason==='BALL_MOTION_IMPLAUSIBLE')motionRejectedFrames+=1;
      if(owner.reason==='BALL_MOVING_TOO_FAST_FOR_STABLE_OWNERSHIP')fastBallFreeFrames+=1;
      const frameObservable=(owner.status==='OWNED'||owner.status==='FREE'||owner.status==='AMBIGUOUS')&&!!rowBall&&rowBall.confidence>=cfg.minBallConfidence;
      let continuityBroken=false;
      if(lastTime!==null){
        const dt=Math.max(0,t-lastTime);
        total+=dt;
        largestGapSec=Math.max(largestGapSec,dt);
        const continuityMetadataBoundary=(lastContinuityKey===null)!==(currentContinuityKey===null);
        const segmentChanged=lastContinuityKey!==currentContinuityKey&&(lastContinuityKey!==null||currentContinuityKey!==null);
        if(segmentChanged){
          segmentBreaks+=1;
          if(continuityMetadataBoundary)continuityMetadataBreaks+=1;
          segmentBoundarySeconds+=dt;
          if(dt>cfg.maxObservationGapSec)unobservedGapSeconds+=dt;
          resetOwnershipContinuity();
          continuityBroken=true;
        }else if(dt<=cfg.maxObservationGapSec){
          if(lastFrameObservable&&frameObservable)observable+=dt;
          if(stable&&lastFrameObservable&&frameObservable&&owner.status==='OWNED'&&sameOwner(owner,stable)){
            owned+=dt;
            possessionSec[stable.team]=(possessionSec[stable.team]||0)+dt;
            creditPlayerPossession(stable,dt);
          }
        }else{
          unobservedGapSeconds+=dt;
          gapBreaks+=1;
          resetOwnershipContinuity();
          continuityBroken=true;
        }
      }
      if(owner.status==='OWNED'){
        if(stable&&sameOwner(owner,stable)){
          lastStableBall=rowBall?{x:rowBall.x,y:rowBall.y}:lastStableBall;
          transition=null;
        }else if(stable&&!sameOwner(owner,stable)){
          beginTransition(t,rowBall,false);
        }
        if(!candidate||!sameOwner(candidate,owner)){candidate=owner;candidateSince=t;}
        commitCandidate(t,rowBall);
      }else if(owner.status==='FREE'||owner.status==='AMBIGUOUS'){
        if(frameObservable&&!continuityBroken)beginTransition(t,rowBall,true);
        candidate=null; candidateSince=null;
      }else{
        candidate=null; candidateSince=null;
      }
      if(rowBall&&rowBall.confidence>=cfg.minBallConfidence){
        lastMotionBall={x:rowBall.x,y:rowBall.y};
        lastMotionTime=t;
        lastMotionKey=currentContinuityKey;
      }else if(lastMotionTime!==null&&t-lastMotionTime>cfg.maxObservationGapSec){
        lastMotionBall=null;lastMotionTime=null;lastMotionKey=null;
      }
      lastFrameObservable=frameObservable;
      lastTime=t;
      lastContinuityKey=currentContinuityKey;
    }
    const coverage=total>0?observable/total:0;
    const passCount=events.filter(e=>e.type==='PASS').length;
    const turnoverCount=events.filter(e=>e.type==='TURNOVER').length;
    const quality=coverage>=cfg.minCoverage?'FIABLE':'INDISPONIBLE';
    const reason=quality==='FIABLE'?null:'BALL_COVERAGE_TOO_LOW';
    const teamPossession={};
    const denom=Object.values(possessionSec).reduce((a,b)=>a+b,0);
    for(const [team,sec] of Object.entries(possessionSec))teamPossession[team]={seconds:round(sec),share:denom?round(sec/denom,4):0};
    const playerPossessionByTeam=Object.fromEntries(Object.entries(playerPossessionSecByTeam).map(([team,players])=>[team,Object.fromEntries(Object.entries(players).map(([id,sec])=>[id,round(sec)]))]));
    const playerIdTeams={};
    for(const [team,players] of Object.entries(playerPossessionByTeam))for(const id of Object.keys(players)){
      if(!playerIdTeams[id])playerIdTeams[id]=new Set();
      playerIdTeams[id].add(team);
    }
    const playerPossessionIdCollisions=Object.entries(playerIdTeams).filter(([,teams])=>teams.size>1).map(([playerId,teams])=>({playerId,teams:Array.from(teams).sort()})).sort((a,b)=>String(a.playerId).localeCompare(String(b.playerId)));
    const collisionIds=new Set(playerPossessionIdCollisions.map(row=>row.playerId));
    const legacyPlayerPossession={};
    for(const players of Object.values(playerPossessionByTeam))for(const [id,sec] of Object.entries(players))if(!collisionIds.has(id))legacyPlayerPossession[id]=sec;
    return {
      quality,reason,coverage:round(coverage,4),observableSeconds:round(observable),timelineSeconds:round(total),ownedSeconds:round(owned),
      unobservedGapSeconds:round(unobservedGapSeconds),largestGapSec:round(largestGapSec),gapBreaks,segmentBreaks,continuityMetadataBreaks,segmentBoundarySeconds:round(segmentBoundarySeconds),continuityBreaks:gapBreaks+segmentBreaks,
      motionEvaluatedFrames,motionRejectedFrames,fastBallFreeFrames,
      passes:quality==='FIABLE'?passCount:'INDISPONIBLE',turnovers:quality==='FIABLE'?turnoverCount:'INDISPONIBLE',rejectedPassTransitions:quality==='FIABLE'?rejectedPassTransitions:'INDISPONIBLE',rejectedTurnoverTransitions:quality==='FIABLE'?rejectedTurnoverTransitions:'INDISPONIBLE',
      possession:quality==='FIABLE'?teamPossession:'INDISPONIBLE',
      playerPossession:quality==='FIABLE'?legacyPlayerPossession:'INDISPONIBLE',
      playerPossessionByTeam:quality==='FIABLE'?playerPossessionByTeam:'INDISPONIBLE',
      playerPossessionIdCollisions:quality==='FIABLE'?playerPossessionIdCollisions:'INDISPONIBLE',
      events:quality==='FIABLE'?events:[],
      thresholds:{minBallConfidence:cfg.minBallConfidence,minStableOwnershipSec:cfg.minStableOwnershipSec,minCoverage:cfg.minCoverage,maxObservationGapSec:cfg.maxObservationGapSec,ownerRadiusM:cfg.ownerRadiusM,ambiguityMarginM:cfg.ambiguityMarginM,maxOwnershipBallSpeedMps:cfg.maxOwnershipBallSpeedMps,maxPlausibleBallSpeedMps:cfg.maxPlausibleBallSpeedMps,minPassTravelM:cfg.minPassTravelM,maxPassTransitionSec:cfg.maxPassTransitionSec,minPassMeanSpeedMps:cfg.minPassMeanSpeedMps,minPassDetachedObservations:cfg.minPassDetachedObservations,minPassDetachedSpanSec:cfg.minPassDetachedSpanSec,minTurnoverTravelM:cfg.minTurnoverTravelM,maxTurnoverTransitionSec:cfg.maxTurnoverTransitionSec},
      coveragePolicy:'TOUTE_LA_DUREE_DE_LA_TIMELINE_RESTE_DANS_LE_DENOMINATEUR_MAIS_UN_INTERVALLE_N_EST_CREDITE_OBSERVABLE_QUE_SI_SES_DEUX_EXTREMITES_SONT_OBSERVABLES_LE_GAP_EST_ACCEPTABLE_ET_LE_PLAN_EST_IDENTIQUE',
      continuityPolicy:'UN_GAP_SUPERIEUR_A_MAX_OBSERVATION_GAP_SEC_UN_CHANGEMENT_DE_SEGMENT_PLAN_OU_LA_PERTE_APPARITION_DE_METADONNEE_DE_PLAN_CASSE_LA_CONTINUITE_DE_POSSESSION_ET_INTERDIT_TOUTE_PASSE_A_TRAVERS_LA_FRONTIERE',
      possessionPolicy:'TEMPS_CREDITE_SEULEMENT_SI_LE_MEME_PROPRIETAIRE_STABLE_EQUIPE_PLUS_IDENTIFIANT_EST_OBSERVE_AUX_DEUX_EXTREMITES_DANS_LE_MEME_PLAN;_LA_POSSESSION_INDIVIDUELLE_AUTORITAIRE_EST_INDEXEE_PAR_EQUIPE_PUIS_JOUEUR_ET_LA_VUE_PLATE_OMIT_LES_IDENTIFIANTS_AMBIGUS_ENTRE_EQUIPES',
      motionPolicy:'LA_VITESSE_DU_BALLON_EST_ESTIMEE_UNIQUEMENT_ENTRE_OBSERVATIONS_METRIQUES_FIABLES_DU_MEME_PLAN;_UN_SAUT_IMPLAUSIBLE_REND_LA_FRAME_INDISPONIBLE_ET_UN_BALLON_TROP_RAPIDE_POUR_UN_CONTROLE_RESTE_LIBRE',
      rule:'UNE_PASSE_EXIGE_PLUSIEURS_OBSERVATIONS_DE_BALLON_DETACHE_A_DES_INSTANTS_DISTINCTS_SUR_UNE_DUREE_MINIMALE_UN_VOL_DE_BALL_ET_UN_MOUVEMENT_METRIQUE_SUFFISANT;_UN_TURNOVER_EXIGE_AUSSI_UN_DEPLACEMENT_MINIMAL_DU_BALLON_ENTRE_DEUX_POSSESSIONS_STABLES_ADVERSES_DANS_UNE_CONTINUITE_DE_PLAN'
    };
  }
  return {normalizeBall,normalizePlayer,inferOwner,analyzeBallEvents};
});