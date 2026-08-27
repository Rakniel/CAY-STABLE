const assert=require('assert');
const R=require('../reid_evidence_fusion_v1.js');
const f=R.create({minSamples:3,minSimilarity:.85,minMargin:.05});
const a=[1,0,0], b=[.99,.05,0], c=[0,1,0], d=[.96,.2,0];
for(let i=0;i<3;i++){assert.equal(f.add('A',a,{quality:.9,team:'CAY'}),true);assert.equal(f.add('B',b,{quality:.9,team:'CAY'}),true);assert.equal(f.add('C',c,{quality:.9,team:'CAY'}),true);}
let r=f.suggest('A',['B','C']);
assert.equal(r.status,'A_VERIFIER');
assert.equal(r.reason,'REID_SUGGESTION_ONLY');
assert.equal(r.best.trackId,'B');
assert.equal(r.policy,'NEVER_AUTO_MERGE');
const low=R.create({minSamples:3}); low.add('A',a); low.add('B',b); assert.equal(low.suggest('A',['B']).status,'INDISPONIBLE');
const team=R.create({minSamples:3}); for(let i=0;i<3;i++){team.add('A',a,{team:'CAY'});team.add('X',a,{team:'ADV'});} assert.equal(team.suggest('A',['X']).status,'INDISPONIBLE');
const amb=R.create({minSamples:3,minSimilarity:.8,minMargin:.08}); for(let i=0;i<3;i++){amb.add('A',a);amb.add('B',b);amb.add('D',d);} r=amb.suggest('A',['B','D']); assert.equal(r.status,'A_VERIFIER'); assert.equal(r.reason,'AMBIGUOUS_REID');
assert.equal(f.add('Q',[1,0],{quality:.1}),false);
console.log('reid_evidence_fusion_nonregression: OK');