(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./app_domain_models_v1.js'):root.CAYAppDomainModels);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYStaffTacticalEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Domain){
'use strict';
const VERSION='CAY_STAFF_TACTICAL_ENGINE_V1';
const SHAPES={
 '4-4-2':[[4,'BACK'],[4,'MID'],[2,'FRONT']],
 '4-4-2 diamant':[[4,'BACK'],[1,'DM'],[2,'CM'],[1,'AM'],[2,'FRONT']],
 '4-3-3':[[4,'BACK'],[1,'DM'],[2,'CM'],[3,'FRONT']],
 '4-2-3-1':[[4,'BACK'],[2,'DM'],[3,'AM'],[1,'FRONT']],
 '4-1-4-1':[[4,'BACK'],[1,'DM'],[4,'MID'],[1,'FRONT']],
 '4-5-1':[[4,'BACK'],[5,'MID'],[1,'FRONT']],
 '4-2-2-2':[[4,'BACK'],[2,'DM'],[2,'AM'],[2,'FRONT']],
 '4-3-1-2':[[4,'BACK'],[3,'MID'],[1,'AM'],[2,'FRONT']],
 '4-1-2-1-2':[[4,'BACK'],[1,'DM'],[2,'CM'],[1,'AM'],[2,'FRONT']],
 '4-2-4':[[4,'BACK'],[2,'MID'],[4,'FRONT']],
 '3-5-2':[[3,'BACK'],[2,'WING_BACK'],[3,'MID'],[2,'FRONT']],
 '3-4-3':[[3,'BACK'],[4,'MID'],[3,'FRONT']],
 '3-4-2-1':[[3,'BACK'],[4,'MID'],[2,'AM'],[1,'FRONT']],
 '3-4-1-2':[[3,'BACK'],[4,'MID'],[1,'AM'],[2,'FRONT']],
 '3-2-4-1':[[3,'BACK'],[2,'DM'],[4,'AM'],[1,'FRONT']],
 '5-3-2':[[5,'BACK'],[3,'MID'],[2,'FRONT']],
 '5-4-1':[[5,'BACK'],[4,'MID'],[1,'FRONT']],
 '5-2-3':[[5,'BACK'],[2,'MID'],[3,'FRONT']]
};
const PLAYS={
  'appel-contre-appel':{label:'Appel / contre-appel',focus:'Désynchroniser les courses : attirer, décrocher, attaquer espace libre',tags:['MOUVEMENT','DEMARQUAGE']},
  'faux-neuf':{label:'Faux 9',focus:'Décrochage du 9, occupation profondeur par les ailiers, connexion au 10',tags:['F9','ZONE14']},
  'numero-dix':{label:'Numéro 10 entre les lignes',focus:'Se rendre disponible entre lignes et fixer avant la dernière passe',tags:['10','ENTRELIGNES']},
  'hors-jeu':{label:'Ligne de hors-jeu (simulation)',focus:'Synchroniser appel/passe et observation avant-dernier défenseur; aucun jugement arbitral automatique',tags:['PROFONDEUR','TIMING']},
  'touche-courte':{label:'Touche : triangle de soutien',focus:'Porteur + appui proche + troisième homme, sécuriser première remise',tags:['TOUCHE','CONSERVATION']},
  'touche-longue':{label:'Touche : profondeur',focus:'Appel proche pour fixer, second appel en profondeur, couvrir la deuxième balle',tags:['TOUCHE','DEUXIEMEBALLE']},
  'coulissement':{label:'Coulissement du bloc',focus:'Fermer axe, côté faible et distances interlignes lors du déplacement du ballon',tags:['BLOC','DEFENSE']},
  'transition-defensive':{label:'Perte de balle : repli',focus:'Pression sur porteur, couverture derrière, fermeture axe et profondeur',tags:['TRANSITION','REPLI']},
  'transition-offensive':{label:'Récupération : contre-attaque',focus:'Première passe sécurisée, soutien, profondeur, choix contre-attaque ou conservation',tags:['TRANSITION','GAIN']},
  'jeu-de-tete':{label:'Duel aérien / second ballon',focus:'Timing impulsion, protection, couverture des retombées',tags:['AERIEN','SECOND_BALLON']},
  'corner':{label:'Corner / coup de pied arrêté',focus:'Variantes premier poteau, deuxième poteau, retrait, couverture transition',tags:['CPA','CORNER']},
  'coup-franc':{label:'Coup franc',focus:'Timing des courses, zones, écran licite et organisation à la perte',tags:['CPA']}
};
function clamp(v,min=0,max=100){const n=Number(v);if(!Number.isFinite(n))throw Error('COORDINATE_INVALID');return Math.max(min,Math.min(max,n));}
function formationNames(){return Object.keys(SHAPES);}
function makeFormation(name='4-3-3',direction='right'){
 const shape=SHAPES[name];if(!shape)throw Error('UNKNOWN_FORMATION');
 if(direction!=='right'&&direction!=='left')throw Error('INVALID_DIRECTION');
 const out=[{slot:'GK',role:'GK',x:7,y:50}];
 const anchors={BACK:24,DM:42,CM:58,MID:56,WING_BACK:48,AM:70,FRONT:84};
 let offset=0;
 shape.forEach(([count,group],i)=>{
   const x=anchors[group];
   for(let k=0;k<count;k++){
     let y=100*(k+1)/(count+1);
     if(group==='WING_BACK')y=k===0?8:92;
     let role=group==='FRONT'?(count===1?'ST':count===3?(k===0?'LW':k===1?'ST':'RW'):'ST'):group==='AM'?(count===1?'AM':count===3?(k===0?'LM':k===1?'AM':'RM'):'AM'):group==='DM'?'DM':group==='WING_BACK'?(k===0?'LWB':'RWB'):group==='BACK'?(k===0?'LB':k===count-1?'RB':'CB'):(count===1?'CM':count===3&&k===1?'CM':count===4&&(k===0||k===3)?(k===0?'LM':'RM'):'CM');
     out.push({slot:`${group}_${++offset}`,role,x,y});
   }
 });
 if(out.length!==11)throw Error('FORMATION_NOT_11');
 // Widely-spaced wingbacks belong between defence and midfield, even in 3-5-2.
 if(name==='3-5-2'){out.filter(p=>p.slot.startsWith('WING_BACK')).forEach(p=>p.x=48);}
 // More specific x locations preserve diamond shape, defensive pivots and two striker lines.
 if(name==='4-4-2 diamant'||name==='4-1-2-1-2'){
   out.filter(p=>p.slot.startsWith('DM')).forEach(p=>p.x=39);
   out.filter(p=>p.slot.startsWith('CM')).forEach(p=>p.x=54);
   out.filter(p=>p.slot.startsWith('AM')).forEach(p=>p.x=68);
   out.filter(p=>p.slot.startsWith('FRONT')).forEach(p=>p.x=83);
 }
 if(direction==='left')out.forEach(p=>p.x=100-p.x);
 return out;
}
function normalizeSheet(team,raw={}){
 if(!Domain||typeof Domain.createTeam!=='function')throw Error('CAY_DOMAIN_REQUIRED');
 const t=Domain.createTeam(team),lineup=Array.isArray(raw.lineup)?raw.lineup.map(String):[],bench=Array.isArray(raw.bench)?raw.bench.map(String):[];
 const check=Domain.validateMatchParticipants(t,lineup,bench);
 if(!check.valid)throw Error('MATCH_SHEET_INVALID:'+check.errors.join(','));
 const formation=raw.formation||'4-3-3';if(!SHAPES[formation])throw Error('UNKNOWN_FORMATION');
 const entries=Array.isArray(raw.positions)?raw.positions:[];
 const ids=new Set(lineup),slots=new Set();
 const positions=entries.map(p=>{
  const playerId=String(p.playerId||'');if(!ids.has(playerId))throw Error('UNASSIGNED_POSITION_PLAYER');
  if(slots.has(playerId))throw Error('DUPLICATE_POSITION_PLAYER');slots.add(playerId);
  return {playerId,x:clamp(p.x),y:clamp(p.y),role:String(p.role||'').slice(0,30)};
 });
 return {version:VERSION,matchId:String(raw.matchId||''),opponent:String(raw.opponent||''),date:String(raw.date||''),formation,lineup,bench,positions,validatedByCoach:raw.validatedByCoach===true,coachNote:String(raw.coachNote||'').slice(0,2000),updatedAt:String(raw.updatedAt||'')};
}
function placeLineup(team,raw){
 const sheet=normalizeSheet(team,raw),slots=makeFormation(sheet.formation,raw.direction||'right');
 const existing=new Map(sheet.positions.map(p=>[p.playerId,p]));
 return sheet.lineup.map((id,i)=>({...slots[i],...existing.get(id),playerId:id}));
}
const EVIDENCE_STATES=['OBSERVED','COACH_CONFIRMED','REJECTED'];
const ACTIONS=['THROW_IN','BALL_GAIN','BALL_LOSS','PASS','SHOT','OFFSIDE','AERIAL_DUEL','CORNER','FREE_KICK','DEFENSIVE_TRANSITION','ATTACKING_TRANSITION','POSITIONING','OTHER'];
const ZONES=['DEFENSIVE_THIRD','MIDDLE_THIRD','ATTACKING_THIRD','UNKNOWN'];
function observation(raw={}){
 if(!ACTIONS.includes(raw.action))throw Error('UNKNOWN_ACTION');
 const start=Number(raw.videoSecond);if(!Number.isFinite(start)||start<0)throw Error('VIDEO_TIME_INVALID');
 const state=raw.evidenceState||'OBSERVED';if(!EVIDENCE_STATES.includes(state))throw Error('INVALID_EVIDENCE_STATE');
 const zone=raw.zone||'UNKNOWN';if(!ZONES.includes(zone))throw Error('INVALID_ZONE');
 const owner=raw.team||'UNKNOWN';if(!['CAY','OPPONENT','UNKNOWN'].includes(owner))throw Error('INVALID_TEAM');
 let outcome=raw.outcome||'UNKNOWN';if(!['RETAINED','LOST','WON','NO_CONCLUSION','UNKNOWN'].includes(outcome))throw Error('INVALID_OUTCOME');
 const quality=raw.quality||'MANUAL';if(!['MANUAL','VIDEO_REVIEWED','AUTO_CANDIDATE'].includes(quality))throw Error('INVALID_EVIDENCE_SOURCE');
 if(state==='COACH_CONFIRMED'&&(!String(raw.coachName||'').trim()||quality==='AUTO_CANDIDATE'))throw Error('COACH_CONFIRMATION_REQUIRED');
 return {id:String(raw.id||''),action:raw.action,videoSecond:start,team:owner,zone,outcome,evidenceState:state,quality,coachName:state==='COACH_CONFIRMED'?String(raw.coachName).slice(0,120):null,playerId:raw.playerId==null?null:String(raw.playerId),notes:String(raw.notes||'').slice(0,2000),matchId:String(raw.matchId||''),sourceVideoId:String(raw.sourceVideoId||''),replayExcluded:raw.replayExcluded===true};
}
function summarizeObservations(input){
 const rows=(Array.isArray(input)?input:[]).map(observation);
 const confirmed=rows.filter(r=>r.evidenceState==='COACH_CONFIRMED'&&!r.replayExcluded&&r.sourceVideoId);
 const grouped={};for(const action of ACTIONS){const items=confirmed.filter(r=>r.action===action);grouped[action]={confirmed:items.length,byZone:Object.fromEntries(ZONES.map(z=>[z,items.filter(i=>i.zone===z).length]))};}
 const touch=confirmed.filter(r=>r.action==='THROW_IN'&&r.team==='CAY');
 const evaluated=touch.filter(r=>r.outcome==='RETAINED'||r.outcome==='LOST');
 const kept=evaluated.filter(r=>r.outcome==='RETAINED').length;
 const throwIns={confirmed:touch.length,evaluable:evaluated.length,retained:kept,lost:evaluated.length-kept,retentionPct:evaluated.length?Math.round(100*kept/evaluated.length):null,coverage:evaluated.length&&touch.length?+(evaluated.length/touch.length).toFixed(3):0,status:evaluated.length?'PARTIEL':'INDISPONIBLE',rule:'CONSERVATION_APRES_TOUCHE_UNIQUEMENT_SUR_ACTIONS_REVUES_ET_VALIDÉES; NON_REPRÉSENTATIF_SANS_COUVERTURE_COMPLETE'};
 const risks=[];
 if(evaluated.length>=3&&kept/evaluated.length<.5)risks.push({play:'touche-courte',cause:'Pertes fréquentes après touche favorable dans les séquences validées',sample:evaluated.length,action:'Répéter triangle de soutien et troisième homme; annoter pression, zone et première remise'});
 const defensive=confirmed.filter(r=>r.action==='BALL_LOSS'&&r.zone==='DEFENSIVE_THIRD');
 if(defensive.length>=3)risks.push({play:'transition-defensive',cause:'Plusieurs pertes dans le tiers défensif',sample:defensive.length,action:'Atelier sortie de pression, couverture à la perte et fermeture de l’axe'});
 const offside=confirmed.filter(r=>r.action==='OFFSIDE');
 if(offside.length>=3)risks.push({play:'appel-contre-appel',cause:'Hors-jeu répétés confirmés',sample:offside.length,action:'Synchronisation porteur/receveur, appel-contre-appel et choix du moment de passe'});
 const eventsByVideo=confirmed.filter(r=>r.sourceVideoId).map(r=>({matchId:r.matchId,videoSecond:r.videoSecond,sourceVideoId:r.sourceVideoId,action:r.action}));
 return {version:VERSION,total:rows.length,confirmed:confirmed.length,excluded:rows.length-confirmed.length,grouped,throwIns,risks,eventsByVideo,policy:'UN EVENEMENT IA NON VALIDE N EST PAS UN FAIT; LES EXERCICES SONT DES SUGGESTIONS HEURISTIQUES; ZERO STATISTIQUE SUR LES SEQUENCES NON OBSERVEES'};
}
return {VERSION,SHAPES,PLAYS,formationNames,makeFormation,normalizeSheet,placeLineup,ACTIONS,ZONES,observation,summarizeObservations};
});
