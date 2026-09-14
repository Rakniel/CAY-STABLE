const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

// Max speed is publishable only when it comes from a participation window
// that also carries positive temporal metric coverage.
const mixed=Pipeline.aggregateMetrics([
  {
    eligibleSeconds:4,
    metricCoveredSeconds:4,
    distanceM:4,
    maxSpeedKmh:12,
    sprintCount:0,
    sprintQualifiedSeconds:0,
    avgCalibrationConfidence:.95,
    speedSamples:[]
  },
  {
    eligibleSeconds:4,
    metricCoveredSeconds:0,
    distanceM:0,
    maxSpeedKmh:99,
    sprintCount:null,
    sprintQualifiedSeconds:null,
    avgCalibrationConfidence:null,
    speedSamples:[]
  }
]);
assert.strictEqual(mixed.maxSpeedKmh,12,'max speed from a window without positive metric coverage must not contaminate the aggregate');
assert.ok(String(mixed.maxSpeedEvidencePolicy||'').includes('COUVERTURE_METRIQUE_POSITIVE'));

const noneCovered=Pipeline.aggregateMetrics([
  {eligibleSeconds:4,metricCoveredSeconds:0,maxSpeedKmh:99,avgCalibrationConfidence:.95,speedSamples:[]},
  {eligibleSeconds:4,metricCoveredSeconds:null,maxSpeedKmh:88,avgCalibrationConfidence:null,speedSamples:[]}
]);
assert.strictEqual(noneCovered.maxSpeedKmh,null,'diagnostic speed without metric coverage must remain unavailable');

const coveredMaximum=Pipeline.aggregateMetrics([
  {eligibleSeconds:4,metricCoveredSeconds:4,maxSpeedKmh:12,sprintCount:0,sprintQualifiedSeconds:0,avgCalibrationConfidence:.95,speedSamples:[]},
  {eligibleSeconds:4,metricCoveredSeconds:4,maxSpeedKmh:18.25,sprintCount:0,sprintQualifiedSeconds:0,avgCalibrationConfidence:.95,speedSamples:[]}
]);
assert.strictEqual(coveredMaximum.maxSpeedKmh,18.25,'maximum remains the maximum across defendable covered windows');

console.log('aggregate_max_speed_evidence_coupling_nonregression: ok');
