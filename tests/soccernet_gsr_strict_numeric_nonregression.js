'use strict';
const assert = require('node:assert/strict');
const {exportGSR} = require('../soccernet_gsr_export_v1.js');
const base = {id:1,role:'player',teamSide:'left',pitchX:12,pitchY:23,metricValidated:true,identityQuality:'FIABLE',isCAY:true};
for(const value of [true,false,[1],{value:1}]){
  assert.equal(exportGSR([{frame:value,players:[base]}]).rows.length,0,'invalid frame must not publish');
  assert.equal(exportGSR([{frame:1,players:[{...base,pitchX:value}]}]).rows.length,0,'invalid x must not publish');
  assert.equal(exportGSR([{frame:1,players:[{...base,pitchY:value}]}]).rows.length,0,'invalid y must not publish');
  assert.equal(exportGSR([{frame:1,players:[{...base,jerseyNumber:value}]}]).rows[0].jersey_number,null,'invalid jersey must not be inferred');
}
const valid=exportGSR([{frame:10,time:0.4,players:[{...base,jerseyNumber:'9'}]}]);
assert.equal(valid.rows.length,1);
assert.equal(valid.rows[0].jersey_number,9);
assert.equal(valid.rows[0].x,12);
assert.equal(valid.rows[0].y,23);
const twelve=Array.from({length:12},(_,i)=>({...base,id:i+1,pitchX:i}));
for(const max of [12,22,999,'12']){
  const result=exportGSR([{frame:1,players:twelve}],{maxCAYSimultaneous:max});
  assert.equal(result.rows.length,0,'max override must not bypass 11-player limit');
  assert.equal(result.rejectedReasons.MORE_THAN_11_CAY_ON_FIELD,1);
}
const bench=exportGSR([{frame:1,players:twelve.map((p,i)=>i===11?{...p,onField:false}:p)}]);
assert.equal(bench.rows.length,11,'roster can exceed 11 when one player is off field');
const limited=exportGSR([{frame:1,players:twelve.slice(0,6)}],{maxCAYSimultaneous:5});
assert.equal(limited.rows.length,0,'lower user cap remains enforceable');
for(const fps of [0,-1,true,[],Infinity]){
  assert.equal(exportGSR([{time:1,players:[base]}],{fps}).rows[0].frame,25,'invalid fps must fall back to 25');
}
assert.equal(exportGSR([{time:1,players:[base]}],{fps:30}).rows[0].frame,30);
assert.equal(exportGSR([{frame:'20',players:[{...base,pitchX:'12.5',jerseyNumber:'0'}]}]).rows[0].x,12.5,'numeric string compatibility');
console.log('soccernet_gsr_strict_numeric_nonregression: PASS');
