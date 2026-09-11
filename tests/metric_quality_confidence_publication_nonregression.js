'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const track={fullPath:[
  {time:0,segment:1,metricX:10,metricY:20},
  {time:1,segment:1,metricX:11,metricY:20}
]};

const trusted={1:{validated:true,confidence:1,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};
const untrustedMissingConfidence={1:{validated:true,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};
const untrustedZeroConfidence={1:{validated:true,confidence:0,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};

const ok=Guard.robustMetricForTrack(track,trusted);
assert.equal(ok.quality,'FIABLE');
assert.equal(ok.distanceM,1);
assert.equal(ok.avgSpeedKmh,3.6);
assert.equal(ok.maxSpeedKmh,3.6);
assert.equal(ok.sprintCount,0);
assert.equal(ok.speedSamples.length,2);

for(const projectors of [untrustedMissingConfidence,untrustedZeroConfidence]){
  const metric=Guard.robustMetricForTrack(track,projectors);
  assert.equal(metric.metricCoverage,1,'geometric coverage remains auditable even when calibration confidence is absent');
  assert.equal(metric.metricCoveredSeconds,1);
  assert.equal(metric.avgCalibrationConfidence,0);
  assert.equal(metric.defendableScore,0);
  assert.equal(metric.quality,'INDISPONIBLE');
  assert.equal(metric.distanceM,null,'distance must not be numerically published without defendable calibration evidence');
  assert.equal(metric.avgSpeedKmh,null,'average speed must fail closed without defendable calibration evidence');
  assert.equal(metric.maxSpeedKmh,null,'maximum speed must fail closed without defendable calibration evidence');
  assert.equal(metric.sprintCount,null,'sprint count must fail closed without defendable calibration evidence');
  assert.equal(metric.sprintQualifiedSeconds,null);
  assert.deepEqual(metric.speedSamples,[],'per-interval speed samples must not leak non-defendable numeric values');
  assert.ok(metric.calibrationConfidencePolicy.includes('AUCUNE_STATISTIQUE_PHYSIQUE_NUMERIQUE_PUBLIEE'));
}

console.log('metric quality confidence publication non-regression: PASS');
