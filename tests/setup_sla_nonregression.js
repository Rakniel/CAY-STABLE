const assert=require('assert');
const sla=require('../setup_sla_v1.js');
const base={team:{complete:true,seconds:60},roster:{complete:true,seconds:300},video:{complete:true,seconds:30},analysis:{complete:true,seconds:120},launch:{complete:true,seconds:20},firstResults:{complete:true,seconds:120}};
let r=sla.evaluate(base); assert.equal(r.status,'PRET_MOINS_20_MIN'); assert.equal(r.totalSeconds,650); assert.equal(r.withinTarget,true); assert.equal(r.stages.length,6);
r=sla.evaluate({...base,roster:{complete:false,seconds:300}}); assert.equal(r.status,'INCOMPLET'); assert(r.blockers.includes('ETAPE_ROSTER_INCOMPLETE'));
r=sla.evaluate({...base,video:{complete:true}}); assert.equal(r.status,'NON_MESURE'); assert.equal(r.totalSeconds,null); assert.equal(r.withinTarget,false);
r=sla.evaluate({...base,roster:{complete:true,seconds:1100}}); assert.equal(r.status,'HORS_SLA'); assert.equal(r.withinTarget,false);
r=sla.evaluate(base,{targetMinutes:12}); assert.equal(r.status,'PRET_DANS_SLA'); assert.equal(r.targetMinutes,12);
r=sla.evaluate({...base,firstResults:{complete:false,seconds:120}}); assert.equal(r.status,'INCOMPLET'); assert(r.blockers.includes('ETAPE_FIRST_RESULTS_INCOMPLETE')); assert.equal(r.withinTarget,false);
r=sla.evaluate({...base,firstResults:{complete:true}}); assert.equal(r.status,'NON_MESURE'); assert.equal(r.withinTarget,false);
for(const seconds of [null,'','  ',false,-1,NaN,Infinity]){
  const result=sla.evaluate({...base,firstResults:{complete:true,seconds}});
  assert.equal(result.status,'NON_MESURE',`invalid duration ${String(seconds)} must not pass`);
  assert.equal(result.totalSeconds,null);
  assert.equal(result.withinTarget,false);
}
for(const targetMinutes of [null,'',false,-1,0]){
  const result=sla.evaluate(base,{targetMinutes});
  assert.equal(result.targetMinutes,20,`invalid target ${String(targetMinutes)} must default to 20`);
}
console.log('setup SLA nonregression: OK');