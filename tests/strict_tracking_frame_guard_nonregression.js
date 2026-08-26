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
assert.strictEqual(overflow.length,0,'une frame à 12 CAY ne doit jamais être tronquée silencieusement à 11');

const snap=bridge.snapshot();
assert.strictEqual(snap.invalidObservationFrames,1,'la frame incohérente doit être comptabilisée');
assert.strictEqual(snap.invalidFrames[0].reason,'MORE_THAN_11_CAY_DETECTIONS');
assert.strictEqual(snap.invalidFrames[0].eligibleDetections,12);
assert.strictEqual(snap.noSilentTruncation,true);
assert.ok(snap.maxVisible<=11,'le tracker ne doit jamais exposer plus de 11 joueurs simultanés');

const report=bridge.report({});
assert.strictEqual(report.bridge.invalidObservationFrames,1);
assert.strictEqual(report.bridge.noSilentTruncation,true);
const bad=report.bridge.timeline.find(e=>e.type==='FRAME'&&Math.abs(e.time-.5)<1e-6);
assert.ok(bad,'la frame rejetée doit rester dans la timeline globale');
assert.strictEqual(bad.dataQuality,'INDISPONIBLE');
assert.strictEqual(bad.invalidReason,'MORE_THAN_11_CAY_DETECTIONS');
assert.strictEqual(bad.eligibleDetections,12);
assert.strictEqual(bad.observedPlayers,0,'aucun joueur arbitraire ne doit alimenter les stats sur la frame invalide');

const filtered=bridge.processFrame([...Array.from({length:11},(_,i)=>det(i)),{...det(11),isBench:true}],1,{maxPlayers:11,width:1000,height:600});
assert.ok(filtered.length<=11,'une détection banc explicitement rejetée ne doit pas créer un overflow');

console.log('strict tracking frame guard non-regression: PASS (15 checks)');