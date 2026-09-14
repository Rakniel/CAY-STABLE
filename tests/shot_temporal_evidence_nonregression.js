const assert=require('assert');
const {analyze}=require('../shot_temporal_evidence_v1.js');

function row(time,x,kickEvidenceScore=0.9,segment='A'){
  return {time,segment,kickEvidenceScore,ball:{pitchX:x,pitchY:20,confidence:.95,visible:true,valid:true}};
}

const positive=analyze([
  row(0.00,0),
  row(0.10,0.8),
  row(0.20,2.4),
  row(0.30,4.8)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(positive.candidateCount,1);
assert.strictEqual(positive.candidates[0].type,'SHOT_CANDIDATE');
assert.strictEqual(positive.candidates[0].publishable,false);
assert.strictEqual(positive.publicationPolicy,'NEVER_AUTO_PUBLISH');

const singleFrame=analyze([
  row(0.00,0),row(0.10,0.2),row(0.20,2.0),row(0.30,2.2)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(singleFrame.candidateCount,0,'one strong frame must never define a shot');

const weakKick=analyze([
  row(0.00,0,.2),row(0.10,.8,.2),row(0.20,2.4,.2),row(0.30,4.8,.2)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(weakKick.candidateCount,0,'ball motion alone must not define a shot');

const planBreak=analyze([
  row(0.00,0,.9,'A'),row(0.10,.8,.9,'A'),row(0.20,2.4,.9,'B'),row(0.30,4.8,.9,'B')
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(planBreak.candidateCount,0,'evidence must not cross plan/segment boundaries');

// La vitesse précédente appartient au même plan que l'accélération. Avant ce garde,
// la première vitesse calculable du plan B pouvait être comparée à la dernière vitesse
// du plan A. Avec une seule accélération réellement forte dans B, cette fuite ajoutait
// une seconde preuve artificielle et suffisait à créer un faux candidat tir.
const accelerationPlanLeak=analyze([
  row(0.00,0,.9,'A'),row(0.10,0,.9,'A'),
  row(0.20,5,.9,'B'),row(0.30,6,.9,'B'),row(0.40,8,.9,'B')
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2,maxObservationGapSec:.2});
assert.strictEqual(accelerationPlanLeak.candidateCount,0,'acceleration evidence must restart from zero at a plan boundary');

// Une coupure temporelle invalide aussi la mémoire cinématique. Avant ce garde,
// une preuve forte juste avant la coupure et une accélération calculée avec l'ancienne
// vitesse juste après pouvaient se combiner dans la même fenêtre et créer un faux tir.
const temporalGapLeak=analyze([
  row(0.00,0),row(0.10,.8),row(0.20,2.4),
  row(0.41,2.5),row(0.42,3.0)
],{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2,maxObservationGapSec:.2,evidenceWindowSec:.3});
assert.strictEqual(temporalGapLeak.candidateCount,0,'shot evidence and previous speed must reset after an observation gap');

// Une perte de visibilité/confiance du ballon coupe elle aussi la continuité de preuve.
// Sans remise à zéro, deux accélérations fortes séparées par une frame de ballon non
// fiable pouvaient être additionnées dans evidenceWindowSec et créer un faux tir.
const confidenceOcclusionLeak=[
  row(0.00,0),row(0.05,.2),row(0.10,1.0),
  row(0.15,1.1),
  row(0.20,1.2),row(0.25,1.4),row(0.30,2.2)
];
confidenceOcclusionLeak[3].ball.confidence=.3;
assert.strictEqual(analyze(confidenceOcclusionLeak,{
  minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2,
  maxObservationGapSec:.2,evidenceWindowSec:.3
}).candidateCount,0,'shot evidence must reset when ball observation becomes unreliable');

// Une cinématique métrique sans clé de plan/segment explicite n'est pas une preuve
// défendable en multi-plans. Avant ce garde, quatre frames sans segment partageaient
// implicitement la clé null et reproduisaient le candidat positif connu.
const missingContinuity=[row(0,0),row(.1,.8),row(.2,2.4),row(.3,4.8)].map(sample=>{
  const copy={...sample,ball:{...sample.ball}};
  delete copy.segment;
  return copy;
});
const missingContinuityResult=analyze(missingContinuity,{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2});
assert.strictEqual(missingContinuityResult.candidateCount,0,'shot evidence must fail closed without explicit plan/segment continuity metadata');
assert.strictEqual(missingContinuityResult.missingContinuityFrames,4);
assert.strictEqual(missingContinuityResult.quality,'INDISPONIBLE');
assert.strictEqual(missingContinuityResult.reason,'MISSING_CONTINUITY_METADATA');

const lowBallConfidence=[row(0,0),row(.1,.8),row(.2,2.4),row(.3,4.8)];
lowBallConfidence[2].ball.confidence=.3;
assert.strictEqual(analyze(lowBallConfidence,{minBallSpeedMps:7,minBallAccelerationMps2:5,minEvidenceFrames:2}).candidateCount,0);

// Les options proviennent potentiellement d'une UI, d'un profil importé ou d'un ancien
// artefact. Des seuils négatifs ne doivent jamais transformer une séquence faible en tir.
// Avant ce garde, les trois seuils négatifs ci-dessous rendaient deux frames faibles
// artificiellement "strong" et produisaient un SHOT_CANDIDATE.
const weakMotion=[
  row(0.00,0,.05),row(0.10,.1,.05),row(0.20,.2,.05),row(0.30,.3,.05)
];
const corruptThresholds=analyze(weakMotion,{
  minBallConfidence:-1,
  minKickEvidence:-1,
  minBallSpeedMps:-1,
  minBallAccelerationMps2:-1,
  minEvidenceFrames:2
});
assert.strictEqual(corruptThresholds.candidateCount,0,'negative/corrupt thresholds must fall back to safe defaults instead of lowering shot evidence requirements');

// Les durées négatives sont également invalides : elles reviennent aux valeurs sûres
// plutôt que de casser silencieusement la continuité d'une séquence autrement valide.
const corruptDurations=analyze([
  row(0.00,0),row(0.10,0.8),row(0.20,2.4),row(0.30,4.8)
],{
  minBallSpeedMps:7,
  minBallAccelerationMps2:5,
  minEvidenceFrames:2,
  evidenceWindowSec:-1,
  maxObservationGapSec:-1,
  cooldownSec:-1
});
assert.strictEqual(corruptDurations.candidateCount,1,'invalid negative timing options must normalize to safe defaults');
assert.strictEqual(corruptDurations.candidates[0].publishable,false);

console.log('shot_temporal_evidence_nonregression: ok');