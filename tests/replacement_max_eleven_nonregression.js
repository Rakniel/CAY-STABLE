'use strict';
const assert = require('assert');
const R = require('../replacement_events_v1.js');
const twelve = Array.from({length:12}, (_, i) => i + 1);
const eleven = twelve.slice(0, 11);
const empty = {events:[]};
for (const requested of [12, 20, 99, 1000, Infinity, NaN, -3, 0, null, undefined, 'invalid']) {
  const denied = R.auditRosterTimeline(empty, twelve, {maxActive:requested});
  assert.strictEqual(denied.reason, 'INVALID_INITIAL_LINEUP');
  assert.ok(denied.maxActive <= 11);
}
for (const requested of [12, 20, 99, 1000]) {
  const accepted = R.auditRosterTimeline(empty, eleven, {maxActive:requested});
  assert.strictEqual(accepted.quality, 'FIABLE');
  assert.strictEqual(accepted.maxActive, 11);
}
assert.strictEqual(R.auditRosterTimeline(empty, [1,2,3,4,5,6,7], {maxActive:7}).quality, 'FIABLE');
assert.strictEqual(R.auditRosterTimeline(empty, [1,2,3,4,5,6,7,8], {maxActive:7}).reason, 'INVALID_INITIAL_LINEUP');
console.log('PASS: hard maximum of 11 simultaneously active players');
