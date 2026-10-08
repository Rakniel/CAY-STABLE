'use strict';
const assert=require('node:assert/strict');
const sla=require('../setup_sla_v1.js');
const base=()=>Object.fromEntries(sla.REQUIRED.map(key=>[key,{complete:true,seconds:100}]));
for(const invalid of ['', '  ', false, true, -1, '-3', [], {}, Infinity, NaN]){
  const input=base();input.video.seconds=invalid;
  const result=sla.evaluate(input);
  assert.equal(result.status,'NON_MESURE',`Invalid time ${String(invalid)} must not be treated as observed`);
  assert.equal(result.stages.find(x=>x.key==='video').seconds,null);
  assert.equal(result.totalSeconds,null);
  assert.equal(result.withinTarget,false);
}
{
 const input=base();input.video.seconds='15.25';
 const result=sla.evaluate(input);
 assert.equal(result.status,'PRET_MOINS_20_MIN');
 assert.equal(result.totalSeconds,515.25);
}
{
 const input=base();input.video.seconds=0;
 assert.equal(sla.evaluate(input).measured,true,'explicit measured zero remains valid');
}
{
 const input=base();input.video.seconds=1e308;input.roster.seconds=1e308;
 const result=sla.evaluate(input);
 assert.equal(result.status,'NON_MESURE','overflowed sum must not be reported as measured');
 assert.equal(result.totalSeconds,null);
}
{
 const result=sla.evaluate(base(),{targetMinutes:'   '});
 assert.equal(result.targetMinutes,20,'blank target must use documented default');
}
console.log('setup SLA evidence non-regression: PASS');
