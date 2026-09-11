const assert=require('assert');
const Audit=require('../roster_metric_audit_rollup_v1.js');

const windows=[
  {metric:{
    rejectedInvalidPathSamples:1,rejectedInvalidPathSeconds:2,rejectedInvalidPathIntervals:2,
    segmentBoundarySeconds:1,segmentBoundaryBreaks:1,rejectedGapSeconds:3,gapBreaks:1,
    rejectedUnvalidatedProjectorSamples:2,rejectedProjectionFailureSamples:1,rejectedProjectionSeconds:2,rejectedProjectionIntervals:2,
    rejectedOutsidePitchSamples:1,rejectedOutsidePitchSeconds:1,rejectedOutsidePitchIntervals:1,
    rejectedRawSpikePairs:2,rejectedSpeedPairs:1
  }},
  {metric:{
    rejectedInvalidPathSamples:2,rejectedInvalidPathSeconds:1.5,rejectedInvalidPathIntervals:1,
    segmentBoundarySeconds:2,segmentBoundaryBreaks:1,rejectedGapSeconds:0.5,gapBreaks:1,
    rejectedUnvalidatedProjectorSamples:1,rejectedProjectionFailureSamples:3,rejectedProjectionSeconds:4,rejectedProjectionIntervals:2,
    rejectedOutsidePitchSamples:2,rejectedOutsidePitchSeconds:2.5,rejectedOutsidePitchIntervals:2,
    rejectedRawSpikePairs:1,rejectedSpeedPairs:2
  }}
];

const audit=Audit.rollup(windows);
assert.equal(audit.windowCount,2);
assert.deepStrictEqual(audit.byCause.invalidPath,{samples:3,seconds:3.5,intervals:3});
assert.deepStrictEqual(audit.byCause.segmentBoundary,{seconds:3,intervals:2});
assert.deepStrictEqual(audit.byCause.temporalGap,{seconds:3.5,intervals:2});
assert.deepStrictEqual(audit.byCause.unvalidatedProjector,{samples:3});
assert.deepStrictEqual(audit.byCause.projectionFailure,{samples:4});
assert.deepStrictEqual(audit.byCause.projectionAffected,{seconds:6,intervals:4});
assert.deepStrictEqual(audit.byCause.outsidePitch,{samples:3,seconds:3.5,intervals:3});
assert.deepStrictEqual(audit.byCause.rawMetricSpike,{pairs:3});
assert.deepStrictEqual(audit.byCause.postSmoothingSpeedVeto,{pairs:3});
assert(!Object.prototype.hasOwnProperty.call(audit,'rejectedSecondsTotal'),'overlapping causal evidence must never be exposed as a fake additive total');

const baseMetric={distanceM:10,metricCoverage:.5,quality:'PARTIEL'};
const augmented=Audit.augmentMetric(baseMetric,windows);
assert.equal(augmented.distanceM,10,'audit rollup must not recalculate or change physical values');
assert.equal(augmented.metricCoverage,.5,'audit rollup must not change metric coverage');
assert.equal(augmented.rejectedProjectionSeconds,6);
assert.equal(augmented.rejectedOutsidePitchSeconds,3.5);
assert.equal(augmented.audit.byCause.invalidPath.samples,3);

const unavailable=Audit.augmentResult({status:'INDISPONIBLE',metric:null,windows});
assert.equal(unavailable.status,'INDISPONIBLE','audit must never promote availability');
assert.equal(unavailable.metric,null);
assert.equal(unavailable.metricAudit.byCause.projectionFailure.samples,4);

const empty=Audit.rollup([]);
assert.equal(empty.windowCount,0);
assert.deepStrictEqual(empty.byCause.invalidPath,{samples:0,seconds:0,intervals:0});

console.log('roster_metric_audit_rollup_nonregression: OK');
