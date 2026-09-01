const assert=require('assert');
const BAS=require('../soccertrack_bas_adapter_v1.js');

const parsed=BAS.parseDataset({annotations:[
  {gameTime:'1 - 12:30',position:'750000',label:'Pass',team:'left',player_id:'9',visibility:'visible'},
  {gameTime:'2 - 01:05',position:'65000',label:'Shot',team:'right',player_id:null,visibility:'not shown'}
]});
assert.equal(parsed.quality,'EVALUABLE');
assert.equal(parsed.events.length,2);
assert.deepEqual(parsed.events.map(e=>[e.type,e.half,e.halfTimeSec]),[['PASS',1,750],['SHOT',2,65]]);

const unknown=BAS.parseDataset({annotations:[{gameTime:'1 - 00:10',position:'10000',label:'Penalty',team:'left'}]});
assert.equal(unknown.quality,'PARTIAL');
assert.equal(unknown.events.length,0);
assert.equal(unknown.errors[0].error,'UNKNOWN_BAS_LABEL');

const exported=BAS.exportCayEvents([
  {type:'PASS',time:4.2,half:1,fromTeam:'CAY',fromPlayerId:'8'},
  {type:'SHOT_CANDIDATE',time:8,half:1,publishable:false},
  {type:'SHOT',time:12.5,half:1,team:'CAY',playerId:'10'},
  {type:'TURNOVER',time:15,half:1}
]);
assert.equal(exported.quality,'EVALUABLE');
assert.equal(exported.events.length,2);
assert.deepEqual(exported.events.map(e=>e.type),['PASS','SHOT']);
assert.equal(exported.rejected,2);

assert.equal(BAS.cayEventToBas({type:'SHOT',time:1,half:3}),null);
assert.equal(BAS.parseAnnotation({gameTime:'1 - xx:10',position:'10000',label:'Pass'}).error,'INVALID_GAME_TIME');
console.log('soccertrack BAS adapter non-regression: PASS');