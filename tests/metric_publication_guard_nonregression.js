'use strict';
const assert=require('assert');
const Guard=require('../metric_publication_guard_v1.js');

const continuousSpeedSamples=[
  {time:0,segment:1,kmh:16},{time:1,segment:1,kmh:18},{time:2,segment:1,kmh:19},{time:3,segment:1,kmh:20},{time:4,segment:1,kmh:17}
];
const reliable={
  metricCoverage:1,metricCoveredSeconds:12,defendableScore:.92,quality:'FIABLE',
  distanceM:123.4,avgSpeedKmh:18.2,maxSpeedKmh:31.1,sprintCount:2,sprintQualifiedSeconds:4.5,
  speedSamples:continuousSpeedSamples
};
const published=Guard.applyPublicationPolicy(reliable);
assert.equal(published.publication.status,'FIABLE');
assert.equal(published.distanceM,123.4);
assert.equal(published.sprintCount,2);
assert.equal(published.diagnosticPhysicalMetrics.distanceM,123.4);
assert.equal(published.continuousSpeedEvidenceSeconds,4);

const partialCoverage=Guard.applyPublicationPolicy({...reliable,metricCoverage:.55,defendableScore:.55,quality:'PARTIEL'});
assert.equal(partialCoverage.publication.status,'INDISPONIBLE');
assert.equal(partialCoverage.distanceM,null,'partial distance must not be published');
assert.equal(partialCoverage.avgSpeedKmh,null,'partial average speed must not be published');
assert.equal(partialCoverage.maxSpeedKmh,null,'partial max speed must not be published');
assert.equal(partialCoverage.sprintCount,null,'partial sprint count must not be published');
assert.equal(partialCoverage.diagnosticPhysicalMetrics.distanceM,123.4,'raw diagnostic evidence must remain auditable');

const tooShort=Guard.applyPublicationPolicy({...reliable,metricCoveredSeconds:2.9});
assert.equal(tooShort.publication.status,'INDISPONIBLE');
assert.match(tooShort.publication.reason,/3s/);
assert.equal(tooShort.distanceM,null);

const fragmented=Guard.applyPublicationPolicy({...reliable,speedSamples:[
  {time:0,segment:1,kmh:18},{time:.5,segment:1,kmh:18},
  {time:4,segment:1,kmh:19},{time:4.5,segment:1,kmh:19},
  {time:9,segment:2,kmh:20},{time:9.5,segment:2,kmh:20}
]});
assert.equal(fragmented.publication.status,'INDISPONIBLE','scattered evidence must not publish physical stats');
assert.match(fragmented.publication.reason,/continus/);
assert.equal(fragmented.continuousSpeedEvidenceSeconds,.5);
assert.equal(fragmented.distanceM,null);

const crossSegment=Guard.longestContinuousSpeedEvidenceSeconds([
  {time:0,segment:1,kmh:18},{time:1,segment:1,kmh:18},{time:2,segment:1,kmh:18},
  {time:2.2,segment:2,kmh:18},{time:3.2,segment:2,kmh:18}
]);
assert.equal(crossSegment,2,'camera/metric segment change must break continuous speed evidence');

const noCalibration=Guard.applyPublicationPolicy({
  metricCoverage:0,metricCoveredSeconds:0,defendableScore:0,quality:'INDISPONIBLE',
  distanceM:null,avgSpeedKmh:null,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null,speedSamples:[]
});
assert.equal(noCalibration.publication.status,'INDISPONIBLE');
assert.equal(noCalibration.distanceM,null);

assert.equal(Guard.MIN_PUBLISHABLE_EVIDENCE_SCORE,.8);
assert.equal(Guard.MIN_PUBLISHABLE_COVERED_SECONDS,3);
assert.equal(Guard.MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,3);
assert.equal(Guard.MAX_CONTINUOUS_SPEED_GAP_SECONDS,1);
console.log('metric publication guard non-regression: PASS');
