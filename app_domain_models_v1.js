(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYAppDomainModels=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const POSITIONS=new Set(['GK','RB','RCB','CB','LCB','LB','RWB','LWB','DM','CM','AM','RM','LM','RW','LW','SS','ST']);
  const PLAYER_STATUS=new Set(['ACTIVE','SUBSTITUTE','INACTIVE']);
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const clean=v=>String(v==null?'':v).trim();
  const id=(prefix,v)=>clean(v)||`${prefix}_${Math.random().toString(36).slice(2,10)}`;
  function rejectSecrets(raw){
    const forbidden=new Set(['password','passwordhash','token','accesstoken','refreshtoken','secret','apikey']);
    const seen=new Set();
    const visit=(value,path)=>{
      if(!value||typeof value!=='object')return;
      if(seen.has(value))return;
      seen.add(value);
      if(Array.isArray(value)){
        value.forEach((item,index)=>visit(item,`${path}[${index}]`));
        return;
      }
      for(const [key,next] of Object.entries(value)){
        const normalized=String(key).replace(/[^a-z0-9]/gi,'').toLowerCase();
        const nextPath=path?`${path}.${key}`:key;
        if(forbidden.has(normalized))throw new Error(`SECRET_FIELD_FORBIDDEN:${nextPath}`);
        visit(next,nextPath);
      }
    };
    visit(raw,'');
  }
  function createUser(raw={}){
    rejectSecrets(raw);
    return {id:id('usr',raw.id),displayName:clean(raw.displayName),email:clean(raw.email),auth:{status:'BACKEND_REQUIRED',provider:null},createdAt:raw.createdAt||null};
  }
  function createClub(raw={}){
    return {id:id('club',raw.id),name:clean(raw.name),shortName:clean(raw.shortName),logoUrl:clean(raw.logoUrl)||null,primaryColor:clean(raw.primaryColor)||null,secondaryColor:clean(raw.secondaryColor)||null};
  }
  function createSeason(raw={}){
    return {id:id('season',raw.id),label:clean(raw.label),startDate:raw.startDate||null,endDate:raw.endDate||null};
  }
  function createKit(raw={}){
    return {id:id('kit',raw.id),name:clean(raw.name)||'Tenue',shirtColor:clean(raw.shirtColor)||null,shortsColor:clean(raw.shortsColor)||null,socksColor:clean(raw.socksColor)||null,goalkeeper:raw.goalkeeper===true};
  }
  function createPlayer(raw={}){
    const primary=clean(raw.primaryPosition).toUpperCase();
    const secondary=clean(raw.secondaryPosition).toUpperCase();
    const status=clean(raw.status).toUpperCase()||'ACTIVE';
    if(primary&&!POSITIONS.has(primary))throw new Error('INVALID_PRIMARY_POSITION');
    if(secondary&&!POSITIONS.has(secondary))throw new Error('INVALID_SECONDARY_POSITION');
    if(!PLAYER_STATUS.has(status))throw new Error('INVALID_PLAYER_STATUS');
    const number=raw.number==null||raw.number===''?null:Number(raw.number);
    if(number!==null&&(!Number.isInteger(number)||number<1||number>99))throw new Error('INVALID_SHIRT_NUMBER');
    return {id:id('player',raw.id),firstName:clean(raw.firstName),lastName:clean(raw.lastName),displayName:clean(raw.displayName)||[clean(raw.firstName),clean(raw.lastName)].filter(Boolean).join(' '),number,photoUrl:clean(raw.photoUrl)||null,primaryPosition:primary||null,secondaryPosition:secondary||null,status,isGoalkeeper:raw.isGoalkeeper===true||primary==='GK'};
  }
  function createTeam(raw={}){
    const roster=Array.isArray(raw.roster)?raw.roster.map(createPlayer):[];
    const ids=roster.map(p=>p.id);
    if(new Set(ids).size!==ids.length)throw new Error('DUPLICATE_PLAYER_ID');
    return {id:id('team',raw.id),clubId:clean(raw.clubId)||null,seasonId:clean(raw.seasonId)||null,name:clean(raw.name),category:clean(raw.category),roster,kits:Array.isArray(raw.kits)?raw.kits.map(createKit):[],defaultLineup:Array.isArray(raw.defaultLineup)?raw.defaultLineup.map(String):[],bench:Array.isArray(raw.bench)?raw.bench.map(String):[]};
  }
  function validateLineup(team){
    const rosterIds=new Set((team.roster||[]).map(p=>String(p.id)));
    const lineup=(team.defaultLineup||[]).map(String),bench=(team.bench||[]).map(String);
    const errors=[];
    if(lineup.length<1)errors.push('LINEUP_EMPTY');
    if(lineup.length>11)errors.push('LINEUP_OVER_11');
    if(new Set(lineup).size!==lineup.length)errors.push('DUPLICATE_LINEUP_ID');
    if(new Set(bench).size!==bench.length)errors.push('DUPLICATE_BENCH_ID');
    if(lineup.some(x=>!rosterIds.has(x))||bench.some(x=>!rosterIds.has(x)))errors.push('UNKNOWN_ROSTER_ID');
    if(lineup.some(x=>bench.includes(x)))errors.push('PLAYER_IN_LINEUP_AND_BENCH');
    const statusById=new Map((team.roster||[]).map(p=>[String(p.id),p.status]));
    if(lineup.some(x=>statusById.get(x)==='INACTIVE'))errors.push('INACTIVE_PLAYER_IN_LINEUP');
    if(bench.some(x=>statusById.get(x)==='INACTIVE'))errors.push('INACTIVE_PLAYER_ON_BENCH');
    return {valid:errors.length===0,errors,maxActive:11,minActive:1};
  }
  function validateMatchParticipants(team,activePlayerIds,benchPlayerIds){
    const rosterIds=new Set((team.roster||[]).map(p=>String(p.id)));
    const inactiveIds=new Set((team.roster||[]).filter(p=>p.status==='INACTIVE').map(p=>String(p.id)));
    const active=(activePlayerIds||[]).map(String),bench=(benchPlayerIds||[]).map(String);
    const errors=[];
    if(active.length<1)errors.push('ACTIVE_EMPTY');
    if(active.length>11)errors.push('ACTIVE_OVER_11');
    if(new Set(active).size!==active.length)errors.push('DUPLICATE_ACTIVE_ID');
    if(new Set(bench).size!==bench.length)errors.push('DUPLICATE_MATCH_BENCH_ID');
    if(active.some(x=>!rosterIds.has(x))||bench.some(x=>!rosterIds.has(x)))errors.push('UNKNOWN_MATCH_ROSTER_ID');
    if(active.some(x=>bench.includes(x)))errors.push('PLAYER_ACTIVE_AND_BENCH');
    if(active.some(x=>inactiveIds.has(x)))errors.push('INACTIVE_PLAYER_ACTIVE');
    if(bench.some(x=>inactiveIds.has(x)))errors.push('INACTIVE_PLAYER_MATCH_BENCH');
    return {valid:errors.length===0,errors,maxActive:11};
  }
  function createMatchState(team,raw={}){
    const activePlayerIds=Array.isArray(raw.activePlayerIds)?raw.activePlayerIds.map(String):(team.defaultLineup||[]).map(String);
    const benchPlayerIds=Array.isArray(raw.benchPlayerIds)?raw.benchPlayerIds.map(String):(team.bench||[]).map(String);
    const validation=validateMatchParticipants(team,activePlayerIds,benchPlayerIds);
    if(!validation.valid)throw new Error(`INVALID_MATCH_STATE:${validation.errors.join(',')}`);
    const substitutions=Array.isArray(raw.substitutions)?raw.substitutions.map(event=>({
      outPlayerId:String(event.outPlayerId),inPlayerId:String(event.inPlayerId),atMs:Number(event.atMs),reason:clean(event.reason)||'UNKNOWN'
    })):[];
    return {teamId:String(team.id),activePlayerIds,benchPlayerIds,substitutions,source:'ROSTER_MATCH_STATE_V1'};
  }
  function applySubstitution(team,state,raw={}){
    const current=createMatchState(team,state||{});
    const outPlayerId=clean(raw.outPlayerId),inPlayerId=clean(raw.inPlayerId);
    const atMs=Number(raw.atMs);
    if(!outPlayerId||!inPlayerId)throw new Error('SUBSTITUTION_PLAYER_REQUIRED');
    if(outPlayerId===inPlayerId)throw new Error('SUBSTITUTION_SAME_PLAYER');
    if(!current.activePlayerIds.includes(outPlayerId))throw new Error('SUBSTITUTION_OUT_NOT_ACTIVE');
    if(!current.benchPlayerIds.includes(inPlayerId))throw new Error('SUBSTITUTION_IN_NOT_BENCH');
    if(!Number.isFinite(atMs)||atMs<0)throw new Error('SUBSTITUTION_INVALID_TIME');
    const last=current.substitutions[current.substitutions.length-1];
    if(last&&Number.isFinite(last.atMs)&&atMs<last.atMs)throw new Error('SUBSTITUTION_TIME_REGRESSION');
    const activePlayerIds=current.activePlayerIds.map(playerId=>playerId===outPlayerId?inPlayerId:playerId);
    const benchPlayerIds=current.benchPlayerIds.filter(playerId=>playerId!==inPlayerId).concat(outPlayerId);
    const validation=validateMatchParticipants(team,activePlayerIds,benchPlayerIds);
    if(!validation.valid)throw new Error(`INVALID_MATCH_STATE_AFTER_SUB:${validation.errors.join(',')}`);
    const event={outPlayerId,inPlayerId,atMs,reason:clean(raw.reason)||'UNKNOWN'};
    return {...current,activePlayerIds,benchPlayerIds,substitutions:current.substitutions.concat(event)};
  }
  function createAnalysisProfile(raw={}){
    const settings=raw.settings||{};
    const trackingSensitivity=settings.trackingSensitivity==null?.7:settings.trackingSensitivity;
    const reidThreshold=settings.reidThreshold==null?.78:settings.reidThreshold;
    return {id:id('analysis',raw.id),name:clean(raw.name)||'Profil standard',teamId:clean(raw.teamId)||null,settings:{trackingSensitivity:clamp01(trackingSensitivity),reidThreshold:clamp01(reidThreshold),manualReview:settings.manualReview===false?false:true},source:'USER_CONFIGURED',savedAt:raw.savedAt||null};
  }
  function createPreferences(raw={}){
    return {language:clean(raw.language)||'fr',autoSave:raw.autoSave!==false,showAdvanced:raw.showAdvanced===true,lastTeamId:clean(raw.lastTeamId)||null,lastAnalysisProfileId:clean(raw.lastAnalysisProfileId)||null};
  }
  function resolveActiveKit(team,requestedKitId){
    const usable=(team.kits||[]).filter(kit=>!!clean(kit.shirtColor));
    const requested=clean(requestedKitId);
    if(requested){
      const selected=usable.find(kit=>clean(kit.id)===requested)||null;
      return {valid:!!selected,selectedKitId:selected?selected.id:null,mode:selected?'EXPLICIT':'INVALID_EXPLICIT',usableKitIds:usable.map(kit=>kit.id)};
    }
    if(usable.length===1)return {valid:true,selectedKitId:usable[0].id,mode:'AUTO_SINGLE',usableKitIds:[usable[0].id]};
    return {valid:false,selectedKitId:null,mode:usable.length>1?'AMBIGUOUS':'NONE',usableKitIds:usable.map(kit=>kit.id)};
  }
  function setupReadiness(input={}){
    const team=input.team||createTeam({});
    const club=input.club||createClub({});
    const profile=input.analysisProfile||createAnalysisProfile({teamId:team.id});
    const kitSelection=resolveActiveKit(team,input.selectedKitId);
    const profileMatchesTeam=!!profile&&!!clean(profile.teamId)&&clean(profile.teamId)===clean(team.id);
    const checks=[
      ['CLUB_NAME',!!clean(club.name)],['TEAM_NAME',!!clean(team.name)],['ROSTER',team.roster.length>0],['KIT',kitSelection.valid],['ANALYSIS_PROFILE',!!profile],['ANALYSIS_PROFILE_TEAM',profileMatchesTeam]
    ];
    const lineup=validateLineup(team);
    checks.push(['LINEUP_VALID',lineup.valid]);
    const complete=checks.filter(x=>x[1]).length;
    return {ready:complete===checks.length,completion:+(complete/checks.length).toFixed(3),missing:checks.filter(x=>!x[1]).map(x=>x[0]),lineup,kitSelection,selectedKitId:kitSelection.selectedKitId,uxRule:'MINIMUM_REQUIRED_FIELDS_ONLY',targetSetupMinutes:20};
  }
  return {POSITIONS:[...POSITIONS],PLAYER_STATUS:[...PLAYER_STATUS],rejectSecrets,createUser,createClub,createSeason,createKit,createPlayer,createTeam,validateLineup,validateMatchParticipants,createMatchState,applySubstitution,createAnalysisProfile,createPreferences,resolveActiveKit,setupReadiness};
});