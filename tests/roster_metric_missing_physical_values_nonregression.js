'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');
const PublicationGuard=require('../metric_publication_guard_v1.js');

const common={
  eligibleSeconds:4,
  metricCoveredSeconds:4,
  distanceM:4,
  avgCalibrationConfidence:.95,
  defendableScore:.95,
  quality:'FIABLE',
  speedSamples:[]
};

const entirelyMissing=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null},
  {...common,maxSpeedKmh:'   ',sprintCount:'\t ',sprintQualifiedSeconds:''}
]);
assert.strictEqual(entirelyMissing.maxSpeedKmh,null,'missing/blank max-speed evidence must never aggregate to 0 km/h');
assert.strictEqual(entirelyMissing.sprintCount,null,'missing/blank sprint-count evidence must never aggregate to 0 sprints');
assert.strictEqual(entirelyMissing.sprintQualifiedSeconds,null,'missing/blank sprint-duration evidence must never aggregate to 0 seconds');

const partialValid=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:null,sprintCount:' ',sprintQualifiedSeconds:null},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(partialValid.maxSpeedKmh,18.5,'valid max-speed evidence remains usable when another window has no value');
assert.strictEqual(partialValid.sprintCount,2,'only finite sprint counts may contribute to the aggregate');
assert.strictEqual(partialValid.sprintQualifiedSeconds,1.25,'only finite sprint duration may contribute to the aggregate');

const guardedMissing=PublicationGuard.applyPublicationPolicy(entirelyMissing,{identityQuality:'FIABLE'});
assert.strictEqual(guardedMissing.maxSpeedKmh,null);
assert.strictEqual(guardedMissing.sprintCount,null);
assert.strictEqual(guardedMissing.publication.fieldStatus.maxSpeedKmh.status,'INDISPONIBLE');
assert.strictEqual(guardedMissing.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');

console.log('roster metric missing physical values non-regression: PASS');
