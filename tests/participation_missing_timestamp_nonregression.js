const assert=require('assert');
const app=require('../app_domain_models_v1.js');

const roster=[];
for(let i=1;i<=12;i++)roster.push({id:String(i),firstName:`J${i}`,number:i,primaryPosition:i===1?'GK':'CM',status:i<=11?'ACTIVE':'SUBSTITUTE'});
const team=app.createTeam({id:'senior-a',name:'Seniors A',roster,defaultLineup:roster.slice(0,11).map(p=>p.id),bench:['12']});
const participation=app.deriveParticipationWindows(team,app.createMatchState(team),10000);
const track={globalId:1,fullPath:[
  {time:null,segment:1,x:.1,y:.1},
  {time:'',segment:1,x:.2,y:.2},
  {time:'   ',segment:1,x:.3,y:.3},
  {time:'\t',segment:1,x:.4,y:.4},
  {time:undefined,segment:1,x:.5,y:.5},
  {time:0,segment:1,x:.6,y:.6},
  {time:1,segment:1,x:.7,y:.7}
]};
const split=app.splitTrackEvidenceByParticipation(participation,'1',track);
assert.strictEqual(split.acceptedObservations,2,'only real numeric timestamps may enter participation evidence');
assert.strictEqual(split.invalidTimeObservations,5,'null/blank/whitespace/undefined timestamps must be explicitly invalid');
assert.strictEqual(split.rejectedObservations,5,'invalid timestamps must be rejected, not coerced to match start');
assert.deepStrictEqual(split.windows[0].track.fullPath.map(p=>p.time),[0,1],'a genuine t=0 remains valid');
assert.strictEqual(split.totalObservations,7,'audit totals retain all source observations');
console.log('participation_missing_timestamp_nonregression: 5 checks PASS');
