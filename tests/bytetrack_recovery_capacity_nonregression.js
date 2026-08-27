const assert=require('assert');
const Core=require('../tracking_core_v1.js');
const Adapter=require('../tracking_two_stage_adapter_v1.js');

const mkPlayer=(i,score=.95,shift=0,featureScale=1)=>({
  cat:i===0?'goalkeeper':'team',
  x:.05+i*.075+shift,
  y:.42+(i%3)*.05,
  score,
  feature:[(i+1)*.03*featureScale,.20,.30]
});

const state=Core.createState();
const initial=Core.assignFrame(state,Array.from({length:11},(_,i)=>mkPlayer(i)),0,{maxPlayers:11});
const initialIds=initial.map(x=>x.trackId).sort((a,b)=>a-b);
assert.strictEqual(initialIds.length,11,'fixture initiale: 11 joueurs suivis');

// 11 fortes détections parasites arrivent en même temps que 11 vraies détections temporairement faibles.
// On mesure le résultat global de la cascade, pas le passage précis qui a conservé chaque ID.
const highClutter=Array.from({length:11},(_,i)=>mkPlayer(i,.99,.38,20));
const weakTrue=Array.from({length:11},(_,i)=>mkPlayer(i,.30,.001,1));
const recovered=Adapter.assignFrame(state,[...highClutter,...weakTrue],.5,{maxPlayers:11,highScoreThreshold:.55,lowScoreThreshold:.20,lostAfter:8});
const recoveredIds=recovered.assigned.map(x=>x.trackId).sort((a,b)=>a-b);

assert(recovered.assigned.length<=11,'jamais plus de 11 CAY assignés sur une frame');
assert(recovered.assigned.length>=10,'la cascade conserve la grande majorité des identités sous clutter sévère');
assert(recoveredIds.every(id=>initialIds.includes(id)),'aucun faux ID fort ne remplace un joueur encore actif');
assert.strictEqual(recovered.newAssigned.length,0,'aucun nouvel ID n’est créé tant que le roster actif occupe les 11 places');
assert.strictEqual(Core.summary(state).rosterTotal,11,'le clutter fort ne gonfle pas artificiellement le roster');
assert((recovered.highAssigned.length+recovered.lowAssigned.length)>=10,'les récupérations existantes sont mesurables sur les deux étages');

const empty=Core.createState();
const weakOnly=Adapter.assignFrame(empty,[mkPlayer(1,.30)],0,{maxPlayers:11,highScoreThreshold:.55,lowScoreThreshold:.20});
assert.strictEqual(weakOnly.assigned.length,0,'une faible détection isolée ne crée jamais un nouvel ID');
assert.strictEqual(Core.summary(empty).rosterTotal,0,'aucun faux roster depuis une faible détection');

const aging=Core.createState();
Core.assignFrame(aging,[mkPlayer(2,.95)],0,{maxPlayers:11});
Adapter.assignFrame(aging,[],.5,{maxPlayers:11,lostAfter:8});
assert.strictEqual(aging.active[0].missed,1,'une frame sans détection vieillit le track exactement une fois');

console.log('PASS ByteTrack recovery capacity non-regression: 10/10');