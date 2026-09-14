'use strict';
const assert=require('assert');
const Guard=require('../metric_publication_guard_v1.js');

const speedSamples=[
  {time:0,segment:1,kmh:16},{time:1,segment:1,kmh:18},{time:2,segment:1,kmh:19},{time:3,segment:1,kmh:20},{time:4,segment:1,kmh:17}
];
const reliable={
  metricCoverage:1,
  metricCoveredSeconds:12,
  avgCalibrationConfidence:.9,
  defendableScore:.92,
  quality:'FIABLE',
  distanceM:123.4,
  avgSpeedKmh:18.2,
  maxSpeedKmh:31.1,
  sprintCount:2,
  sprintQualifiedSeconds:4.5,
  speedSamples
};

const valid=Guard.applyPublicationPolicy(reliable,{identityQuality:'FIABLE'});
assert.equal(valid.publication.status,'FIABLE','unit-bound evidence at or below 1 must remain publishable');
assert.equal(valid.distanceM,123.4);

const impossibleCoverage=Guard.applyPublicationPolicy({...reliable,metricCoverage:1.25},{identityQuality:'FIABLE'});
assert.equal(impossibleCoverage.publication.status,'INDISPONIBLE','coverage above 100% must fail closed');
assert.match(impossibleCoverage.publication.reason,/couverture métrique invalide/i);
assert.equal(impossibleCoverage.metricCoverage,0,'impossible coverage must never be exposed as public coverage');
assert.equal(impossibleCoverage.diagnosticMetricCoverage,1.25,'raw impossible coverage must remain auditable');
assert.equal(impossibleCoverage.distanceM,null);
assert.equal(impossibleCoverage.avgSpeedKmh,null);
assert.equal(impossibleCoverage.maxSpeedKmh,null);
assert.equal(impossibleCoverage.sprintCount,null);

const impossibleCalibrationConfidence=Guard.applyPublicationPolicy({...reliable,avgCalibrationConfidence:1.1},{identityQuality:'FIABLE'});
assert.equal(impossibleCalibrationConfidence.publication.status,'INDISPONIBLE','calibration confidence above 1 must fail closed');
assert.match(impossibleCalibrationConfidence.publication.reason,/confiance de calibration invalide/i);
assert.equal(impossibleCalibrationConfidence.distanceM,null);

const impossibleDefendableScore=Guard.applyPublicationPolicy({...reliable,defendableScore:1.05},{identityQuality:'FIABLE'});
assert.equal(impossibleDefendableScore.publication.status,'INDISPONIBLE','defendable score above 1 must fail closed');
assert.match(impossibleDefendableScore.publication.reason,/score de preuve métrique invalide/i);
assert.equal(impossibleDefendableScore.distanceM,null);

const exactUpperBound=Guard.applyPublicationPolicy({...reliable,metricCoverage:1,avgCalibrationConfidence:1,defendableScore:1},{identityQuality:'FIABLE'});
assert.equal(exactUpperBound.publication.status,'FIABLE','exact upper bound 1 must remain valid');
assert.equal(exactUpperBound.distanceM,123.4);

console.log('metric publication unit interval non-regression: PASS');
