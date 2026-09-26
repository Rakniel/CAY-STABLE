const assert=require('assert');
const sla=require('../setup_sla_v1.js');
const base={team:{complete:true,seconds:60},roster:{complete:true,seconds:300},video:{complete:true,seconds:30},analysis:{complete:true,seconds:120},launch:{complete:true,seconds:20}};
let r=sla.evaluate(base); assert.equal(r.status,'PRET_MOINS_20_MIN'); assert.equal(r.totalSeconds,530); assert.equal(r.withinTarget,true);
r=sla.evaluate({...base,roster:{complete:false,seconds:300}}); assert.equal(r.status,'INCOMPLET'); assert(r.blockers.includes('ETAPE_ROSTER_INCOMPLETE'));
r=sla.evaluate({...base,video:{complete:true}}); assert.equal(r.status,'NON_MESURE'); assert.equal(r.totalSeconds,null); assert.equal(r.withinTarget,false);
r=sla.evaluate({...base,roster:{complete:true,seconds:1100}}); assert.equal(r.status,'HORS_SLA'); assert.equal(r.withinTarget,false);
r=sla.evaluate(base,{targetMinutes:10}); assert.equal(r.status,'PRET_DANS_SLA'); assert.equal(r.targetMinutes,10);
console.log('setup SLA nonregression: OK');
