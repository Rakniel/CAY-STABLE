const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

// A distance value is not defendable on its own: it must be backed by
// positive metricCoveredSeconds from the same participation window.
const mixed=Pipeline.aggregateMetrics([
  {
    eligibleSeconds:4,
    metricCoveredSeconds:4,
    distanceM:4,
    maxSpeedKmh:3.6,
    sprintCount:0,
    sprintQualifiedSeconds:0,
    avgCalibrationConfidence:.95,
    speedSamples:[]
  },
  {
    eligibleSeconds:4,
    metricCoveredSeconds:null,
    distanceM:100,
    maxSpeedKmh:null,
    sprintCount:null,
    sprintQualifiedSeconds:null,
    avgCalibrationConfidence:null,
    speedSamples:[]
  }
]);
assert.strictEqual(mixed.metricCoveredSeconds,4);
assert.strictEqual(mixed.distanceM,4,'distance from a window without temporal metric evidence must not contaminate the aggregate');
assert.strictEqual(mixed.avgSpeedKmh,3.6,'average speed must be computed only from distance backed by the same defendable seconds');
assert.strictEqual(mixed.distanceEvidenceComplete,true);

const zeroCovered=Pipeline.aggregateMetrics([
  {eligibleSeconds:4,metricCoveredSeconds:0,distanceM:100,avgCalibrationConfidence:.95,speedSamples:[]}
]);
assert.strictEqual(zeroCovered.metricCoveredSeconds,0);
assert.strictEqual(zeroCovered.distanceM,null,'zero metric coverage must never publish diagnostic distance as aggregate distance');
assert.strictEqual(zeroCovered.avgSpeedKmh,null);
assert.strictEqual(zeroCovered.distanceEvidenceComplete,false);

const blankCovered=Pipeline.aggregateMetrics([
  {eligibleSeconds:4,metricCoveredSeconds:'   ',distanceM:100,avgCalibrationConfidence:.95,speedSamples:[]},
  {eligibleSeconds:4,metricCoveredSeconds:4,distanceM:4,avgCalibrationConfidence:.95,speedSamples:[]}
]);
assert.strictEqual(blankCovered.metricCoveredSeconds,4);
assert.strictEqual(blankCovered.distanceM,4,'blank temporal evidence must fail closed instead of borrowing coverage from another window');
assert.strictEqual(blankCovered.distanceEvidenceComplete,true);

const missingCoveredDistance=Pipeline.aggregateMetrics([
  {eligibleSeconds:4,metricCoveredSeconds:4,distanceM:4,avgCalibrationConfidence:.95,speedSamples:[]},
  {eligibleSeconds:4,metricCoveredSeconds:4,distanceM:null,avgCalibrationConfidence:.95,speedSamples:[]}
]);
assert.strictEqual(missingCoveredDistance.metricCoveredSeconds,8);
assert.strictEqual(missingCoveredDistance.distanceM,null,'a covered window without distance evidence must make the aggregate distance unavailable instead of silently under-counting');
assert.strictEqual(missingCoveredDistance.avgSpeedKmh,null,'average speed must also fail closed when aggregate distance evidence is incomplete');
assert.strictEqual(missingCoveredDistance.distanceEvidenceComplete,false);
assert.strictEqual(missingCoveredDistance.distanceEvidenceWindowCount,2);
assert.strictEqual(missingCoveredDistance.distanceEvidenceMissingWindowCount,1);

const invalidCoveredDistance=Pipeline.aggregateMetrics([
  {eligibleSeconds:4,metricCoveredSeconds:4,distanceM:4,avgCalibrationConfidence:.95,speedSamples:[]},
  {eligibleSeconds:4,metricCoveredSeconds:4,distanceM:-3,avgCalibrationConfidence:.95,speedSamples:[]}
]);
assert.strictEqual(invalidCoveredDistance.distanceM,null,'negative distance evidence is physically invalid and must fail closed');
assert.strictEqual(invalidCoveredDistance.avgSpeedKmh,null);
assert.strictEqual(invalidCoveredDistance.distanceEvidenceComplete,false);
assert.strictEqual(invalidCoveredDistance.distanceEvidenceMissingWindowCount,1);

console.log('aggregate_distance_evidence_coupling_nonregression: ok');
