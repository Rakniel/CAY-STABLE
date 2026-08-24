const assert=require('assert');
const T=require('../tracking_core_v1.js');
const state=T.createState();
const mk=(n,shift=0)=>Array.from({length:n},(_,i)=>({cat:i===0?'goalkeeper':'team',x:.05+i*.07+shift,y:.45+(i%3)*.04,score:.95,feature:[i/20,.2,.3]}));

let assigned=T.assignFrame(state,mk(13),0);
assert.strictEqual(assigned.length,11,'jamais plus de 11 simultanés');
assert.strictEqual(new Set(assigned.map(x=>x.trackId)).size,assigned.length,'aucun ID dupliqué sur une frame');
const ids0=assigned.map(x=>x.trackId);

assigned=T.assignFrame(state,mk(11,.001),.5);
assert.deepStrictEqual(assigned.map(x=>x.trackId).sort((a,b)=>a-b),ids0.slice().sort((a,b)=>a-b),'IDs continus sur mouvement faible');

for(let f=2;f<102;f++)T.assignFrame(state,mk(11,.001*f),f*.5);
let summary=T.summary(state);
const leader=summary.tracks.find(x=>x.id===ids0[0]);
assert(leader.pathPoints>=100,'historique complet conservé au-delà de 30 points');
assert(leader.normalizedTravel>0,'déplacement normalisé calculé sur historique complet');

T.startSegment(state,'camera_cut');
const after=T.assignFrame(state,mk(11),60);
assert(after.every(x=>!ids0.includes(x.trackId)),'nouveau plan: pas de ré-identification arbitraire');
summary=T.summary(state);
assert(summary.rosterTotal>11,'roster match peut dépasser 11 avec changement/segment');
assert.strictEqual(summary.maxVisible,11,'maximum simultané reste 11');

console.log('PASS tracking core non-regression: 7/7');
