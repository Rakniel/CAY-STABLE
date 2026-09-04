const assert=require('assert');
const Core=require('../tracking_core_v1.js');

function greedy(pairs){
  const usedT=new Set(),usedD=new Set(),out=[];
  for(const p of [...pairs].sort((a,b)=>a.cost-b.cost)){
    if(usedT.has(p.ti)||usedD.has(p.di))continue;
    usedT.add(p.ti);usedD.add(p.di);out.push(p);
  }
  return out;
}

// Local cheapest choice steals the only feasible detection of track 1.
// Greedy keeps one identity; global gated assignment preserves both.
const conflict=[
  {ti:0,di:0,cost:.10},
  {ti:0,di:1,cost:.20},
  {ti:1,di:0,cost:.11}
];
const before=greedy(conflict);
const after=Core.selectGlobalAssignment(conflict,2,2);
assert.strictEqual(before.length,1,'fixture must reproduce the previous greedy loss');
assert.strictEqual(after.length,2,'global assignment must maximize feasible identity continuity');
assert.deepStrictEqual(after.map(p=>[p.ti,p.di]),[[0,1],[1,0]]);
assert.strictEqual(new Set(after.map(p=>p.ti)).size,after.length);
assert.strictEqual(new Set(after.map(p=>p.di)).size,after.length);

// With equal cardinality, minimize total gated association cost.
const costChoice=[
  {ti:0,di:0,cost:.10},{ti:0,di:1,cost:.30},
  {ti:1,di:0,cost:.35},{ti:1,di:1,cost:.11}
];
const best=Core.selectGlobalAssignment(costChoice,2,2);
assert.deepStrictEqual(best.map(p=>[p.ti,p.di]),[[0,0],[1,1]]);
assert.ok(Math.abs(best.reduce((s,p)=>s+p.cost,0)-.21)<1e-9);

// CAY runtime is capped at 11 simultaneous players: verify the exact solver
// handles the full allowed bipartite size and remains one-to-one.
const dense=[];
for(let ti=0;ti<11;ti++)for(let di=0;di<11;di++)dense.push({ti,di,cost:Math.abs(ti-di)+di/10000});
const full=Core.selectGlobalAssignment(dense,11,11);
assert.strictEqual(full.length,11);
assert.strictEqual(new Set(full.map(p=>p.ti)).size,11);
assert.strictEqual(new Set(full.map(p=>p.di)).size,11);
assert.ok(full.every(p=>p.ti===p.di),'minimum-cost full assignment should preserve the diagonal identities');

// Out-of-range/non-finite candidates are never promoted by the optimizer.
const guarded=Core.selectGlobalAssignment([
  {ti:0,di:0,cost:.2},{ti:0,di:9,cost:.01},{ti:1,di:1,cost:NaN}
],2,2);
assert.deepStrictEqual(guarded.map(p=>[p.ti,p.di]),[[0,0]]);

console.log('tracking_global_assignment_nonregression: ok');
