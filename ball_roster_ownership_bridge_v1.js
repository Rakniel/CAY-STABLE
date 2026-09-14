(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./ball_event_state_v1.js'):root.CAYBallEvents,
    typeof module==='object'&&module.exports?require('./track_roster_binding_v1.js'):root.CAYTrackRosterBinding
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallRosterOwnership=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(BallEvents,TrackRosterBinding){
  const clean=v=>String(v==null?'':v).trim();

  function scopedPlayer(raw,options,time){
    if(!raw)return {player:null,reason:'INVALID_PLAYER'};
    const clubTeam=clean(options&&options.clubTeam||'CAY');
    const team=clean(raw.team??raw.teamId);
    if(team!==clubTeam)return {player:raw,reason:null};
    if(!TrackRosterBinding||typeof TrackRosterBinding.resolve!=='function')return {player:null,reason:'ROSTER_BINDING_RUNTIME_UNAVAILABLE'};
    const trackId=clean(raw.trackId??raw.id??raw.playerId);
    if(!trackId)return {player:null,reason:'CLUB_TRACK_ID_MISSING'};
    const state=options&&options.bindingState||{};
    const participation=options&&options.participation;
    const participationProvided=participation!==undefined&&participation!==null;
    let resolved;
    if(participationProvided){
      if(!Number.isFinite(Number(time)))return {player:null,reason:'CLUB_PARTICIPATION_TIME_MISSING'};
      if(typeof TrackRosterBinding.resolveAtTime!=='function')return {player:null,reason:'PARTICIPATION_RUNTIME_UNAVAILABLE'};
      resolved=TrackRosterBinding.resolveAtTime(state,trackId,participation,Number(time)*1000);
    }else{
      resolved=TrackRosterBinding.resolve(state,trackId);
    }
    if(!resolved||resolved.status!=='FIABLE'||!clean(resolved.playerId))return {player:null,reason:participationProvided?'CLUB_TRACK_OUTSIDE_CONFIRMED_PARTICIPATION':'CLUB_TRACK_NOT_RELIABLY_ROSTER_BOUND'};
    return {player:{...raw,trackId,id:resolved.playerId,playerId:resolved.playerId,rosterBindingConfidence:resolved.confidence,rosterBindingSource:resolved.source},reason:null};
  }

  function scopeSample(sample,options={}){
    const players=Array.isArray(sample&&sample.players)?sample.players:[];
    const kept=[];
    const rejectedReasons={};
    let rejectedClubPlayers=0,mappedClubPlayers=0;
    for(const raw of players){
      const result=scopedPlayer(raw,options,sample&&sample.time);
      if(result.player){
        kept.push(result.player);
        const rawTeam=clean(raw?(raw.team??raw.teamId):'');
        if(rawTeam===clean(options.clubTeam||'CAY'))mappedClubPlayers+=1;
      }else{
        rejectedClubPlayers+=1;
        rejectedReasons[result.reason]=(rejectedReasons[result.reason]||0)+1;
      }
    }
    return {
      sample:{...(sample||{}),players:kept},
      diagnostics:{source:'BALL_ROSTER_OWNERSHIP_BRIDGE_V1',clubTeam:clean(options.clubTeam||'CAY'),inputPlayers:players.length,outputPlayers:kept.length,mappedClubPlayers,rejectedClubPlayers,rejectedReasons}
    };
  }

  function inferOwner(sample,options={}){
    if(!BallEvents||typeof BallEvents.inferOwner!=='function')return {status:'UNAVAILABLE',reason:'BALL_EVENT_RUNTIME_UNAVAILABLE'};
    const scoped=scopeSample(sample,options);
    const result=BallEvents.inferOwner(scoped.sample,options.ballOptions||options);
    return {...result,rosterGuard:scoped.diagnostics};
  }

  function analyzeBallEvents(samples,options={}){
    if(!BallEvents||typeof BallEvents.analyzeBallEvents!=='function')return {quality:'INDISPONIBLE',reason:'BALL_EVENT_RUNTIME_UNAVAILABLE',events:[],passes:'INDISPONIBLE',turnovers:'INDISPONIBLE'};
    const rows=[];
    const totals={source:'BALL_ROSTER_OWNERSHIP_BRIDGE_V1',clubTeam:clean(options.clubTeam||'CAY'),samples:0,inputPlayers:0,outputPlayers:0,mappedClubPlayers:0,rejectedClubPlayers:0,rejectedReasons:{}};
    for(const sample of Array.isArray(samples)?samples:[]){
      const scoped=scopeSample(sample,options),d=scoped.diagnostics;
      rows.push(scoped.sample);totals.samples+=1;totals.inputPlayers+=d.inputPlayers;totals.outputPlayers+=d.outputPlayers;totals.mappedClubPlayers+=d.mappedClubPlayers;totals.rejectedClubPlayers+=d.rejectedClubPlayers;
      for(const [reason,count] of Object.entries(d.rejectedReasons))totals.rejectedReasons[reason]=(totals.rejectedReasons[reason]||0)+count;
    }
    const result=BallEvents.analyzeBallEvents(rows,options.ballOptions||options);
    return {...result,rosterGuard:totals};
  }

  return {scopedPlayer,scopeSample,inferOwner,analyzeBallEvents};
});
