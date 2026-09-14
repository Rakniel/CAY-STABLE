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
assert.strictEqual(entirelyMissing.sprintEvidenceComplete,false,'sprint evidence must be explicitly incomplete when covered windows have no sprint values');
assert.strictEqual(entirelyMissing.sprintEvidenceMissingWindowCount,2);

const partialValid=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:null,sprintCount:' ',sprintQualifiedSeconds:null},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(partialValid.maxSpeedKmh,18.5,'valid max-speed evidence remains usable when another window has no value');
assert.strictEqual(partialValid.sprintCount,null,'a sprint total must fail closed when any metric-covered window lacks sprint-count evidence');
assert.strictEqual(partialValid.sprintQualifiedSeconds,null,'a sprint duration total must fail closed when any metric-covered window lacks sprint-duration evidence');
assert.strictEqual(partialValid.sprintEvidenceComplete,false);
assert.strictEqual(partialValid.sprintEvidenceWindowCount,2);
assert.strictEqual(partialValid.sprintEvidenceMissingWindowCount,1);

const completeValid=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:17.5,sprintCount:1,sprintQualifiedSeconds:1.1},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:2.25}
]);
assert.strictEqual(completeValid.sprintCount,3,'complete per-window sprint evidence must still aggregate normally');
assert.strictEqual(completeValid.sprintQualifiedSeconds,3.35);
assert.strictEqual(completeValid.sprintEvidenceComplete,true);
assert.strictEqual(completeValid.sprintEvidenceMissingWindowCount,0);

const uncoveredMissing=Pipeline.aggregateMetrics([
  {...common,metricCoveredSeconds:0,distanceM:null,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(uncoveredMissing.sprintCount,2,'a window with zero metric coverage must not invalidate sprint evidence from covered windows');
assert.strictEqual(uncoveredMissing.sprintQualifiedSeconds,1.25);
assert.strictEqual(uncoveredMissing.sprintEvidenceComplete,true);
assert.strictEqual(uncoveredMissing.sprintEvidenceWindowCount,1);

const guardedMissing=PublicationGuard.applyPublicationPolicy(entirelyMissing,{identityQuality:'FIABLE'});
assert.strictEqual(guardedMissing.maxSpeedKmh,null);
assert.strictEqual(guardedMissing.sprintCount,null);
assert.strictEqual(guardedMissing.publication.fieldStatus.maxSpeedKmh.status,'INDISPONIBLE');
assert.strictEqual(guardedMissing.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');

const guardedPartial=PublicationGuard.applyPublicationPolicy(partialValid,{identityQuality:'FIABLE'});
assert.strictEqual(guardedPartial.sprintCount,null,'publication must keep an incomplete aggregate unavailable');
assert.strictEqual(guardedPartial.sprintQualifiedSeconds,null);
assert.strictEqual(guardedPartial.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');

console.log('roster metric missing physical values non-regression: PASS');
