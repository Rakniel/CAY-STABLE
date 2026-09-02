const assert = require('assert');
const guard = require('../pitch_geometry_guard_v1.js');
const membership = require('../pitch_membership_guard_v1.js');

const rectangleWithSamples = [
  { x: 0, y: 0 }, { x: 25, y: 0 }, { x: 50, y: 0 }, { x: 75, y: 0 }, { x: 100, y: 0 },
  { x: 100, y: 30 }, { x: 100, y: 60 }, { x: 50, y: 60 }, { x: 0, y: 60 }, { x: 0, y: 30 }
];
let r = guard.canonicalizeBoundary(rectangleWithSamples);
assert.strictEqual(r.ok, true);
assert.strictEqual(r.boundary.length, 4);
assert.strictEqual(r.inputPoints, 10);
assert.strictEqual(r.removedSamples, 6);
assert.strictEqual(r.areaRetention, 1);

const trapezoidWithSamples = [
  { x: 15, y: 5 }, { x: 45, y: 4 }, { x: 80, y: 3 },
  { x: 100, y: 60 }, { x: 55, y: 62 }, { x: 5, y: 64 }
];
r = guard.canonicalizeBoundary(trapezoidWithSamples, { maxCornerDeviationRatio: 0.03 });
assert.strictEqual(r.ok, true);
assert.strictEqual(r.boundary.length, 4);

const bizarreBoundary = [
  { x: 0, y: 0 }, { x: 50, y: -20 }, { x: 100, y: 0 },
  { x: 115, y: 35 }, { x: 100, y: 70 }, { x: 0, y: 70 }
];
r = guard.canonicalizeBoundary(bizarreBoundary);
assert.strictEqual(r.ok, false);
assert.strictEqual(r.reason, 'PITCH_BOUNDARY_NOT_QUADRILATERAL');

const pitch = guard.canonicalPitchModel();
assert.strictEqual(pitch.ok, true);
assert.strictEqual(pitch.lengthM, 105);
assert.strictEqual(pitch.widthM, 68);
assert.strictEqual(pitch.fixedFeatures.penaltyAreaDepthM, 16.5);
assert.strictEqual(pitch.fixedFeatures.centerCircleRadiusM, 9.15);

const invalidPitch = guard.canonicalPitchModel({ lengthM: 50, widthM: 20 });
assert.strictEqual(invalidPitch.ok, false);

r = membership.evaluateDetection(
  { confidence: 0.9, box: { x: 45, y: 15, width: 10, height: 20 } },
  rectangleWithSamples
);
assert.strictEqual(r.status, 'ELIGIBLE');
assert.strictEqual(r.pitchGeometry.boundary.length, 4);
assert.strictEqual(r.pitchGeometry.inputPoints, 10);

r = membership.evaluateDetection(
  { confidence: 0.9, box: { x: 45, y: 15, width: 10, height: 20 } },
  bizarreBoundary
);
assert.strictEqual(r.status, 'INDISPONIBLE');
assert.strictEqual(r.reason, 'PITCH_BOUNDARY_NOT_QUADRILATERAL');

console.log('pitch_geometry_guard_nonregression: OK');
