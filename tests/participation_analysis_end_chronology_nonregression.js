const assert=require('assert');
const app=require('../app_domain_models_v1.js');
let checks=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);checks++;};
const eq=(a,b,msg)=>{assert.deepStrictEqual(a,b,msg);checks++;};

const roster=[];
for(let i=1;i<=12;i++)roster.push({id:String(i),firstName:`J${i}`,number:i,primaryPosition:i===1?'GK':'CM',status:i<=11?'ACTIVE':'SUBSTITUTE'});
const team=app.createTeam({id:'senior-a',name:'Seniors A',roster,defaultLineup:roster.slice(0,11).map(p=>p.id),bench:['12']});
let state=app.createMatchState(team);
state=app.applySubstitution(team,state,{outPlayerId:'11',inPlayerId:'12',atMs:60000});

let backwardsBlocked=false;
try{app.deriveParticipationWindows(team,state,59999);}catch(e){backwardsBlocked=e.message==='ANALYSIS_END_BEFORE_PARTICIPATION_START';}
ok(backwardsBlocked,'analysis end before incoming participation start fails closed');

const exactBoundary=app.deriveParticipationWindows(team,state,60000);
eq(exactBoundary.byPlayerId['12'],[{startMs:60000,endMs:60000}],'analysis end exactly at substitution boundary is chronological');
ok(app.isPlayerActiveAt(exactBoundary,'12',60000)===false,'zero-duration terminal participation publishes no presence evidence');

const openEnded=app.deriveParticipationWindows(team,state,null);
eq(openEnded.byPlayerId['12'],[{startMs:60000,endMs:null}],'absent analysis end remains explicitly open');

for(const bad of [-1,'-1','abc',Infinity,NaN]){
  let blocked=false;
  try{app.deriveParticipationWindows(team,state,bad);}catch(e){blocked=e.message==='ANALYSIS_END_INVALID';}
  ok(blocked,`invalid explicit analysis end fails closed: ${String(bad)}`);
}

for(const absent of [undefined,null,'','   ']){
  const p=app.deriveParticipationWindows(team,state,absent);
  ok(p.analysisEndMs===null,`absent analysis end stays open: ${String(absent)}`);
}

const zeroState=app.createMatchState(team);
const zeroEnd=app.deriveParticipationWindows(team,zeroState,0);
eq(zeroEnd.byPlayerId['1'],[{startMs:0,endMs:0}],'explicit zero analysis end remains valid before substitutions');

console.log(`participation_analysis_end_chronology_nonregression: ${checks} checks PASS`);
