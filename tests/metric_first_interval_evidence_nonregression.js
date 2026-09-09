'use strict';
const assert=require('assert');
const Guard=require('../metric_publication_guard_v1.js');

const exactThreeSeconds={
  metricCoverage:1,
  metricCoveredSeconds:3,
  defendableScore:.95,
  quality:'FIABLE',
  distanceM:15,
  avgSpeedKmh:18,
  maxSpeedKmh:18,
  sprintCount:0,
  sprintQualifiedSeconds:0,
  speedSamples:[
    {time:1,segment:1,kmh:18},
    {time:2,segment:1,kmh:18},
    {time:3,segment:1,kmh:18}
  ]
};

assert.equal(
  Guard.longestContinuousSpeedEvidenceSeconds(exactThreeSeconds.speedSamples),
  2,
  'timestamp-only evidence cannot see the interval ending at the first speed sample'
);
assert.equal(
  Guard.continuousSpeedEvidenceSeconds(exactThreeSeconds),
  3,
  'metric coverage may recover exactly one missing leading interval when one continuous run is proven'
);

const published=Guard.applyPublicationPolicy(exactThreeSeconds,{identityQuality:'FIABLE'});
assert.equal(published.continuousSpeedEvidenceSeconds,3);
assert.equal(published.publication.fieldStatus.avgSpeedKmh.status,'FIABLE','exactly 3 seconds of defensible continuous speed evidence must publish average speed');
assert.equal(published.publication.fieldStatus.sprintCount.status,'FIABLE','sprint fields may reuse the now-complete continuous speed proof');
assert.equal(published.publication.fieldStatus.maxSpeedKmh.status,'FIABLE');
assert.equal(published.avgSpeedKmh,18);
assert.equal(published.maxSpeedKmh,18);

const fragmented={...exactThreeSeconds,metricCoveredSeconds:3,speedSamples:[
  {time:1,segment:1,kmh:18},
  {time:2,segment:1,kmh:18},
  {time:5,segment:1,kmh:18}
]};
assert.equal(Guard.continuousSpeedEvidenceSeconds(fragmented),1,'a temporal gap must forbid leading-interval recovery');
assert.equal(Guard.applyPublicationPolicy(fragmented,{identityQuality:'FIABLE'}).publication.fieldStatus.avgSpeedKmh.status,'INDISPONIBLE');

const crossPlan={...exactThreeSeconds,metricCoveredSeconds:3,speedSamples:[
  {time:1,segment:'plan:1',kmh:18},
  {time:2,segment:'plan:1',kmh:18},
  {time:3,segment:'plan:2',kmh:18}
]};
assert.equal(Guard.continuousSpeedEvidenceSeconds(crossPlan),1,'camera-plan boundaries must forbid leading-interval recovery across segments');
assert.equal(Guard.applyPublicationPolicy(crossPlan,{identityQuality:'FIABLE'}).publication.fieldStatus.avgSpeedKmh.status,'INDISPONIBLE');

console.log('metric first interval evidence non-regression: PASS');
