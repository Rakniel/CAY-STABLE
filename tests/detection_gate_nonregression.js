const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');

assert.deepStrictEqual(Bridge.detectionEligibility({onField:false}),{accepted:false,reason:'outside_playable_field'});
assert.deepStrictEqual(Bridge.detectionEligibility({isBench:true}),{accepted:false,reason:'bench'});
assert.deepStrictEqual(Bridge.detectionEligibility({sourceZone:'stands'}),{accepted:false,reason:'spectator'});
assert.deepStrictEqual(Bridge.detectionEligibility({yellowDetailOnly:true}),{accepted:false,reason:'yellow_detail_only'});
assert.deepStrictEqual(Bridge.detectionEligibility({teamEvidenceValid:false}),{accepted:false,reason:'team_evidence_rejected'});
assert.strictEqual(Bridge.detectionEligibility({cat:'team'}).accepted,true);

assert.strictEqual(Bridge.normalizeDetection({cat:'team',x:-.01,y:.5},1920,1080),null,'coordonnée x négative rejetée au lieu d être clampée');
assert.strictEqual(Bridge.normalizeDetection({cat:'team',x:1.01,y:.5},1920,1080),null,'coordonnée x > 1 rejetée au lieu d être clampée');
assert.strictEqual(Bridge.normalizeDetection({cat:'team',x:.5,y:1.01},1920,1080),null,'coordonnée y > 1 rejetée au lieu d être clampée');
assert.strictEqual(Bridge.normalizeDetection({cat:'team',box:{x:1900,y:100,w:100,h:300}},1920,1080),null,'ancre de box hors image rejetée au lieu d être clampée');
assert.deepStrictEqual(
  (({x,y})=>({x,y}))(Bridge.normalizeDetection({cat:'team',x:0,y:1},1920,1080)),
  {x:0,y:1},
  'les bornes exactes 0/1 restent valides'
);

const b=Bridge.create();
const assigned=b.processFrame([
  {cat:'team',x:.25,y:.55,score:.97,feature:[.1,.2,.3],onField:true},
  {cat:'team',x:.30,y:.20,score:.99,isBench:true},
  {cat:'team',x:.35,y:.15,score:.99,isSpectator:true},
  {cat:'team',x:.40,y:.50,score:.99,yellowDetailOnly:true},
  {cat:'team',x:.45,y:.50,score:.99,cayEligible:false}
],0,{width:1920,height:1080});
assert.strictEqual(assigned.length,1,'seule la détection terrain défendable atteint le tracking');
assert.strictEqual(b.summary().rosterTotal,1,'les faux CAY exclus ne créent jamais d ID roster');
const snap=b.snapshot();
assert.strictEqual(snap.rejectedDetections,4,'les exclusions sont comptées');
assert.strictEqual(snap.rejectedByReason.bench,1);
assert.strictEqual(snap.rejectedByReason.spectator,1);
assert.strictEqual(snap.rejectedByReason.yellow_detail_only,1);
assert.strictEqual(snap.rejectedByReason.team_evidence_rejected,1);
const report=b.report({});
assert.strictEqual(report.bridge.timeline[0].rejectedDetections,4,'la timeline conserve la couverture des rejets');
assert(report.bridge.timeline[0].rejectionReasons.includes('yellow_detail_only'));
assert.strictEqual(report.bridge.segments[0].rejectedDetections,4,'la provenance segment conserve les rejets');

const edge=Bridge.create();
const edgeAssigned=edge.processFrame([
  {cat:'team',x:1.2,y:.45,score:.99,onField:true},
  {cat:'team',x:.52,y:.46,score:.98,onField:true}
],1,{width:1920,height:1080});
assert.strictEqual(edgeAssigned.length,1,'une coordonnée hors image ne crée pas un joueur artificiel au bord');
const edgeSnap=edge.snapshot();
assert.strictEqual(edgeSnap.rejectedByReason.normalization_failed,1,'le rejet hors image reste auditable');
assert.strictEqual(edge.summary().rosterTotal,1,'aucun ID roster n est créé pour la détection clampée auparavant');
console.log('PASS detection gate non-regression: 25/25');