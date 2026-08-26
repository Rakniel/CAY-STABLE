const assert=require('assert');
const replacement=require('../replacement_events_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const layer=replacement.buildValidatedReplacementLayer([
  {type:'REPLACEMENT',validated:true,outPlayerId:'CAY-4',inPlayerId:'CAY-12',time:123.456,segment:7,confidence:.96,source:'manual_review'}
],['CAY-1','CAY-2','CAY-3','CAY-4','CAY-5','CAY-6','CAY-7','CAY-8','CAY-9','CAY-10','CAY-11','CAY-12']);

ok(layer.confirmedCount===1,'un remplacement avec IDs persistants chaîne est accepté');
ok(layer.rejectedCount===0,'aucun rejet artificiel des IDs CAY-*');
ok(layer.events[0].outPlayerId==='CAY-4'&&layer.events[0].inPlayerId==='CAY-12','les IDs ne sont pas coercés en Number/NaN');
ok(layer.byPlayer['CAY-4'][0].direction==='OUT','index joueur sortant conservé');
ok(layer.byPlayer['CAY-12'][0].direction==='IN','index joueur entrant conservé');
ok(layer.idPolicy.includes('SANS_COERCITION_DESTRUCTIVE'),'politique ID explicite');

const timeline=replacement.auditRosterTimeline(layer,
  ['CAY-1','CAY-2','CAY-3','CAY-4','CAY-5','CAY-6','CAY-7','CAY-8','CAY-9','CAY-10','CAY-11'],
  {maxActive:11}
);
ok(timeline.quality==='FIABLE','timeline chaîne cohérente');
ok(timeline.acceptedEvents.length===1&&timeline.rejectedEvents.length===0,'remplacement appliqué à la timeline');
ok(timeline.finalActiveIds.length===11,'onze actif reste limité à 11');
ok(!timeline.finalActiveIds.includes('CAY-4')&&timeline.finalActiveIds.includes('CAY-12'),'sortie/entrée reflétées sans perte d’identité');
ok(timeline.snapshots[0].activeIds.includes('CAY-12'),'snapshot conserve ID persistant');

const numeric=replacement.buildValidatedReplacementLayer([
  {type:'SUBSTITUTION',validated:true,outPlayerId:'4',inPlayerId:12,time:60,confidence:.9}
],[1,2,3,4,5,6,7,8,9,10,11,12]);
ok(numeric.confirmedCount===1,'compatibilité historique numérique conservée');
ok(numeric.events[0].outPlayerId===4&&numeric.events[0].inPlayerId===12,'chaîne numérique canonisée proprement');

const invalid=replacement.buildValidatedReplacementLayer([
  {type:'REPLACEMENT',validated:true,outPlayerId:'UNKNOWN',inPlayerId:'CAY-12',time:90,confidence:.95}
],['CAY-4','CAY-12']);
ok(invalid.confirmedCount===0&&invalid.rejected[0].reason==='UNKNOWN_PLAYER_ID','ID réellement inconnu toujours rejeté');

const duplicateLineup=replacement.auditRosterTimeline(layer,['CAY-1','CAY-1'],{maxActive:11});
ok(duplicateLineup.quality==='INDISPONIBLE'&&duplicateLineup.reason==='INVALID_INITIAL_LINEUP','doublon composition toujours interdit');

const invalidId=replacement.normalizePlayerId('   ');
ok(invalidId===null,'ID vide refusé');

console.log(`PASS ${pass}/16 replacement persistent ids`);