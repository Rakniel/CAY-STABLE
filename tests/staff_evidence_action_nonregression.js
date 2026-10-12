'use strict';
const assert=require('node:assert/strict');
const E=require('../staff_tactical_engine_v1.js');
const D=require('../app_domain_models_v1.js');
const base={id:'ev1',action:'THROW_IN',videoSecond:40,team:'CAY',zone:'MIDDLE_THIRD',outcome:'LOST',evidenceState:'COACH_CONFIRMED',quality:'VIDEO_REVIEWED',coachName:'Coach',matchId:'match-A',sourceVideoId:'video-A'};
let checks=0;
function eq(a,b,msg){assert.equal(a,b,msg);checks++}
function ok(v,msg){assert.ok(v,msg);checks++}
function bad(fn,msg){assert.throws(fn,undefined,msg);checks++}
for(let r=0;r<5;r++){
  for(const name of E.formationNames()){
    const a=E.makeFormation(name),b=E.makeFormation(name,'left');
    eq(a.length,11,name+' lineup');ok(a.every((p,i)=>Math.abs(p.x+b[i].x-100)<1e-9),name+' mirror');
  }
  for(const v of ['',null,undefined,'bad',-1])bad(()=>E.observation({...base,videoSecond:v}),'time invalid');
  bad(()=>E.observation({...base,quality:'AUTO_CANDIDATE'}),'AI cannot confirm');
  eq(E.summarizeObservations([base,{...base,id:'ev2'}],{matchId:'match-A'}).throwIns.lost,1,'dedup');
  const c=E.summarizeObservations([base,{...base,id:'ev2',outcome:'RETAINED'}],{matchId:'match-A'});
  eq(c.throwIns.confirmed,0,'contradiction withheld');eq(c.conflictingActionKeysExcluded,1,'diagnostic');
  eq(E.summarizeObservations([base,{...base,id:'ev2',videoSecond:41}],{matchId:'match-A'}).confirmed,2,'different time');
  eq(E.summarizeObservations([base,{...base,id:'ev2',sourceVideoId:'video-B'}],{matchId:'match-A'}).confirmed,2,'different video');
  eq(E.summarizeObservations([base,{...base,id:'ev2',matchId:'match-B'}],{matchId:'match-A'}).confirmed,1,'match scope');
  eq(E.summarizeObservations([base,{...base,id:'ev2',replayExcluded:true}],{matchId:'match-A'}).confirmed,1,'replay');
  eq(E.summarizeObservations([base,{...base,id:'ev2',evidenceState:'OBSERVED'}],{matchId:'match-A'}).confirmed,1,'unconfirmed');
  eq(E.summarizeObservations([base,{...base,id:'ev2',action:'POSITIONING'}],{matchId:'match-A'}).confirmed,2,'different action');
  eq(E.summarizeObservations([base,{...base,id:'ev1',outcome:'RETAINED'}],{matchId:'match-A'}).confirmed,0,'same id conflict');
  eq(E.summarizeObservations([{...base,id:''}],{matchId:'match-A'}).confirmed,0,'missing id');
  eq(E.summarizeObservations([base,{...base,id:'ev2',zone:'DEFENSIVE_THIRD'}],{matchId:'match-A'}).confirmed,0,'zone conflict');
  eq(E.summarizeObservations([base,{...base,id:'ev2',videoSecond:40.5}],{matchId:'match-A'}).confirmed,2,'subsecond');
  const team=D.createTeam({id:'CAY',roster:Array.from({length:12},(_,i)=>({id:'p'+i,displayName:'Joueur '+i,primaryPosition:i===0?'GK':'CM'}))});
  bad(()=>E.normalizeSheet(team,{lineup:team.roster.map(p=>p.id),formation:'4-3-3'}),'max 11');
}
console.log('PASS:',checks,'assertions / 5 passages');