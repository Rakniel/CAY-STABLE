const assert=require('assert');
const R=require('../reid_evidence_fusion_v1.js');
const f=R.create({minSamples:3,minSimilarity:.85,minMargin:.05,minTemporalSeparation:0});
const a=[1,0,0], b=[.99,.05,0], c=[0,1,0], d=[.96,.2,0];
for(let i=0;i<3;i++){assert.equal(f.add('A',a,{quality:.9,team:'CAY'}),true);assert.equal(f.add('B',b,{quality:.9,team:'CAY'}),true);assert.equal(f.add('C',c,{quality:.9,team:'CAY'}),true);}
let r=f.suggest('A',['B','C']);
assert.equal(r.status,'A_VERIFIER');
assert.equal(r.reason,'REID_SUGGESTION_ONLY');
assert.equal(r.best.trackId,'B');
assert.equal(r.policy,'NEVER_AUTO_MERGE');
const low=R.create({minSamples:3,minTemporalSeparation:0}); low.add('A',a); low.add('B',b); assert.equal(low.suggest('A',['B']).status,'INDISPONIBLE');
const team=R.create({minSamples:3,minTemporalSeparation:0}); for(let i=0;i<3;i++){team.add('A',a,{team:'CAY'});team.add('X',a,{team:'ADV'});} assert.equal(team.suggest('A',['X']).status,'INDISPONIBLE');
const amb=R.create({minSamples:3,minSimilarity:.8,minMargin:.08,minTemporalSeparation:0}); for(let i=0;i<3;i++){amb.add('A',a);amb.add('B',b);amb.add('D',d);} r=amb.suggest('A',['B','D']); assert.equal(r.status,'A_VERIFIER'); assert.equal(r.reason,'AMBIGUOUS_REID');
assert.equal(f.add('Q',[1,0],{quality:.1}),false);

// A burst of adjacent frames is one visual episode, not three independent ReID proofs.
const burst=R.create({minSamples:3,minSimilarity:.85,minMargin:.05,minTemporalSeparation:.35});
for(const t of [0,.04,.08]){assert.equal(burst.add('A',a,{quality:.9,team:'CAY',time:t}),true);assert.equal(burst.add('B',b,{quality:.9,team:'CAY',time:t}),true);}
r=burst.suggest('A',['B']);
assert.equal(r.status,'INDISPONIBLE');
assert.equal(r.reason,'INSUFFICIENT_SOURCE_EVIDENCE');
assert.equal(r.rawSamples,3);
assert.equal(r.effectiveSamples,1);

// Once evidence spans genuinely separated instants, ReID may become a reviewable suggestion.
for(const t of [.4,.8]){burst.add('A',a,{quality:.9,team:'CAY',time:t});burst.add('B',b,{quality:.9,team:'CAY',time:t});}
r=burst.suggest('A',['B']);
assert.equal(r.status,'A_VERIFIER');
assert.equal(r.reason,'REID_SUGGESTION_ONLY');
assert.equal(r.best.trackId,'B');
assert.equal(r.best.samples,3);
assert.equal(r.policy,'NEVER_AUTO_MERGE');
const diag=burst.diagnostics();
assert.equal(diag.evidencePolicy,'TEMPORALLY_DIVERSE_SAMPLES');
assert.equal(diag.tracks.find(x=>x.trackId==='A').rawSamples,5);
assert.equal(diag.tracks.find(x=>x.trackId==='A').effectiveSamples,3);

// When two samples are too close, retain the highest-quality representative.
const diverse=R.temporalDiverseSamples([{time:0,quality:.4},{time:.1,quality:.9},{time:.5,quality:.8}],.35);
assert.deepEqual(diverse.map(x=>x.time),[.1,.5]);
console.log('reid_evidence_fusion_nonregression: OK');