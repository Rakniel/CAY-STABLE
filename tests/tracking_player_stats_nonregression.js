const assert=require('assert');
const T=require('../tracking_core_v1.js');
const mk=(x,feature=[.1,.2,.3],cat='team')=>({cat,x,y:.5,score:.94,feature});

const s=T.createState();
const first=T.assignFrame(s,[mk(.10)],0)[0];
T.assignFrame(s,[mk(.12)],.5);
T.assignFrame(s,[mk(.14)],1.0);
let report=T.summary(s);
let p=report.tracks.find(t=>t.id===first.trackId);
assert(p,'fiche joueur présente');
assert.strictEqual(p.presenceIntervals.length,1,'présence continue regroupée en intervalle');
assert(p.observedDuration>=1,'temps réellement observé cumulé');
assert.strictEqual(p.segmentStats.length,1,'statistiques par segment disponibles');
assert.strictEqual(p.dataQuality.metricDistance,'INDISPONIBLE','pas de faux mètres sans projection terrain');
assert.strictEqual(p.dataQuality.metricSpeed,'INDISPONIBLE','pas de faux km/h sans projection terrain');

T.startSegment(s,'camera_cut');
const second=T.assignFrame(s,[mk(.80,[.9,.8,.7])],8,{reidentifyArchived:true,reidAppearanceThreshold:.02})[0];
assert.notStrictEqual(second.trackId,first.trackId,'nouvel ID si ré-identification insuffisante');
T.mergeTracks(s,first.trackId,second.trackId);
report=T.summary(s); p=report.tracks.find(t=>t.id===first.trackId);
assert.strictEqual(report.rosterTotal,1,'fusion manuelle retire le doublon du roster');
assert(p.mergedFrom.includes(second.trackId),'provenance de fusion conservée');
assert.strictEqual(report.manualMerges,1,'fusion manuelle comptabilisée');
assert.strictEqual(p.segmentStats.length,2,'segments des deux IDs conservés après fusion');
assert(p.normalizedTravel<.1,'aucun saut caméra ajouté à la distance normalisée');

const conflict=T.createState();
const a=T.assignFrame(conflict,[mk(.1,[.1]),mk(.7,[.7])],0);
assert.throws(()=>T.mergeTracks(conflict,a[0].trackId,a[1].trackId),/simultanés/,'fusion de deux joueurs simultanés refusée');
console.log('PASS player stats/fusion non-regression: 12/12');
