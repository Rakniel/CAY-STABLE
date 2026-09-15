const assert=require('assert');
const Guard=require('../metric_window_duration_guard_v1.js');

const valid=Guard.inspectAll([
  {eligibleSeconds:4,metricCoveredSeconds:4},
  {eligibleSeconds:4,metricCoveredSeconds:0},
  {eligibleSeconds:10,metricCoveredSeconds:6.5}
]);
assert.strictEqual(valid.valid,true);
assert.strictEqual(valid.invalidWindowCount,0);

const negativeCovered=Guard.inspectAll([{eligibleSeconds:4,metricCoveredSeconds:-1}]);
assert.strictEqual(negativeCovered.valid,false);
assert.deepStrictEqual(negativeCovered.invalidReasons,['METRIC_COVERED_SECONDS_NEGATIVE']);

const coveredTooLarge=Guard.inspectAll([{eligibleSeconds:4,metricCoveredSeconds:5}]);
assert.strictEqual(coveredTooLarge.valid,false);
assert.deepStrictEqual(coveredTooLarge.invalidReasons,['METRIC_COVERAGE_EXCEEDS_ELIGIBLE']);

const negativeEligible=Guard.inspectAll([{eligibleSeconds:-1,metricCoveredSeconds:0}]);
assert.strictEqual(negativeEligible.valid,false);
assert.deepStrictEqual(negativeEligible.invalidReasons,['ELIGIBLE_SECONDS_NEGATIVE']);

const nonFinite=Guard.inspectAll([
  {eligibleSeconds:null,metricCoveredSeconds:0},
  {eligibleSeconds:4,metricCoveredSeconds:'   '}
]);
assert.strictEqual(nonFinite.valid,false);
assert.strictEqual(nonFinite.invalidWindowCount,2);
assert.deepStrictEqual(nonFinite.invalidWindowIndexes,[0,1]);
assert.ok(nonFinite.invalidReasons.includes('ELIGIBLE_SECONDS_NON_FINITE'));
assert.ok(nonFinite.invalidReasons.includes('METRIC_COVERED_SECONDS_NON_FINITE'));

const rawAudit=Guard.inspect({eligibleSeconds:4,metricCoveredSeconds:5});
assert.strictEqual(rawAudit.raw.metricCoveredSeconds,5,'impossible raw evidence must remain available for audit only');

console.log('metric_window_duration_guard_nonregression: ok');
