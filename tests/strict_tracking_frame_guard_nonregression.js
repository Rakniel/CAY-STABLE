const assert=require('assert');
const Bridge=require('../strict_tracking_frame_guard_v1.js');

function det(i){
  return {cat:'team',x:.05+i*.04,y:.45,score:.9,feature:[1,.2,.3,.4],isCAY:true,onField:true,teamEvidenceValid:true};
}

const bridge=Bridge.create({maxPlayers:11,lostAfter:8});
const valid=bridge.processFrame(Array.from({length:11},(_,i)=>det(i)),0,{maxPlayers:11,width:1000,height:600});
assert.strictEqual(valid.length,11,'11 detections CAY valides doivent rester exploitables');
assert.ok(new Set(valid.map(x=>x.trackId)).size===11,'les 11 IDs doivent être uniques');

const overflow=bridge.processFrame(Array.from({length:12},(_,i)=>det(i)),.5,{maxPlayers:11,width:1000,height:600});
assert.strictEqual(overflow.length,0,'une frame à 12 CAY assignables ne doit jamais être tronquée silencieusement à 11');

const snap=bridge.snapshot();
assert.strictEqual(snap.invalidObservationFrames,1,'la frame incohérente doit être comptabilisée');
assert.strictEqual(snap.invalidFrames[0].reason,'MORE_THAN_11_CAY_DETECTIONS');
assert.strictEqual(snap.invalidFrames[0].eligibleDetections,12);
assert.strictEqual(snap.invalidFrames[0].assignableDetections,12);
assert.strictEqual(snap.invalidFrames[0].normalizationRejected,0);
assert.strictEqual(snap.noSilentTruncation,true);
assert.strictEqual(snap.overflowCountsAssignableDetections,true);
assert.ok(snap.maxVisible<=11,'le tracker ne doit jamais exposer plus de 11 joueurs simultanés');

const report=bridge.report({});
assert.strictEqual(report.bridge.invalidObservationFrames,1);
assert.strictEqual(report.bridge.noSilentTruncation,true);
assert.strictEqual(report.bridge.overflowCountsAssignableDetections,true);
const bad=report.bridge.timeline.find(e=>e.type==='FRAME'&&Math.abs(e.time-.5)<1e-6);
assert.ok(bad,'la frame rejetée doit rester dans la timeline globale');
assert.strictEqual(bad.dataQuality,'INDISPONIBLE');
assert.strictEqual(bad.invalidReason,'MORE_THAN_11_CAY_DETECTIONS');
assert.strictEqual(bad.eligibleDetections,12);
assert.strictEqual(bad.assignableDetections,12);
assert.strictEqual(bad.observedPlayers,0,'aucun joueur arbitraire ne doit alimenter les stats sur la frame invalide');

const filtered=bridge.processFrame([...Array.from({length:11},(_,i)=>det(i)),{...det(11),isBench:true}],1,{maxPlayers:11,width:1000,height:600});
assert.ok(filtered.length<=11,'une détection banc explicitement rejetée ne doit pas créer un overflow');

const malformed={cat:'team',score:.9,feature:[1,.2,.3,.4],isCAY:true,onField:true,teamEvidenceValid:true};
const withMalformed=bridge.processFrame([...Array.from({length:11},(_,i)=>det(i)),malformed],1.5,{maxPlayers:11,width:1000,height:600});
assert.strictEqual(withMalformed.length,11,'une 12e entrée non normalisable ne doit pas rendre la frame indisponible');
assert.strictEqual(bridge.snapshot().invalidObservationFrames,1,'une détection non assignable ne doit pas créer un faux overflow');
const counts=Bridge.detectionCounts([...Array.from({length:11},(_,i)=>det(i)),malformed],{width:1000,height:600});
assert.strictEqual(counts.eligible,12,'le diagnostic conserve le nombre brut éligible');
assert.strictEqual(counts.assignable,11,'le garde doit compter seulement les détections réellement assignables');
assert.strictEqual(counts.normalizationRejected,1,'le diagnostic doit exposer les entrées rejetées à la normalisation');
assert.strictEqual(Bridge.eligibleCount([...Array.from({length:11},(_,i)=>det(i)),malformed],{width:1000,height:600}),11,'eligibleCount doit refléter le nombre réellement assignable');

console.log('strict tracking frame guard non-regression: PASS (25 checks)');