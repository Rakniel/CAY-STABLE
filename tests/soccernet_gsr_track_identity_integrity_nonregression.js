'use strict';
const assert=require('node:assert/strict');
const {exportGSR}=require('../soccernet_gsr_export_v1.js');
const player=(id,overrides={})=>({id,role:'player',isCAY:true,teamSide:'left',pitchX:20,pitchY:30,metricValidated:true,identityQuality:'FIABLE',...overrides});
const frame=(players,n=1)=>({frame:n,time:n/25,players});
const cases=[
  {name:'same numeric ID',players:[player(7),player(7,{pitchX:22})]},
  {name:'numeric/string alias',players:[player(7),player('7',{pitchX:22})]},
  {name:'duplicate after valid row',players:[player('unique'),player(8),player(8,{pitchX:25})]},
  {name:'boolean track ID',players:[player(true)]},
  {name:'object track ID',players:[player({track:1})]},
  {name:'blank track ID',players:[player('  ')]}
];
for(const [index,test] of cases.entries()){
  const result=exportGSR([frame(test.players,index+1)]);
  assert.equal(result.status,'INDISPONIBLE',test.name);
  assert.equal(result.rows.length,0,test.name);
  assert.equal(result.acceptedFrames,0,test.name);
  assert.equal(result.rejectedFrames,1,test.name);
}
const mixed=exportGSR([frame([player(1),player(2)],1),frame([player(3),player(3)],2),frame([player('valid')],3)]);
assert.equal(mixed.rows.length,3);
assert.equal(mixed.acceptedFrames,2);
assert.equal(mixed.rejectedFrames,1);
assert.equal(mixed.frameCoverage,0.6667);
assert.equal(mixed.playerCoverage,0.6);
console.log('soccernet_gsr_track_identity_integrity_nonregression: PASS');
