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
assert(after.every(x=>!ids0.includes(x.trackId)),'par défaut: nouveau plan sans ré-identification arbitraire');
summary=T.summary(state);
assert(summary.rosterTotal>11,'roster match peut dépasser 11 avec changement/segment');
assert.strictEqual(summary.maxVisible,11,'maximum simultané reste 11');

const reidState=T.createState();
const first=T.assignFrame(reidState,mk(3),0);
const firstIds=first.map(x=>x.trackId);
T.assignFrame(reidState,mk(3,.001),.5);
T.startSegment(reidState,'camera_cut');
const reid=T.assignFrame(reidState,mk(3,.35),10,{reidentifyArchived:true,reidAppearanceThreshold:.08});
assert.deepStrictEqual(reid.map(x=>x.trackId).sort((a,b)=>a-b),firstIds.slice().sort((a,b)=>a-b),'ré-identification forte conserve les IDs malgré nouveau cadrage');
assert.strictEqual(new Set(reid.map(x=>x.trackId)).size,reid.length,'ré-identification: aucun ID dupliqué');
const reidSummary=T.summary(reidState);
assert.strictEqual(reidSummary.rosterTotal,3,'ré-identification forte ne gonfle pas artificiellement le roster');
assert.strictEqual(reidSummary.reidentified,3,'compteur de ré-identifications mesurable');
assert(reidSummary.tracks.every(x=>x.segments.length===2),'chaque ID conserve ses segments');
const leader2=reidSummary.tracks.find(x=>x.id===firstIds[0]);
assert(leader2.normalizedTravel<.01,'aucune distance artificielle ajoutée entre deux plans caméra');

const uncertain=T.createState();
T.assignFrame(uncertain,mk(2),0);
T.startSegment(uncertain,'camera_cut');
const changed=mk(2,.2).map((d,i)=>({...d,feature:[.9-i*.1,.9,.9]}));
const uncertainAfter=T.assignFrame(uncertain,changed,5,{reidentifyArchived:true,reidAppearanceThreshold:.08});
assert(uncertainAfter.every(x=>x.trackId>2),'apparence incertaine: nouveaux IDs plutôt que mauvaise fusion');

const sameSegment=T.createState();
const original=T.assignFrame(sameSegment,[{cat:'team',x:.20,y:.50,score:.96,feature:[.12,.34,.56]}],0,{lostAfter:1})[0];
T.assignFrame(sameSegment,[],1,{lostAfter:1});
T.assignFrame(sameSegment,[],2,{lostAfter:1});
const returned=T.assignFrame(sameSegment,[{cat:'team',x:.78,y:.51,score:.95,feature:[.12,.34,.56]}],5,{lostAfter:1,reidentifyArchived:true,reidAppearanceThreshold:.05,minSameSegmentReidGap:2})[0];
assert.strictEqual(returned.trackId,original.trackId,'longue disparition dans le même plan: ID conservé seulement avec apparence forte');
const sameSummary=T.summary(sameSegment);
assert.strictEqual(sameSummary.rosterTotal,1,'retour confirmé ne gonfle pas le roster');
assert.strictEqual(sameSummary.tracks[0].presenceIntervals.length,2,'disparition longue crée deux intervalles de présence');

const ambiguous=T.createState();
T.assignFrame(ambiguous,[
  {cat:'team',x:.20,y:.45,score:.96,feature:[.20,.20,.20]},
  {cat:'team',x:.70,y:.45,score:.95,feature:[.205,.20,.20]}
],0,{lostAfter:0});
T.assignFrame(ambiguous,[],1,{lostAfter:0});
const ambiguousReturn=T.assignFrame(ambiguous,[{cat:'team',x:.45,y:.46,score:.96,feature:[.202,.20,.20]}],5,{lostAfter:0,reidentifyArchived:true,reidAppearanceThreshold:.05,reidUniquenessMargin:.01})[0];
assert(ambiguousReturn.trackId>2,'apparences trop proches: nouvel ID plutôt qu’une ré-identification ambiguë');
assert.strictEqual(T.summary(ambiguous).reidRejectedAmbiguous,1,'rejet ambigu mesuré dans le diagnostic');

console.log('PASS tracking core non-regression: 19/19');