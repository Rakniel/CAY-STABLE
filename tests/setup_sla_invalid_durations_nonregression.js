'use strict';
const assert=require('assert');
const SLA=require('../setup_sla_v1.js');
const base={
  team:{complete:true,seconds:60},
  roster:{complete:true,seconds:300},
  video:{complete:true,seconds:30},
  analysis:{complete:true,seconds:120},
  launch:{complete:true,seconds:20},
  firstResults:{complete:true,seconds:120}
};
const invalid=[-300,'', '  ', null, undefined, true, false, [], {}, Infinity, NaN];
for(const seconds of invalid){
  const report=SLA.evaluate({...base,roster:{complete:true,seconds}});
  assert.strictEqual(report.status,'NON_MESURE','invalid stage duration must not certify the 20-minute SLA');
  assert.strictEqual(report.totalSeconds,null);
  assert.strictEqual(report.withinTarget,false);
  assert.strictEqual(report.stages.find(x=>x.key==='roster').seconds,null);
}
for(const seconds of [0,30,'30',30.5]){
  const report=SLA.evaluate({...base,video:{complete:true,seconds}});
  assert.strictEqual(report.status,'PRET_MOINS_20_MIN');
  assert.strictEqual(report.totalSeconds,620+Number(seconds));
}
const incomplete=SLA.evaluate({...base,roster:{complete:false,seconds:-2}});
assert.strictEqual(incomplete.status,'INCOMPLET');
assert(incomplete.blockers.includes('ETAPE_ROSTER_INCOMPLETE'));
const defaultTarget=SLA.evaluate(base,{targetMinutes:''});
assert.strictEqual(defaultTarget.targetMinutes,20);
assert.strictEqual(defaultTarget.status,'PRET_MOINS_20_MIN');
console.log('setup SLA duration evidence nonregression: PASS');
