const assert=require('assert');
const Pipeline=require('../roster_metric_duration_guarded_pipeline_v1.js');

const invalid=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:12,distanceM:20,avgCalibrationConfidence:1,speedSamples:[]}]);
assert.strictEqual(invalid.status,'INDISPONIBLE');
assert.strictEqual(invalid.reason,'INVALID_METRIC_WINDOW_DURATIONS');
assert.strictEqual(invalid.metricCoveredSeconds,0);
assert.strictEqual(invalid.eligibleSeconds,0);
assert.strictEqual(invalid.distanceM,null);
assert.strictEqual(invalid.avgSpeedKmh,null);
assert.strictEqual(invalid.durationAudit.invalidWindowCount,1);
assert.deepStrictEqual(invalid.durationAudit.invalidWindowIndexes,[0]);
assert(invalid.durationAudit.invalidReasons.includes('METRIC_COVERAGE_EXCEEDS_ELIGIBLE'));

const negativeEligible=Pipeline.aggregateMetrics([{eligibleSeconds:-1,metricCoveredSeconds:0}]);
assert.strictEqual(negativeEligible.status,'INDISPONIBLE');
assert(negativeEligible.durationAudit.invalidReasons.includes('ELIGIBLE_SECONDS_NEGATIVE'));

const negativeCovered=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:-1}]);
assert.strictEqual(negativeCovered.status,'INDISPONIBLE');
assert(negativeCovered.durationAudit.invalidReasons.includes('METRIC_COVERED_SECONDS_NEGATIVE'));

const nonFinite=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:Infinity}]);
assert.strictEqual(nonFinite.status,'INDISPONIBLE');
assert(nonFinite.durationAudit.invalidReasons.includes('METRIC_COVERED_SECONDS_NON_FINITE'));

const equality=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:10,distanceM:20,avgCalibrationConfidence:1,speedSamples:[]}]);
assert.strictEqual(equality.metricCoverage,1);
assert.strictEqual(equality.metricCoveredSeconds,10);
assert.strictEqual(equality.eligibleSeconds,10);
assert.strictEqual(equality.distanceM,20);

const uncovered=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:0,distanceM:null,avgCalibrationConfidence:0,speedSamples:[]}]);
assert.strictEqual(uncovered.metricCoverage,0);
assert.strictEqual(uncovered.metricCoveredSeconds,0);
assert.strictEqual(uncovered.eligibleSeconds,10);
assert.strictEqual(uncovered.distanceM,null);
assert.strictEqual(uncovered.avgSpeedKmh,null);

const valid=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:5,distanceM:10,avgCalibrationConfidence:0.8,speedSamples:[]}]);
assert.strictEqual(valid.metricCoverage,0.5);
assert.strictEqual(valid.metricCoveredSeconds,5);
assert.strictEqual(valid.eligibleSeconds,10);
assert.strictEqual(valid.distanceM,10);
assert.strictEqual(valid.avgSpeedKmh,7.2);

const multi=Pipeline.aggregateMetrics([
  {eligibleSeconds:10,metricCoveredSeconds:5,distanceM:10,avgCalibrationConfidence:0.8,speedSamples:[]},
  {eligibleSeconds:20,metricCoveredSeconds:10,distanceM:30,avgCalibrationConfidence:1,speedSamples:[]}
]);
assert.strictEqual(multi.metricCoverage,0.5);
assert.strictEqual(multi.metricCoveredSeconds,15);
assert.strictEqual(multi.eligibleSeconds,30);
assert.strictEqual(multi.distanceM,40);
assert.strictEqual(multi.avgSpeedKmh,9.6);
assert.strictEqual(multi.avgCalibrationConfidence,0.9333);

const mixedImpossible=Pipeline.aggregateMetrics([
  {eligibleSeconds:10,metricCoveredSeconds:5,distanceM:10,avgCalibrationConfidence:0.8,speedSamples:[]},
  {eligibleSeconds:10,metricCoveredSeconds:-2,distanceM:999,avgCalibrationConfidence:1,speedSamples:[]}
]);
assert.strictEqual(mixedImpossible.status,'INDISPONIBLE');
assert.strictEqual(mixedImpossible.metricCoveredSeconds,0);
assert.strictEqual(mixedImpossible.eligibleSeconds,0);
assert.strictEqual(mixedImpossible.distanceM,null);
assert.strictEqual(mixedImpossible.durationAudit.invalidWindowCount,1);
assert.deepStrictEqual(mixedImpossible.durationAudit.invalidWindowIndexes,[1]);

console.log('roster metric duration guarded pipeline non-regression: OK');
