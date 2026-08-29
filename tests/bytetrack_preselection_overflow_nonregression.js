const assert=require('assert');
const Core=require('../tracking_core_v1.js');
const Adapter=require('../tracking_two_stage_adapter_v1.js');

const mkPlayer=(i,score=.95,shift=0,featureScale=1)=>({
  cat:i===0?'goalkeeper':'team',
  x:.08+i*.072+shift,
  y:.40+(i%3)*.045,
  score,
  feature:[(i+1)*.03*featureScale,.20,.30]
});

const state=Core.createState();
const first=Core.assignFrame(state,Array.from({length:11},(_,i)=>mkPlayer(i)),0,{maxPlayers:11});
const originalIds=first.map(x=>x.trackId).sort((a,b)=>a-b);
assert.strictEqual(originalIds.length,11,'fixture initiale: 11 identités actives');

// Cas critique: 12 détections fortes pour 11 joueurs actifs.
// Le joueur 10 reste au-dessus du seuil high mais a le score le plus bas;
// un parasite très confiant ne doit pas l'éjecter avant l'association.
const trueDetections=Array.from({length:11},(_,i)=>mkPlayer(i,i===10?.56:.82,.002,1));
const clutter={cat:'team',x:.97,y:.08,score:.99,feature:[8,8,8]};
const result=Adapter.assignFrame(state,[...trueDetections,clutter],.5,{
  maxPlayers:11,
  highScoreThreshold:.55,
  lowScoreThreshold:.20,
  lostAfter:8,
  minimumConsecutiveFrames:1
});
const ids=result.assigned.map(x=>x.trackId).sort((a,b)=>a-b);

assert.strictEqual(result.assigned.length,11,'les 11 identités actives restent observées malgré 12 candidats high');
assert.deepStrictEqual(ids,originalIds,'aucun ID actif n’est remplacé par le parasite plus confiant');
assert.strictEqual(result.newAssigned.length,0,'aucun nouvel ID n’est créé quand les 11 places sont occupées');
assert.strictEqual(Core.summary(state).rosterTotal,11,'le roster ne gonfle pas sous overflow de détections');
assert.strictEqual(state.byteTrackPreselectionOverflow,1,'l’overflow de préselection est auditable');
assert(result.highAssigned.some(x=>Math.abs(x.score-.56)<1e-9),'la détection high la moins confiante mais cohérente est conservée pour association');
assert(!result.assigned.some(x=>Math.abs(x.x-clutter.x)<1e-6&&Math.abs(x.y-clutter.y)<1e-6),'le parasite high n’est pas publié');

console.log('PASS ByteTrack association-before-cap non-regression: 7/7');
