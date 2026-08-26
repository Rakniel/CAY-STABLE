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
assert.strictEqual(snap.invalidFrameProvenance,'TIME_AND_SEGMENT');
assert.strictEqual(snap.invalidFrameLookup,'INDEXED_TIME_AND_SEGMENT');
assert.ok(snap.maxVisible<=11,'le tracker ne doit jamais exposer plus de 11 joueurs simultanés');

let report=bridge.report({});
assert.strictEqual(report.bridge.invalidObservationFrames,1);
assert.strictEqual(report.bridge.noSilentTruncation,true);
assert.strictEqual(report.bridge.overflowCountsAssignableDetections,true);
assert.strictEqual(report.bridge.invalidFrameProvenance,'TIME_AND_SEGMENT');
assert.strictEqual(report.bridge.invalidFrameLookup,'INDEXED_TIME_AND_SEGMENT');
let bad=report.bridge.timeline.find(e=>e.type==='FRAME'&&Math.abs(e.time-.5)<1e-6);
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

const unavailable=bridge.processUnavailableFrame(2,{maxPlayers:11,width:1000,height:600,reason:'FIELD_POLYGON_UNAVAILABLE'});
assert.deepStrictEqual(unavailable,[],'une frame sans terrain exploitable ne doit produire aucune association joueur');
const unavailableSnap=bridge.snapshot();
assert.strictEqual(unavailableSnap.invalidObservationFrames,2,'la frame terrain indisponible doit être comptée explicitement');
assert.strictEqual(unavailableSnap.invalidFrames[1].reason,'FIELD_POLYGON_UNAVAILABLE');
assert.strictEqual(unavailableSnap.invalidFrames[1].policy,'explicit_unavailable_no_fallback');
report=bridge.report({});
bad=report.bridge.timeline.find(e=>e.type==='FRAME'&&Math.abs(e.time-2)<1e-6);
assert.ok(bad,'la frame terrain indisponible doit rester dans la timeline');
assert.strictEqual(bad.dataQuality,'INDISPONIBLE');
assert.strictEqual(bad.invalidReason,'FIELD_POLYGON_UNAVAILABLE');
assert.strictEqual(bad.observedPlayers,0);
assert.strictEqual(report.bridge.attemptedObservationFrames,5,'toutes les frames tentées doivent rester au dénominateur');
assert.strictEqual(report.bridge.usableObservationFrames,3,'seules les frames non invalidées sont utilisables');
assert.strictEqual(report.bridge.unavailableObservationFrames,2,'overflow et terrain indisponible doivent être exposés');
assert.strictEqual(report.bridge.observationCoverage,.6,'la couverture ne doit pas masquer les frames indisponibles');
assert.deepStrictEqual(report.bridge.unavailableReasons,{MORE_THAN_11_CAY_DETECTIONS:1,FIELD_POLYGON_UNAVAILABLE:1});
assert.strictEqual(report.bridge.calculation,'FRAMES_UTILISABLES_SUR_FRAMES_TENTEES');
assert.strictEqual(report.bridge.policy,'AUCUN_INSTANT_INDISPONIBLE_MASQUE');

const cutBridge=Bridge.create({maxPlayers:11,lostAfter:8});
cutBridge.processFrame([det(0)],0,{maxPlayers:11,width:1000,height:600});
const cutOverflow=cutBridge.processFrame(Array.from({length:12},(_,i)=>det(i)),2,{maxPlayers:11,width:1000,height:600,segmentBreak:true,segmentReason:'camera_cut_test'});
assert.strictEqual(cutOverflow.length,0,'un overflow sur une vraie coupure reste indisponible');
const cutSnap=cutBridge.snapshot();
assert.strictEqual(cutSnap.invalidFrames[0].segment,2,'la provenance de la frame invalide doit pointer vers le nouveau segment après la coupure');
const cutReport=cutBridge.report({});
const cutFrame=cutReport.bridge.timeline.find(e=>e.type==='FRAME'&&Math.abs(e.time-2)<1e-6&&e.segment===2);
assert.ok(cutFrame,'la frame rejetée après cut doit exister sur le bon segment');
assert.strictEqual(cutFrame.dataQuality,'INDISPONIBLE','seule la frame du segment correspondant reçoit le marquage invalide');
assert.strictEqual(cutFrame.invalidReason,'MORE_THAN_11_CAY_DETECTIONS');

const unavailableCut=Bridge.create({maxPlayers:11,lostAfter:8});
unavailableCut.processFrame([det(0)],0,{maxPlayers:11,width:1000,height:600});
unavailableCut.processUnavailableFrame(1,{maxPlayers:11,width:1000,height:600,reason:'FIELD_POLYGON_UNAVAILABLE',segmentBreak:true,segmentReason:'camera_cut_without_field'});
const unavailableCutReport=unavailableCut.report({});
const unavailableCutFrame=unavailableCutReport.bridge.timeline.find(e=>e.type==='FRAME'&&Math.abs(e.time-1)<1e-6);
assert.strictEqual(unavailableCutFrame.segment,2,'une frame indisponible pendant un cut doit conserver la provenance du nouveau segment');
assert.strictEqual(unavailableCutFrame.invalidReason,'FIELD_POLYGON_UNAVAILABLE');

const configured=Bridge.create({maxPlayers:7,lostAfter:8});
configured.processFrame(Array.from({length:8},(_,i)=>det(i)),0,{maxPlayers:7,width:1000,height:600});
assert.strictEqual(configured.snapshot().invalidFrames[0].reason,'MORE_THAN_CONFIGURED_CAY_DETECTIONS','un plafond configuré inférieur à 11 ne doit pas être diagnostiqué comme un faux dépassement de 11');

const scale=Bridge.create({maxPlayers:11,lostAfter:8});
for(let i=0;i<600;i++){
  const t=i*.5;
  if(i%3===0)scale.processUnavailableFrame(t,{maxPlayers:11,width:1000,height:600,reason:'FIELD_POLYGON_UNAVAILABLE'});
  else scale.processFrame([det(i%11)],t,{maxPlayers:11,width:1000,height:600});
}
const scaleReport=scale.report({});
assert.strictEqual(scaleReport.bridge.attemptedObservationFrames,600,'le rapport indexé doit conserver toutes les frames sur une séquence longue');
assert.strictEqual(scaleReport.bridge.unavailableObservationFrames,200,'le rapport indexé doit retrouver toutes les frames indisponibles sans balayage quadratique');
assert.strictEqual(scaleReport.bridge.usableObservationFrames,400,'le rapport indexé doit conserver exactement les frames utilisables');
assert.strictEqual(scaleReport.bridge.observationCoverage,.6667,'la couverture longue doit rester exacte après indexation');
assert.strictEqual(scaleReport.bridge.invalidFrameLookup,'INDEXED_TIME_AND_SEGMENT','le rapport doit exposer la stratégie de recherche indexée');

console.log('strict tracking frame guard non-regression: PASS (57 checks)');