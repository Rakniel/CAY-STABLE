const assert=require('assert');
const Bridge=require('../strict_tracking_frame_guard_v1.js');

function det(i=0){
  return {cat:'team',x:.12+i*.04,y:.45,score:.9,feature:[1,.2,.3,.4],isCAY:true,onField:true,teamEvidenceValid:true};
}
function ctx(extra={}){
  return {maxPlayers:11,width:1000,height:600,...extra};
}

assert.strictEqual(Bridge.strictFrameGuardVersion,'1.5.0','le garde strict doit exposer la politique de récupération après trou aveugle');

const longGap=Bridge.create({maxPlayers:11,lostAfter:8,longGapSeconds:2.5});
longGap.processFrame([det()],0,ctx());
longGap.processUnavailableFrame(1,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
longGap.processUnavailableFrame(2,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
longGap.processUnavailableFrame(3,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
longGap.processFrame([det()],3.5,ctx());
let report=longGap.report({});
let recovery=report.bridge.timeline.find(e=>e.type==='SEGMENT_BREAK'&&e.reason==='unavailable_observation_gap');
assert.ok(recovery,'un long trou de données sans preuve de continuité doit créer une frontière de segment au retour');
assert.strictEqual(recovery.segment,2,'la récupération doit ouvrir un nouveau segment plutôt que prolonger aveuglément les IDs');
assert.strictEqual(report.bridge.unavailableRecoverySegmentBreaks,1,'la rupture de récupération doit être mesurée explicitement');
assert.strictEqual(report.bridge.unavailableGapSegmentSeconds,2.5,'le seuil de prudence doit reprendre le seuil long-gap configuré');
assert.strictEqual(report.bridge.unavailableRecoveryPolicy,'SEGMENT_IF_LONG_BLIND_GAP_WITHOUT_VALIDATED_CONTINUITY');
assert.strictEqual(report.bridge.attemptedObservationFrames,5,'les frames aveugles restent dans le dénominateur de couverture');
assert.strictEqual(report.bridge.unavailableObservationFrames,3,'les trois frames terrain indisponible restent explicites');
assert.strictEqual(report.bridge.observationCoverage,.4,'la segmentation de récupération ne doit pas améliorer artificiellement la couverture');

const shortGap=Bridge.create({maxPlayers:11,lostAfter:8,longGapSeconds:2.5});
shortGap.processFrame([det()],0,ctx());
shortGap.processUnavailableFrame(.5,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
shortGap.processFrame([det()],1,ctx());
report=shortGap.report({});
assert.strictEqual(report.bridge.unavailableRecoverySegmentBreaks,0,'un trou bref ne doit pas fragmenter inutilement le tracking');
assert.ok(!report.bridge.timeline.some(e=>e.type==='SEGMENT_BREAK'&&e.reason==='unavailable_observation_gap'),'aucune frontière de récupération ne doit être créée sur un trou bref');

const validated=Bridge.create({maxPlayers:11,lostAfter:8,longGapSeconds:2.5});
validated.processFrame([det()],0,ctx());
validated.processUnavailableFrame(1,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
validated.processUnavailableFrame(2,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
validated.processUnavailableFrame(3,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
validated.processFrame([det()],4,ctx({continuityValidated:true}));
report=validated.report({});
assert.strictEqual(report.bridge.unavailableRecoverySegmentBreaks,0,'une continuité explicitement validée doit pouvoir préserver le segment');
assert.ok(!report.bridge.timeline.some(e=>e.type==='SEGMENT_BREAK'&&e.reason==='unavailable_observation_gap'),'le garde ne doit pas contredire une preuve explicite de continuité');

const cutDuringBlindGap=Bridge.create({maxPlayers:11,lostAfter:8,longGapSeconds:2.5});
cutDuringBlindGap.processFrame([det()],0,ctx());
cutDuringBlindGap.processUnavailableFrame(1,ctx({reason:'FIELD_POLYGON_UNAVAILABLE',segmentBreak:true,segmentReason:'camera_cut_without_field'}));
cutDuringBlindGap.processUnavailableFrame(2,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
cutDuringBlindGap.processUnavailableFrame(3,ctx({reason:'FIELD_POLYGON_UNAVAILABLE'}));
cutDuringBlindGap.processFrame([det()],4,ctx());
report=cutDuringBlindGap.report({});
assert.strictEqual(report.bridge.unavailableRecoverySegmentBreaks,0,'une coupure déjà détectée pendant la zone aveugle ne doit pas créer un second segment artificiel');
assert.strictEqual(report.bridge.timeline.filter(e=>e.type==='SEGMENT_BREAK').length,1,'une seule frontière doit subsister quand le cut est déjà prouvé');
assert.strictEqual(report.bridge.timeline.find(e=>e.type==='SEGMENT_BREAK').reason,'camera_cut_without_field');

const overflowBlindGap=Bridge.create({maxPlayers:11,lostAfter:8,longGapSeconds:2.5});
overflowBlindGap.processFrame([det()],0,ctx());
for(const t of [1,2,3])overflowBlindGap.processFrame(Array.from({length:12},(_,i)=>det(i)),t,ctx());
overflowBlindGap.processFrame([det()],4,ctx());
report=overflowBlindGap.report({});
assert.strictEqual(report.bridge.unavailableObservationFrames,3,'une série d’overflows reste une zone d’observation indisponible');
assert.strictEqual(report.bridge.unavailableRecoverySegmentBreaks,1,'les autres causes d’indisponibilité longue doivent aussi empêcher une continuité d’identité non prouvée');
assert.ok(report.bridge.timeline.some(e=>e.type==='SEGMENT_BREAK'&&e.reason==='unavailable_observation_gap'));

console.log('unavailable gap recovery non-regression: PASS (19 checks)');