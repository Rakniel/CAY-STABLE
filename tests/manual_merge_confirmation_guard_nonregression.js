const assert=require('assert');
const Base=require('../stable_tracking_bridge_v1.js');
const Guard=require('../manual_identity_merge_guard_v1.js');

const Bridge=Guard.decorate(Base);
assert.strictEqual(Bridge.__manualIdentityMergeGuardV1,true,'le bridge décoré expose le garde de fusion');
const bridge=Bridge.create({lostAfter:0,reidentifyArchived:false});
const first=bridge.processFrame([{cat:'team',x:.20,y:.50,score:.97,feature:[.1,.2,.3]}],0,{})[0];
bridge.processFrame([],1,{lostAfter:0});
const second=bridge.processFrame([{cat:'team',x:.72,y:.48,score:.96,feature:[.8,.7,.6]}],5,{lostAfter:0})[0];
assert.notStrictEqual(first.trackId,second.trackId,'deux identités incertaines restent séparées avant confirmation');
assert.throws(()=>bridge.mergePlayers(first.trackId,second.trackId),/confirmation utilisateur explicite requise/,'aucune fusion sans confirmation explicite');
assert.throws(()=>bridge.mergePlayers(first.trackId,second.trackId,{confirmed:true}),/raison utilisateur requise/,'une confirmation sans raison est refusée');
assert.strictEqual(bridge.summary().rosterTotal,2,'les refus ne modifient pas le roster');

const merged=bridge.mergePlayers(first.trackId,second.trackId,{confirmed:true,reason:'Utilisateur confirme le même joueur après comparaison vidéo'});
assert.strictEqual(merged.globalId,first.trackId,'la fusion conserve l’ID canonique demandé');
assert.strictEqual(bridge.summary().rosterTotal,1,'le roster est fusionné seulement après confirmation');
assert.deepStrictEqual(bridge.summary().tracks[0].mergedFrom,[second.trackId],'la provenance de l’ID source reste conservée');
const diag=bridge.manualIdentityMergeDiagnostics();
assert.strictEqual(diag.policy,'USER_CONFIRMED_ONLY','la politique est explicite');
assert.strictEqual(diag.count,1,'une fusion validée est auditée une fois');
assert.strictEqual(diag.audit[0].targetId,first.trackId,'l’ID cible est audité');
assert.strictEqual(diag.audit[0].sourceId,second.trackId,'l’ID source est audité');
assert.strictEqual(diag.audit[0].confirmed,true,'la confirmation est enregistrée');
assert(diag.audit[0].reason.includes('Utilisateur confirme'),'la raison utilisateur est conservée');
const report=bridge.report({});
assert.strictEqual(report.manualIdentityMerges.count,1,'le rapport final expose la fusion manuelle');
assert.strictEqual(report.manualIdentityMerges.audit[0].canonicalId,first.trackId,'le rapport expose l’ID canonique final');
const snapshot=bridge.snapshot();
assert.strictEqual(snapshot.manualIdentityMerges.count,1,'le snapshot diagnostic expose la fusion');

const conflict=Bridge.create({reidentifyArchived:false});
const same=conflict.processFrame([
  {cat:'team',x:.2,y:.4,score:.95,feature:[.1,.2,.3]},
  {cat:'team',x:.7,y:.4,score:.95,feature:[.7,.2,.3]}
],0,{});
assert.throws(()=>conflict.mergePlayers(same[0].trackId,same[1].trackId,{confirmed:true,reason:'confirmation erronée'}),/simultanés/,'même une confirmation utilisateur ne contourne pas le conflit simultané');
assert.strictEqual(conflict.manualIdentityMergeDiagnostics().count,0,'une fusion techniquement refusée n’est pas auditée comme réussie');

console.log('PASS manual merge confirmation guard non-regression: 18/18');