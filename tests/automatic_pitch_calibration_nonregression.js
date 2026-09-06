const assert = require('assert');
const auto = require('../automatic_pitch_calibration_v1.js');
const Homography = require('../metric_homography_projector_v1.js');

const good = [
  { image:{x:0,y:0}, pitch:{x:0,y:0}, confidence:.99 },
  { image:{x:105,y:0}, pitch:{x:105,y:0}, confidence:.98 },
  { image:{x:105,y:68}, pitch:{x:105,y:68}, confidence:.99 },
  { image:{x:0,y:68}, pitch:{x:0,y:68}, confidence:.97 },
  { image:{x:60,y:20}, pitch:{x:60,y:20}, confidence:.96 },
  { image:{x:25,y:45}, pitch:{x:25,y:45}, confidence:.95 }
];

let r = auto.splitFitValidation(good);
assert.strictEqual(r.ok, true);
assert.strictEqual(r.fit.length, 4);
assert.strictEqual(r.validation.length, 2);
assert.strictEqual(r.selectionPolicy,'MAXIMIZE_FIT_SUPPORT_WITH_VALIDATION_SPREAD');
assert.ok(r.fitSupportRetention>0);

r = auto.geometricSupport(good,{width:105,height:68},{lengthM:105,widthM:68});
assert.strictEqual(r.ok,true);
assert.ok(r.imageAreaRatio>.5);
assert.ok(r.pitchAreaRatio>.5);

r = auto.evaluateAutomaticCalibration({correspondences:good,frameSize:{width:105,height:68}});
assert.strictEqual(r.status, 'ACCEPTED_AUTOMATIC');
assert.strictEqual(r.policy, 'AUTO_FIRST_MANUAL_ONLY_ON_FAILURE');
assert.strictEqual(r.validationCount, 2);
assert.strictEqual(r.bottomCornerCheck.checkedCorners, 'BOTTOM_ONLY');
assert.strictEqual(r.geometricSupport.ok,true);
assert.strictEqual(r.validationSelection.policy,'MAXIMIZE_FIT_SUPPORT_WITH_VALIDATION_SPREAD');
assert.ok(r.confidence > 0);

// Regression: the legacy farthest-pair holdout removes the two diagonal anchors
// and leaves four collinear fit points, even though the complete six-point set
// has enough geometric support for a valid identity homography.
const farthestTrap = [
  {image:{x:0,y:0},pitch:{x:0,y:0},confidence:.98},
  {image:{x:105,y:68},pitch:{x:105,y:68},confidence:.98},
  {image:{x:20,y:34},pitch:{x:20,y:34},confidence:.96},
  {image:{x:40,y:34},pitch:{x:40,y:34},confidence:.96},
  {image:{x:65,y:34},pitch:{x:65,y:34},confidence:.96},
  {image:{x:85,y:34},pitch:{x:85,y:34},confidence:.96}
];
const legacy = Homography.createProjector({
  correspondences:farthestTrap.slice(2),validationPoints:farthestTrap.slice(0,2),pitchLengthM:105,pitchWidthM:68
});
assert.strictEqual(legacy.validated,false,'legacy farthest-pair holdout should expose the degenerate-fit failure');

r = auto.splitFitValidation(farthestTrap);
assert.strictEqual(r.ok,true);
assert.notDeepStrictEqual(r.validationIndices,[0,1],'validation selection must not sacrifice both geometric anchors');
assert.ok(r.fitSupportRetention>=.99,'selected holdout should preserve essentially all fit support');

r = auto.evaluateAutomaticCalibration({correspondences:farthestTrap,frameSize:{width:105,height:68}});
assert.strictEqual(r.status,'ACCEPTED_AUTOMATIC','support-preserving holdout should recover a valid calibration from the same six points');
assert.ok(r.validationSelection.fitSupportRetention>=.99);

const clustered = [
  {image:{x:40,y:30},pitch:{x:40,y:30}},
  {image:{x:42,y:30},pitch:{x:42,y:30}},
  {image:{x:44,y:31},pitch:{x:44,y:31}},
  {image:{x:46,y:31},pitch:{x:46,y:31}},
  {image:{x:45,y:33},pitch:{x:45,y:33}},
  {image:{x:41,y:33},pitch:{x:41,y:33}}
];
r = auto.evaluateAutomaticCalibration({correspondences:clustered,frameSize:{width:105,height:68}});
assert.strictEqual(r.status,'REJECTED');
assert.strictEqual(r.reason,'AUTO_CALIBRATION_GEOMETRIC_SUPPORT_TOO_WEAK');
assert.ok(r.geometricSupport.imageSpanX<.12 || r.geometricSupport.imageSpanY<.12);

const insufficient = good.slice(0,5);
r = auto.evaluateAutomaticCalibration({correspondences:insufficient,frameSize:{width:105,height:68}});
assert.strictEqual(r.status, 'INSUFFICIENT_EVIDENCE');
assert.strictEqual(r.reason, 'AUTO_CALIBRATION_NEEDS_SIX_CORRESPONDENCES');

const badValidation = good.map(x=>JSON.parse(JSON.stringify(x)));
badValidation[2].pitch = {x:10,y:10};
r = auto.evaluateAutomaticCalibration({correspondences:badValidation,frameSize:{width:105,height:68},minPitchSupportAreaRatio:0,minPitchSupportSpanRatio:0});
assert.strictEqual(r.status, 'REJECTED');
assert.ok(/reprojection|erreur/i.test(r.reason));

const seen=[];
const fakeProjector={project:p=>{seen.push({...p});return {x:p.x,y:p.y};}};
r = auto.bottomCornerSanity(fakeProjector,{width:1920,height:1080},{lengthM:105,widthM:68},{bottomCornerMarginXM:2000,bottomCornerMarginYM:2000});
assert.strictEqual(r.ok,true);
assert.deepStrictEqual(seen,[{x:0,y:1080},{x:1920,y:1080}]);

r = auto.evaluateAutomaticCalibration({correspondences:good.map(c=>({...c,confidence:.2})),frameSize:{width:105,height:68},minSourceMeanConfidence:.5});
assert.strictEqual(r.status,'REJECTED');
assert.strictEqual(r.reason,'AUTO_CALIBRATION_SOURCE_CONFIDENCE_TOO_LOW');

r = auto.evaluateAutomaticCalibration({correspondences:good.map(c=>({image:c.image,pitch:c.pitch})),frameSize:{width:105,height:68},minSourceMeanConfidence:.5});
assert.strictEqual(r.status,'ACCEPTED_AUTOMATIC');
assert.strictEqual(r.sourceConfidence.available,false);
assert.strictEqual(r.sourceConfidence.mean,null);

console.log('automatic_pitch_calibration_nonregression: OK');
