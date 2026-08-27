const assert = require('assert');
const guard = require('../pitch_membership_guard_v1.js');

const pitch = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 60 },
  { x: 0, y: 60 }
];

let r = guard.evaluateDetection({ confidence: 0.9, box: { x: 20, y: 10, width: 10, height: 20 } }, pitch);
assert.strictEqual(r.status, 'ELIGIBLE');
assert.strictEqual(r.anchor.x, 25);
assert.strictEqual(r.anchor.y, 30);

r = guard.evaluateDetection({ confidence: 0.9, box: { x: 20, y: 55, width: 10, height: 20 } }, pitch);
assert.strictEqual(r.status, 'REJETE');
assert.strictEqual(r.reason, 'GROUND_POINT_OUTSIDE_PITCH');

r = guard.evaluateDetection({ confidence: 0.2, box: { x: 20, y: 10, width: 10, height: 20 } }, pitch, { minConfidence: 0.35 });
assert.strictEqual(r.reason, 'LOW_CONFIDENCE');

r = guard.evaluateDetection({ confidence: 0.9, box: { x: 20, y: 10, width: 10, height: 20 } }, null);
assert.strictEqual(r.status, 'INDISPONIBLE');

r = guard.evaluateDetection({ confidence: 0.9, box: { x: -5, y: 40, width: 10, height: 20 } }, pitch);
assert.strictEqual(r.status, 'ELIGIBLE'); // feet are on the touchline even if torso box extends outside

const batch = guard.filterDetections([
  { confidence: 0.9, box: { x: 10, y: 10, width: 10, height: 10 } },
  { confidence: 0.9, box: { x: 110, y: 10, width: 10, height: 10 } }
], pitch);
assert.strictEqual(batch.accepted.length, 1);
assert.strictEqual(batch.rejected.length, 1);

console.log('pitch_membership_guard_nonregression: OK');
