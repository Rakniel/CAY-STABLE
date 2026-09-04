const assert=require('assert');
const Domain=require('../app_domain_models_v1.js');
const Binding=require('../track_roster_binding_v1.js');
const Pipeline=require('../roster_metric_pipeline_v1.js');

const roster=Array.from({length:12},(_,i)=>({id:`p${i+1}`,name:`Joueur ${i+1}`,status:'ACTIVE'}));
const team=Domain.createTeam({id:'cay-seniors',name:'C.A. Yenne Seniors',roster,defaultLineup:roster.slice(0,11).map(p=>p.id),bench:[roster[11].id]});
let match=Domain.createMatchState(team,{activePlayerIds:team.defaultLineup,benchPlayerIds:team.bench});
match=Domain.applySubstitution(team,match,{outPlayerId:'p1',inPlayerId:'p12',atMs:30000,reason:'TACTICAL'});
const participation=Domain.deriveParticipationWindows(team,match,60000);

const projectors={0:{validated:true,confidence:.95,source:'TEST_METRIC',project:p=>({x:p.x,y:p.y})}};
let bindings=Binding.createState();
bindings=Binding.bind(bindings,{trackId:'t1',playerId:'p1',source:'MANUAL',confidence:.99,confirmed:true,atMs:0});
bindings=Binding.bind(bindings,{trackId:'t12',playerId:'p12',source:'REID_FUSED',confidence:.9,confirmed:true,atMs:30000,evidence:['appearance-gallery','shirt-number-12']});

const starterTrack={globalId:'t1',fullPath:[
  {time:0,segment:0,x:0,y:0},{time:1,segment:0,x:1,y:0},{time:2,segment:0,x:2,y:0},{time:29,segment:0,x:3,y:0},
  {time:31,segment:0,x:30,y:0},{time:32,segment:0,x:31,y:0}
]};
const starter=Pipeline.build({trackId:'t1',trackRaw:starterTrack,bindingState:bindings,participation,projectors});
assert.strictEqual(starter.status,'FIABLE');
assert.strictEqual(starter.playerId,'p1');
assert.strictEqual(starter.participation.acceptedObservations,4);
assert.strictEqual(starter.participation.rejectedObservations,2);
assert.strictEqual(starter.windows.length,1);
assert.strictEqual(starter.metric.distanceM,2);
assert.strictEqual(starter.metric.metricCoveredSeconds,2);
assert.strictEqual(starter.metric.participationWindowCount,1);

const subTrack={globalId:'t12',fullPath:[
  {time:29,segment:0,x:0,y:0},{time:30,segment:0,x:10,y:0},{time:31,segment:0,x:11,y:0},{time:32,segment:0,x:12,y:0}
]};
const substitute=Pipeline.build({trackId:'t12',trackRaw:subTrack,bindingState:bindings,participation,projectors});
assert.strictEqual(substitute.status,'FIABLE');
assert.strictEqual(substitute.playerId,'p12');
assert.strictEqual(substitute.participation.acceptedObservations,3);
assert.strictEqual(substitute.participation.rejectedObservations,1);
assert.strictEqual(substitute.metric.distanceM,2);

const unknown=Pipeline.build({trackId:'missing',trackRaw:starterTrack,bindingState:bindings,participation,projectors});
assert.strictEqual(unknown.status,'INDISPONIBLE');
assert.strictEqual(unknown.metric,null);

let weak={bindings:[{trackId:'weak',playerId:'p2',source:'MANUAL',confidence:.7,confirmed:true}]};
const weakResult=Pipeline.build({trackId:'weak',trackRaw:starterTrack,bindingState:weak,participation,projectors});
assert.strictEqual(weakResult.status,'INDISPONIBLE');
assert.strictEqual(weakResult.metric,null);

const noMetric=Pipeline.build({trackId:'t1',trackRaw:starterTrack,bindingState:bindings,participation,projectors:{}});
assert.strictEqual(noMetric.status,'INDISPONIBLE');
assert.strictEqual(noMetric.metric.distanceM,null);

console.log('roster_metric_pipeline_nonregression: ok');
