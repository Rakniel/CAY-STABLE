'use strict';
const assert=require('node:assert/strict');
const sla=require('../setup_sla_v1.js');
const base={team:{complete:true,seconds:60},roster:{complete:true,seconds:300},video:{complete:true,seconds:30},analysis:{complete:true,seconds:120},launch:{complete:true,seconds:20},firstResults:{complete:true,seconds:120}};
const changed=(key,seconds)=>({...base,[key]:{complete:true,seconds}});
for(const invalid of ['', '  ', '\t', -1, '-12', null, undefined, NaN, Infinity, -Infinity, 'not-a-duration', false, true, [], {}, ['10']]){
  const r=sla.evaluate(changed('video',invalid));
  assert.equal(r.status,'NON_MESURE',`invalid seconds ${String(invalid)} must not certify the 20min target`);
  assert.equal(r.stages.find(x=>x.key==='video').seconds,null);
  assert.equal(r.totalSeconds,null);
  assert.equal(r.withinTarget,false);
}
for(const valid of [0,1,1.5,'12.25']){
  const r=sla.evaluate(changed('video',valid));
  assert.equal(r.measured,true,`valid ${String(valid)} should be measured`);
}
for(const invalidTarget of ['', ' ', 0, -5, 'n/a', null, undefined, Infinity, 1e308, false, [], {}]){
  const r=sla.evaluate(base,{targetMinutes:invalidTarget});
  assert.equal(r.targetMinutes,20,`invalid target ${String(invalidTarget)} must fall back to 20`);
  assert.equal(r.targetSeconds,1200);
}
const atBoundary={...base,roster:{complete:true,seconds:850}};
assert.equal(sla.evaluate(atBoundary).totalSeconds,1200);
assert.equal(sla.evaluate(atBoundary).status,'HORS_SLA','exactly 20 minutes is not strictly less than 20');
assert.equal(sla.evaluate({...atBoundary,roster:{complete:true,seconds:849.999}}).status,'PRET_MOINS_20_MIN');
const overflow={...base,team:{complete:true,seconds:1e308},roster:{complete:true,seconds:1e308}};
assert.equal(sla.evaluate(overflow).status,'NON_MESURE','overflow cannot be a defensible elapsed duration');
assert.equal(sla.evaluate(overflow).totalSeconds,null);
assert.equal(sla.evaluate(overflow).measured,false);
assert.equal(sla.evaluate({...base,team:{complete:false,seconds:''}}).status,'INCOMPLET','incomplete stage takes precedence');
console.log('setup SLA evidence integrity nonregression: OK');
