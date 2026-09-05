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

const blocked=Guard.applyPublicationPolicy(metric,{identityQuality:'PARTIEL'});
assert.equal(blocked.publication.status,'INDISPONIBLE');
for(const key of ['distanceM','avgSpeedKmh','sprintCount','maxSpeedKmh'])assert.equal(blocked.publication.fieldStatus[key].status,'INDISPONIBLE');
assert.equal(blocked.distanceM,null);
assert.equal(blocked.maxSpeedKmh,null);

console.log('metric field-scoped publication non-regression: PASS');
