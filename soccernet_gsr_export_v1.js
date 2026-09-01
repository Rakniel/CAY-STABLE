(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYSoccerNetGSRExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const VALID_ROLES=new Set(['player','goalkeeper','referee','other']);
  const round=(v,n=4)=>Number(Number(v).toFixed(n));

  function normalizeRole(value){
    const role=String(value||'').trim().toLowerCase();
    return VALID_ROLES.has(role)?role:null;
  }
  function normalizeJersey(value){
    if(value===null||value===undefined||value==='')return null;
    const n=Number(value);
    return Number.isInteger(n)&&n>=0&&n<=99?n:null;
  }
  function normalizeTeamSide(player,role){
    if(role==='referee'||role==='other')return null;
    const raw=player.teamSide??player.team_side??player.team??null;
    if(raw===null||raw===undefined||raw==='')return null;
    const s=String(raw).trim().toLowerCase();
    return (s==='left'||s==='right')?s:null;
  }
  function metricPoint(player){
    const x=finite(player.pitchX)?Number(player.pitchX):(finite(player.xM)?Number(player.xM):(finite(player.x)?Number(player.x):null));
    const y=finite(player.pitchY)?Number(player.pitchY):(finite(player.yM)?Number(player.yM):(finite(player.y)?Number(player.y):null));
    return x===null||y===null?null:{x,y};
  }
  function rejectCounter(map,reason){map[reason]=(map[reason]||0)+1;}

  function exportGSR(observations,options){
    const cfg={
      fps:finite(options&&options.fps)?Number(options.fps):25,
      requireReliableIdentity:options&&options.requireReliableIdentity===false?false:true,
      requireMetricValidation:options&&options.requireMetricValidation===false?false:true,
      maxCAYSimultaneous:finite(options&&options.maxCAYSimultaneous)?Number(options.maxCAYSimultaneous):11
    };
    const rows=[];
    const rejectedReasons={};
    let sourceFrames=0,acceptedFrames=0,rejectedFrames=0,sourcePlayers=0;
    for(const obs of observations||[]){
      if(!obs||(!finite(obs.frame)&&!finite(obs.time))){rejectCounter(rejectedReasons,'FRAME_OR_TIME_MISSING');continue;}
      sourceFrames++;
      const players=Array.isArray(obs.players)?obs.players:[];
      sourcePlayers+=players.length;
      const cayCount=players.filter(p=>p&&p.isCAY===true&&p.onField!==false).length;
      if(cayCount>cfg.maxCAYSimultaneous){
        rejectedFrames++;
        rejectCounter(rejectedReasons,'MORE_THAN_11_CAY_ON_FIELD');
        continue;
      }
      const frame=finite(obs.frame)?Math.round(Number(obs.frame)):Math.round(Number(obs.time)*cfg.fps);
      let acceptedThisFrame=0;
      for(const player of players){
        if(!player||player.onField===false||player.valid===false){rejectCounter(rejectedReasons,'PLAYER_NOT_VALID_ON_FIELD');continue;}
        const trackId=player.trackId??player.globalId??player.id??player.playerId??null;
        if(trackId===null||trackId===undefined||trackId===''){rejectCounter(rejectedReasons,'TRACK_ID_MISSING');continue;}
        const role=normalizeRole(player.role??player.positionRole??'player');
        if(!role){rejectCounter(rejectedReasons,'ROLE_INVALID');continue;}
        if(cfg.requireReliableIdentity&&role!=='referee'&&role!=='other'){
          const q=String(player.identityQuality??player.quality??'').toUpperCase();
          if(q!=='FIABLE'){rejectCounter(rejectedReasons,'IDENTITY_NOT_RELIABLE');continue;}
        }
        if(cfg.requireMetricValidation&&player.metricValidated!==true&&player.projectionValidated!==true){
          rejectCounter(rejectedReasons,'METRIC_PROJECTION_NOT_VALIDATED');continue;
        }
        const p=metricPoint(player);
        if(!p){rejectCounter(rejectedReasons,'PITCH_COORDINATES_MISSING');continue;}
        const teamSide=normalizeTeamSide(player,role);
        const jersey=normalizeJersey(player.jerseyNumber??player.jersey_number??player.jersey??null);
        rows.push({
          frame,
          time:finite(obs.time)?round(Number(obs.time),4):round(frame/cfg.fps,4),
          segment:obs.segment??obs.segmentId??obs.planId??null,
          track_id:trackId,
          player_id:player.playerId??player.rosterId??null,
          role,
          team_side:teamSide,
          jersey_number:(role==='referee'||role==='other')?null:jersey,
          x:round(p.x,4),
          y:round(p.y,4),
          source:'CAY_STABLE_STRICT_GSR_EXPORT_V1'
        });
        acceptedThisFrame++;
      }
      if(acceptedThisFrame>0)acceptedFrames++; else rejectedFrames++;
    }
    const playerCoverage=sourcePlayers?rows.length/sourcePlayers:0;
    const frameCoverage=sourceFrames?acceptedFrames/sourceFrames:0;
    return {
      version:'CAY_STABLE_GSR_EXPORT_V1',
      status:rows.length?'OBSERVABLE':'INDISPONIBLE',
      rows,
      sourceFrames,acceptedFrames,rejectedFrames,sourcePlayers,exportedPlayers:rows.length,
      frameCoverage:round(frameCoverage,4),playerCoverage:round(playerCoverage,4),rejectedReasons,
      policy:'EXPORT_BENCHMARK_UNIQUEMENT_COORDONNEES_METRIQUES_VALIDEES_IDENTITES_FIABLES_PAR_DEFAUT_AUCUNE_INFERENCE_DE_NUMERO_OU_EQUIPE_ET_REJET_D_UNE_FRAME_SI_PLUS_DE_11_CAY_SUR_TERRAIN',
      upstreamCompatibility:'SOCCERTRACK_V2_GSR_FLAT_CONTRACT_COMPATIBLE_CLEAN_ROOM_NOT_SOCCERNET_GPL_CODE'
    };
  }
  return {exportGSR,normalizeRole,normalizeJersey,normalizeTeamSide};
});