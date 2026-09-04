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
const published=Guard.applyPublicationPolicy(reliable,{identityQuality:'FIABLE'});
assert.equal(published.publication.status,'FIABLE');
assert.equal(published.publication.identityQuality,'FIABLE');
assert.equal(published.publication.requiresReliableIdentity,true);
assert.equal(published.metricCoverage,1);
assert.equal(published.diagnosticMetricCoverage,1);
assert.equal(published.distanceM,123.4);
assert.equal(published.sprintCount,2);
assert.equal(published.instantaneousMaxSpeedKmh,31.1,'raw instantaneous peak must remain auditable');
assert.equal(published.sustainedMaxSpeedKmh,19.5,'published peak must come from sustained continuous speed evidence');
assert.equal(published.maxSpeedKmh,19.5,'UI-facing max speed must not reuse an unsupported one-sample peak');
assert.equal(published.diagnosticPhysicalMetrics.distanceM,123.4);
assert.equal(published.diagnosticPhysicalMetrics.instantaneousMaxSpeedKmh,31.1);
assert.equal(published.diagnosticPhysicalMetrics.sustainedMaxSpeedKmh,19.5);
assert.equal(published.continuousSpeedEvidenceSeconds,4);

const unsupportedPeak=Guard.applyPublicationPolicy({...reliable,maxSpeedKmh:44,speedSamples:[
  {time:0,segment:1,kmh:18},{time:.5,segment:1,kmh:19},{time:1,segment:1,kmh:18},
  {time:1.5,segment:1,kmh:19},{time:2,segment:1,kmh:18},{time:2.5,segment:1,kmh:19},{time:3,segment:1,kmh:18}
]},{identityQuality:'FIABLE'});
assert.equal(unsupportedPeak.publication.status,'FIABLE');
assert.equal(unsupportedPeak.instantaneousMaxSpeedKmh,44);
assert.equal(unsupportedPeak.maxSpeedKmh,18.5,'standalone peak must be replaced by the strongest supported continuous window');
assert.equal(unsupportedPeak.sustainedMaxSpeedKmh,18.5);

assert.equal(Guard.sustainedMaxSpeedKmh([
  {time:0,segment:1,kmh:18},{time:1,segment:1,kmh:42}
]),null,'one interval is insufficient evidence for a publishable max speed');
assert.equal(Guard.sustainedMaxSpeedKmh([
  {time:0,segment:1,kmh:18},{time:.5,segment:1,kmh:20},{time:1,segment:2,kmh:22},{time:1.5,segment:2,kmh:23}
]),null,'a segment cut must prevent a max-speed window from crossing camera plans');

const uncertainIdentity=Guard.applyPublicationPolicy(reliable,{identityQuality:'PARTIEL'});
assert.equal(uncertainIdentity.publication.status,'INDISPONIBLE','physical player stats must not be attributed to an uncertain identity');
assert.match(uncertainIdentity.publication.reason,/identité joueur/i);
assert.equal(uncertainIdentity.metricCoverage,0,'UI-facing coverage must close when player identity is uncertain');
assert.equal(uncertainIdentity.diagnosticMetricCoverage,1,'metric evidence stays auditable even when identity attribution is rejected');
assert.equal(uncertainIdentity.distanceM,null);
assert.equal(uncertainIdentity.avgSpeedKmh,null);
assert.equal(uncertainIdentity.maxSpeedKmh,null);
assert.equal(uncertainIdentity.sprintCount,null);
assert.equal(uncertainIdentity.diagnosticPhysicalMetrics.distanceM,123.4);

const partialCoverage=Guard.applyPublicationPolicy({...reliable,metricCoverage:.55,defendableScore:.55,quality:'PARTIEL'});
assert.equal(partialCoverage.publication.status,'INDISPONIBLE');
assert.equal(partialCoverage.metricCoverage,0,'UI-facing coverage must not make unavailable physical values look publishable');
assert.equal(partialCoverage.diagnosticMetricCoverage,.55,'evidence coverage must remain auditable separately');
assert.equal(partialCoverage.distanceM,null,'partial distance must not be published');
assert.equal(partialCoverage.avgSpeedKmh,null,'partial average speed must not be published');
assert.equal(partialCoverage.maxSpeedKmh,null,'partial max speed must not be published');
assert.equal(partialCoverage.sprintCount,null,'partial sprint count must not be published');
assert.equal(partialCoverage.diagnosticPhysicalMetrics.distanceM,123.4,'raw diagnostic evidence must remain auditable');

const tooShort=Guard.applyPublicationPolicy({...reliable,metricCoveredSeconds:2.9});
assert.equal(tooShort.publication.status,'INDISPONIBLE');
assert.match(tooShort.publication.reason,/3s/);
assert.equal(tooShort.metricCoverage,0);
assert.equal(tooShort.diagnosticMetricCoverage,1);
assert.equal(tooShort.distanceM,null);

const fragmented=Guard.applyPublicationPolicy({...reliable,speedSamples:[
  {time:0,segment:1,kmh:18},{time:.5,segment:1,kmh:18},
  {time:4,segment:1,kmh:19},{time:4.5,segment:1,kmh:19},
  {time:9,segment:2,kmh:20},{time:9.5,segment:2,kmh:20}
]});
assert.equal(fragmented.publication.status,'INDISPONIBLE','scattered evidence must not publish physical stats');
assert.match(fragmented.publication.reason,/continus/);
assert.equal(fragmented.continuousSpeedEvidenceSeconds,.5);
assert.equal(fragmented.metricCoverage,0);
assert.equal(fragmented.diagnosticMetricCoverage,1);
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
assert.equal(noCalibration.metricCoverage,0);
assert.equal(noCalibration.diagnosticMetricCoverage,0);
assert.equal(noCalibration.distanceM,null);

assert.equal(Guard.MIN_PUBLISHABLE_EVIDENCE_SCORE,.8);
assert.equal(Guard.MIN_PUBLISHABLE_COVERED_SECONDS,3);
assert.equal(Guard.MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,3);
assert.equal(Guard.MAX_CONTINUOUS_SPEED_GAP_SECONDS,1);
assert.equal(Guard.MIN_SUSTAINED_MAX_SPEED_SECONDS,1);
assert.equal(Guard.MIN_SUSTAINED_MAX_SPEED_INTERVALS,2);
console.log('metric publication guard non-regression: PASS');
