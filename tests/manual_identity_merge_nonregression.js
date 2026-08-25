const assert=require('assert');
const T=require('../tracking_core_v1.js');

const state=T.createState();
const old=T.assignFrame(state,[{cat:'team',x:.20,y:.50,score:.97,feature:[.10,.20,.30]}],0,{lostAfter:0})[0];
T.assignFrame(state,[],1,{lostAfter:0});
const current=T.assignFrame(state,[{cat:'team',x:.72,y:.48,score:.96,feature:[.80,.70,.60]}],5,{lostAfter:0})[0];
assert.notStrictEqual(current.trackId,old.trackId,'une identité incertaine séparée reçoit un nouvel ID');
assert(state.archive.some(t=>t.globalId===old.trackId),'ancien ID archivé avant confirmation utilisateur');
assert(state.active.some(t=>t.globalId===current.trackId),'nouvel ID reste actif avant fusion');

const merged=T.mergeTracks(state,old.trackId,current.trackId);
assert.strictEqual(merged.globalId,old.trackId,'la fusion conserve l’ID canonique choisi');
assert.strictEqual(state.active.length,1,'la fusion ne duplique pas les tracks actifs');
assert.strictEqual(state.active[0].globalId,old.trackId,'un ID canonique ancien redevient actif si la source fusionnée était active');
assert.strictEqual(state.active[0].archived,false,'le joueur fusionné reste suivi');
assert(Math.abs(state.active[0].x-.72)<1e-9,'la position courante vient de l’observation la plus récente');
assert.strictEqual(state.archive.some(t=>t.globalId===current.trackId),false,'l’ID source disparaît du roster après confirmation');
let summary=T.summary(state);
assert.strictEqual(summary.rosterTotal,1,'la fusion manuelle dégonfle le roster sans perdre l’historique');
assert.strictEqual(summary.manualMerges,1,'la fusion manuelle est comptabilisée');
assert.deepStrictEqual(summary.tracks[0].mergedFrom,[current.trackId],'la provenance de fusion est conservée');
assert.strictEqual(summary.tracks[0].presenceIntervals.length,2,'les deux périodes observées restent séparées');

const continued=T.assignFrame(state,[{cat:'team',x:.721,y:.481,score:.96,feature:[.80,.70,.60]}],5.5,{lostAfter:2})[0];
assert.strictEqual(continued.trackId,old.trackId,'le tracking continue immédiatement sur l’ID canonique fusionné');
assert.strictEqual(T.summary(state).rosterTotal,1,'la frame suivante ne recrée pas un faux joueur');

const conflict=T.createState();
const sameFrame=T.assignFrame(conflict,[
  {cat:'team',x:.20,y:.40,score:.95,feature:[.1,.2,.3]},
  {cat:'team',x:.70,y:.40,score:.95,feature:[.7,.2,.3]}
],0);
assert.throws(()=>T.mergeTracks(conflict,sameFrame[0].trackId,sameFrame[1].trackId),/simultanés/,'deux joueurs visibles sur la même image ne peuvent jamais être fusionnés');

const categories=T.createState();
const catIds=T.assignFrame(categories,[
  {cat:'goalkeeper',x:.10,y:.50,score:.95,feature:[.1,.1,.1]},
  {cat:'team',x:.60,y:.50,score:.95,feature:[.6,.6,.6]}
],0);
T.assignFrame(categories,[],1,{lostAfter:0});
assert.throws(()=>T.mergeTracks(categories,catIds[0].trackId,catIds[1].trackId),/catégories incompatibles/,'gardien et joueur de champ ne sont pas fusionnés silencieusement');

console.log('PASS manual identity merge non-regression: 16/16');