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
assert.strictEqual(entirelyMissing.maxSpeedEvidenceComplete,false,'max-speed evidence must be explicitly incomplete when covered windows have no max-speed values');
assert.strictEqual(entirelyMissing.maxSpeedEvidenceMissingWindowCount,2);
assert.strictEqual(entirelyMissing.sprintCount,null,'missing/blank sprint-count evidence must never aggregate to 0 sprints');
assert.strictEqual(entirelyMissing.sprintQualifiedSeconds,null,'missing/blank sprint-duration evidence must never aggregate to 0 seconds');
assert.strictEqual(entirelyMissing.sprintEvidenceComplete,false,'sprint evidence must be explicitly incomplete when covered windows have no sprint values');
assert.strictEqual(entirelyMissing.sprintEvidenceMissingWindowCount,2);

const partialValid=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:null,sprintCount:' ',sprintQualifiedSeconds:null},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(partialValid.maxSpeedKmh,null,'a match-level max speed must fail closed when any metric-covered window lacks max-speed evidence');
assert.strictEqual(partialValid.maxSpeedEvidenceComplete,false);
assert.strictEqual(partialValid.maxSpeedEvidenceWindowCount,2);
assert.strictEqual(partialValid.maxSpeedEvidenceMissingWindowCount,1);
assert.strictEqual(partialValid.sprintCount,null,'a sprint total must fail closed when any metric-covered window lacks sprint-count evidence');
assert.strictEqual(partialValid.sprintQualifiedSeconds,null,'a sprint duration total must fail closed when any metric-covered window lacks sprint-duration evidence');
assert.strictEqual(partialValid.sprintEvidenceComplete,false);
assert.strictEqual(partialValid.sprintEvidenceWindowCount,2);
assert.strictEqual(partialValid.sprintEvidenceMissingWindowCount,1);

const completeValid=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:17.5,sprintCount:1,sprintQualifiedSeconds:1.1},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:2.25}
]);
assert.strictEqual(completeValid.maxSpeedKmh,18.5,'complete per-window max-speed evidence must aggregate normally');
assert.strictEqual(completeValid.maxSpeedEvidenceComplete,true);
assert.strictEqual(completeValid.maxSpeedEvidenceMissingWindowCount,0);
assert.strictEqual(completeValid.sprintCount,3,'complete per-window sprint evidence must still aggregate normally');
assert.strictEqual(completeValid.sprintQualifiedSeconds,3.35);
assert.strictEqual(completeValid.sprintEvidenceComplete,true);
assert.strictEqual(completeValid.sprintEvidenceMissingWindowCount,0);

const uncoveredMissing=Pipeline.aggregateMetrics([
  {...common,metricCoveredSeconds:0,distanceM:null,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(uncoveredMissing.maxSpeedKmh,18.5,'a window with zero metric coverage must not invalidate max-speed evidence from covered windows');
assert.strictEqual(uncoveredMissing.maxSpeedEvidenceComplete,true);
assert.strictEqual(uncoveredMissing.maxSpeedEvidenceWindowCount,1);
assert.strictEqual(uncoveredMissing.sprintCount,2,'a window with zero metric coverage must not invalidate sprint evidence from covered windows');
assert.strictEqual(uncoveredMissing.sprintQualifiedSeconds,1.25);
assert.strictEqual(uncoveredMissing.sprintEvidenceComplete,true);
assert.strictEqual(uncoveredMissing.sprintEvidenceWindowCount,1);

const negativeMaxSpeed=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:-1,sprintCount:0,sprintQualifiedSeconds:0},
  {...common,maxSpeedKmh:18.5,sprintCount:0,sprintQualifiedSeconds:0}
]);
assert.strictEqual(negativeMaxSpeed.maxSpeedKmh,null,'negative max-speed evidence is physically invalid and must make the aggregate unavailable');
assert.strictEqual(negativeMaxSpeed.maxSpeedEvidenceComplete,false);
assert.strictEqual(negativeMaxSpeed.maxSpeedEvidenceMissingWindowCount,1);

const negativeSprintCount=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:17,sprintCount:-1,sprintQualifiedSeconds:0.8},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(negativeSprintCount.sprintCount,null,'negative sprint counts are physically invalid and must fail closed');
assert.strictEqual(negativeSprintCount.sprintQualifiedSeconds,null,'invalid sprint-count evidence must invalidate the paired aggregate duration');
assert.strictEqual(negativeSprintCount.sprintEvidenceComplete,false);
assert.strictEqual(negativeSprintCount.sprintEvidenceMissingWindowCount,1);

const negativeSprintDuration=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:17,sprintCount:1,sprintQualifiedSeconds:-0.1},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(negativeSprintDuration.sprintCount,null,'negative qualified sprint duration must invalidate the sprint aggregate');
assert.strictEqual(negativeSprintDuration.sprintQualifiedSeconds,null);
assert.strictEqual(negativeSprintDuration.sprintEvidenceComplete,false);
assert.strictEqual(negativeSprintDuration.sprintEvidenceMissingWindowCount,1);

const fractionalSprintCount=Pipeline.aggregateMetrics([
  {...common,maxSpeedKmh:17,sprintCount:1.5,sprintQualifiedSeconds:0.8},
  {...common,maxSpeedKmh:18.5,sprintCount:2,sprintQualifiedSeconds:1.25}
]);
assert.strictEqual(fractionalSprintCount.sprintCount,null,'sprint counts must be integer event counts');
assert.strictEqual(fractionalSprintCount.sprintQualifiedSeconds,null);
assert.strictEqual(fractionalSprintCount.sprintEvidenceComplete,false);
assert.strictEqual(fractionalSprintCount.sprintEvidenceMissingWindowCount,1);

const guardedMissing=PublicationGuard.applyPublicationPolicy(entirelyMissing,{identityQuality:'FIABLE'});
assert.strictEqual(guardedMissing.maxSpeedKmh,null);
assert.strictEqual(guardedMissing.sprintCount,null);
assert.strictEqual(guardedMissing.publication.fieldStatus.maxSpeedKmh.status,'INDISPONIBLE');
assert.strictEqual(guardedMissing.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');

const guardedPartial=PublicationGuard.applyPublicationPolicy(partialValid,{identityQuality:'FIABLE'});
assert.strictEqual(guardedPartial.maxSpeedKmh,null,'publication must keep an incomplete max-speed aggregate unavailable');
assert.strictEqual(guardedPartial.sprintCount,null,'publication must keep an incomplete aggregate unavailable');
assert.strictEqual(guardedPartial.sprintQualifiedSeconds,null);
assert.strictEqual(guardedPartial.publication.fieldStatus.maxSpeedKmh.status,'INDISPONIBLE');
assert.strictEqual(guardedPartial.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');

const guardedInvalidSprint=PublicationGuard.applyPublicationPolicy(negativeSprintCount,{identityQuality:'FIABLE'});
assert.strictEqual(guardedInvalidSprint.sprintCount,null,'publication must keep physically invalid sprint evidence unavailable');
assert.strictEqual(guardedInvalidSprint.sprintQualifiedSeconds,null);
assert.strictEqual(guardedInvalidSprint.publication.fieldStatus.sprintCount.status,'INDISPONIBLE');

console.log('roster metric missing physical values non-regression: PASS');
