'use strict';
const assert=require('assert');
const Guard=require('../metric_publication_guard_v1.js');

const base={publishable:true,status:'FIABLE',reason:null,continuousSpeedSeconds:3,identityQuality:'FIABLE'};
const missingPeak=Guard.maxSpeedDecision({sustainedMaxSpeedKmh:null},base);
assert.equal(missingPeak.status,'INDISPONIBLE','max speed must stay fail-closed without sustained evidence');
assert.equal(missingPeak.publishable,false);

const validPeak=Guard.maxSpeedDecision({sustainedMaxSpeedKmh:27.4},base);
assert.equal(validPeak.status,'FIABLE');
assert.equal(validPeak.publishable,true);

const blockedBase=Guard.maxSpeedDecision({sustainedMaxSpeedKmh:27.4},{publishable:false,status:'INDISPONIBLE',reason:'identité joueur insuffisante'});
assert.equal(blockedBase.status,'INDISPONIBLE','field-specific max-speed proof must never bypass the common identity/evidence gate');
assert.match(blockedBase.reason,/identité/i);

const metric={
  metricCoverage:1,metricCoveredSeconds:3,defendableScore:.95,quality:'FIABLE',
  distanceM:21,avgSpeedKmh:25.2,maxSpeedKmh:30,sprintCount:1,sprintQualifiedSeconds:1.2,
  speedSamples:[
    {time:0,segment:1,kmh:24},{time:1,segment:1,kmh:26},
    {time:2,segment:1,kmh:27},{time:3,segment:1,kmh:25}
  ]
};
const published=Guard.applyPublicationPolicy(metric,{identityQuality:'FIABLE'});
assert.equal(published.publication.status,'FIABLE');
assert.equal(published.publication.fieldStatus.distanceM.status,'FIABLE');
assert.equal(published.publication.fieldStatus.avgSpeedKmh.status,'FIABLE');
assert.equal(published.publication.fieldStatus.sprintCount.status,'FIABLE');
assert.equal(published.publication.fieldStatus.maxSpeedKmh.status,'FIABLE');
assert.equal(published.publication.allPhysicalFieldsAvailable,true);
assert.equal(published.distanceM,21);
assert.ok(Number.isFinite(published.maxSpeedKmh));

const missingSprint=Guard.applyPublicationPolicy({...metric,sprintCount:null,sprintQualifiedSeconds:null},{identityQuality:'FIABLE'});
assert.equal(missingSprint.publication.status,'FIABLE','valid distance/speed evidence must survive missing sprint fields');
assert.equal(missingSprint.publication.fieldStatus.distanceM.status,'FIABLE');
assert.equal(missingSprint.publication.fieldStatus.avgSpeedKmh.status,'FIABLE');
assert.equal(missingSprint.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');
assert.equal(missingSprint.publication.fieldStatus.sprintQualifiedSeconds.status,'INDISPONIBLE');
assert.equal(missingSprint.publication.fieldStatus.maxSpeedKmh.status,'FIABLE');
assert.equal(missingSprint.distanceM,21);
assert.equal(missingSprint.avgSpeedKmh,25.2);
assert.equal(missingSprint.sprintCount,null);
assert.equal(missingSprint.sprintQualifiedSeconds,null);

const missingSpeedFamily=Guard.applyPublicationPolicy({...metric,avgSpeedKmh:null,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null,speedSamples:[]},{identityQuality:'FIABLE'});
assert.equal(missingSpeedFamily.publication.status,'FIABLE','distance is independently publishable when the speed family is absent');
assert.equal(missingSpeedFamily.publication.fieldStatus.distanceM.status,'FIABLE');
assert.equal(missingSpeedFamily.publication.fieldStatus.avgSpeedKmh.status,'INDISPONIBLE');
assert.equal(missingSpeedFamily.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');
assert.equal(missingSpeedFamily.publication.fieldStatus.maxSpeedKmh.status,'INDISPONIBLE');
assert.equal(missingSpeedFamily.distanceM,21);
assert.equal(missingSpeedFamily.avgSpeedKmh,null);
assert.equal(missingSpeedFamily.maxSpeedKmh,null);

const invalidDistanceOnly=Guard.applyPublicationPolicy({...metric,distanceM:NaN},{identityQuality:'FIABLE'});
assert.equal(invalidDistanceOnly.publication.status,'FIABLE','an invalid distance must not suppress independently defensible speed fields');
assert.equal(invalidDistanceOnly.publication.fieldStatus.distanceM.status,'INDISPONIBLE');
assert.equal(invalidDistanceOnly.publication.fieldStatus.avgSpeedKmh.status,'FIABLE');
assert.equal(invalidDistanceOnly.publication.fieldStatus.sprintCount.status,'FIABLE');
assert.equal(invalidDistanceOnly.publication.fieldStatus.maxSpeedKmh.status,'FIABLE');
assert.equal(invalidDistanceOnly.distanceM,null);
assert.equal(invalidDistanceOnly.avgSpeedKmh,25.2);
assert.ok(Number.isFinite(invalidDistanceOnly.maxSpeedKmh));
assert.ok(Number.isNaN(invalidDistanceOnly.diagnosticPhysicalMetrics.distanceM));

const blocked=Guard.applyPublicationPolicy(metric,{identityQuality:'PARTIEL'});
assert.equal(blocked.publication.status,'INDISPONIBLE');
for(const key of ['distanceM','avgSpeedKmh','sprintCount','maxSpeedKmh'])assert.equal(blocked.publication.fieldStatus[key].status,'INDISPONIBLE');
assert.equal(blocked.distanceM,null);
assert.equal(blocked.maxSpeedKmh,null);

console.log('metric field-scoped publication non-regression: PASS');
