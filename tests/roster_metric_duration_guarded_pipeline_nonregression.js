const assert=require('assert');
const Pipeline=require('../roster_metric_duration_guarded_pipeline_v1.js');

const invalid=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:12,distanceM:20,avgCalibrationConfidence:1,speedSamples:[]}]);
assert.strictEqual(invalid.status,'INDISPONIBLE');
assert.strictEqual(invalid.reason,'INVALID_METRIC_WINDOW_DURATIONS');
assert.strictEqual(invalid.metricCoveredSeconds,0);
assert.strictEqual(invalid.eligibleSeconds,0);
assert.strictEqual(invalid.distanceM,null);
assert.strictEqual(invalid.avgSpeedKmh,null);
assert.deepStrictEqual(invalid.durationAudit.invalidWindowIndexes,[0]);
assert(invalid.durationAudit.invalidReasons.includes('METRIC_COVERAGE_EXCEEDS_ELIGIBLE'));

const negative=Pipeline.aggregateMetrics([{eligibleSeconds:-1,metricCoveredSeconds:0}]);
assert.strictEqual(negative.status,'INDISPONIBLE');
assert(negative.durationAudit.invalidReasons.includes('ELIGIBLE_SECONDS_NEGATIVE'));

const valid=Pipeline.aggregateMetrics([{eligibleSeconds:10,metricCoveredSeconds:5,distanceM:10,avgCalibrationConfidence:0.8,speedSamples:[]}]);
assert.strictEqual(valid.metricCoverage,0.5);
assert.strictEqual(valid.metricCoveredSeconds,5);
assert.strictEqual(valid.eligibleSeconds,10);
assert.strictEqual(valid.distanceM,10);
assert.strictEqual(valid.avgSpeedKmh,7.2);
console.log('roster metric duration guarded pipeline non-regression: OK');
