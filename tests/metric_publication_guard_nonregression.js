'use strict';
const assert=require('assert');
const Guard=require('../metric_publication_guard_v1.js');

const reliable={
  metricCoverage:1,metricCoveredSeconds:12,defendableScore:.92,quality:'FIABLE',
  distanceM:123.4,avgSpeedKmh:18.2,maxSpeedKmh:31.1,sprintCount:2,sprintQualifiedSeconds:4.5
};
const published=Guard.applyPublicationPolicy(reliable);
assert.equal(published.publication.status,'FIABLE');
assert.equal(published.distanceM,123.4);
assert.equal(published.sprintCount,2);
assert.equal(published.diagnosticPhysicalMetrics.distanceM,123.4);

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

const noCalibration=Guard.applyPublicationPolicy({
  metricCoverage:0,metricCoveredSeconds:0,defendableScore:0,quality:'INDISPONIBLE',
  distanceM:null,avgSpeedKmh:null,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null
});
assert.equal(noCalibration.publication.status,'INDISPONIBLE');
assert.equal(noCalibration.distanceM,null);

assert.equal(Guard.MIN_PUBLISHABLE_EVIDENCE_SCORE,.8);
assert.equal(Guard.MIN_PUBLISHABLE_COVERED_SECONDS,3);
console.log('metric publication guard non-regression: PASS');
