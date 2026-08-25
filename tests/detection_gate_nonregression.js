const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');

assert.deepStrictEqual(Bridge.detectionEligibility({onField:false}),{accepted:false,reason:'outside_playable_field'});
assert.deepStrictEqual(Bridge.detectionEligibility({isBench:true}),{accepted:false,reason:'bench'});
assert.deepStrictEqual(Bridge.detectionEligibility({sourceZone:'stands'}),{accepted:false,reason:'spectator'});
assert.deepStrictEqual(Bridge.detectionEligibility({yellowDetailOnly:true}),{accepted:false,reason:'yellow_detail_only'});
assert.deepStrictEqual(Bridge.detectionEligibility({teamEvidenceValid:false}),{accepted:false,reason:'team_evidence_rejected'});
assert.strictEqual(Bridge.detectionEligibility({cat:'team'}).accepted,true);

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
console.log('PASS detection gate non-regression: 17/17');