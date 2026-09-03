const assert=require('assert');
const app=require('../app_domain_models_v1.js');
let checks=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);checks++;};
const eq=(a,b,msg)=>{assert.deepStrictEqual(a,b,msg);checks++;};
const roster=[];
for(let i=1;i<=14;i++)roster.push({id:String(i),firstName:`J${i}`,number:i,primaryPosition:i===1?'GK':'CM',status:i<=11?'ACTIVE':'SUBSTITUTE'});
const team=app.createTeam({id:'senior-a',name:'Seniors A',roster,defaultLineup:roster.slice(0,11).map(x=>x.id),bench:roster.slice(11).map(x=>x.id)});
const initial=app.createMatchState(team);
eq(initial.activePlayerIds,team.defaultLineup,'match starts from configured XI');
eq(initial.benchPlayerIds,team.bench,'match starts from configured bench');
ok(initial.activePlayerIds.length===11,'never more than 11 active players');
ok(app.validateMatchParticipants(team,initial.activePlayerIds,initial.benchPlayerIds).valid,'initial match state valid');
const after=app.applySubstitution(team,initial,{outPlayerId:'5',inPlayerId:'12',atMs:1800000,reason:'TACTICAL'});
ok(after.activePlayerIds.includes('12'),'incoming substitute becomes active');
ok(!after.activePlayerIds.includes('5'),'outgoing player leaves active XI');
ok(after.benchPlayerIds.includes('5'),'outgoing player moves to bench state');
ok(!after.benchPlayerIds.includes('12'),'incoming player leaves bench state');
ok(after.activePlayerIds.length===11,'substitution preserves active player cap');
ok(after.substitutions.length===1,'substitution event is retained');
eq(after.substitutions[0],{outPlayerId:'5',inPlayerId:'12',atMs:1800000,reason:'TACTICAL'},'substitution event remains auditable');
ok(initial.activePlayerIds.includes('5'),'substitution is immutable and does not mutate previous state');
const afterSecond=app.applySubstitution(team,after,{outPlayerId:'8',inPlayerId:'13',atMs:2700000,reason:'INJURY'});
ok(afterSecond.substitutions.length===2,'successive substitutions accumulate chronologically');
ok(afterSecond.activePlayerIds.includes('13'),'second incoming player becomes active');
let badOut=false;
try{app.applySubstitution(team,afterSecond,{outPlayerId:'14',inPlayerId:'5',atMs:3000000});}catch(e){badOut=e.message==='SUBSTITUTION_OUT_NOT_ACTIVE';}
ok(badOut,'bench player cannot be declared as outgoing active player');
let badIn=false;
try{app.applySubstitution(team,afterSecond,{outPlayerId:'9',inPlayerId:'10',atMs:3000000});}catch(e){badIn=e.message==='SUBSTITUTION_IN_NOT_BENCH';}
ok(badIn,'already-active player cannot be declared as incoming substitute');
let timeRegression=false;
try{app.applySubstitution(team,afterSecond,{outPlayerId:'9',inPlayerId:'14',atMs:2600000});}catch(e){timeRegression=e.message==='SUBSTITUTION_TIME_REGRESSION';}
ok(timeRegression,'substitution timeline cannot move backwards');
const inactiveTeam={...team,roster:team.roster.map(p=>p.id==='14'?{...p,status:'INACTIVE'}:p)};
let inactiveBlocked=false;
try{app.createMatchState(inactiveTeam);}catch(e){inactiveBlocked=e.message.includes('INACTIVE_PLAYER_MATCH_BENCH');}
ok(inactiveBlocked,'inactive roster member cannot enter match bench state');
console.log(`match_substitution_state_nonregression: ${checks} checks PASS`);