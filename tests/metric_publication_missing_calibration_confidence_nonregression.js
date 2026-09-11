'use strict';
const assert=require('assert');
const Quality=require('../metric_quality_guard_v1.js');
const Publication=require('../metric_publication_guard_v1.js');

const track={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:1,segment:1},
  {x:10,y:0,time:2,segment:1},
  {x:15,y:0,time:3,segment:1}
]};
const projector={1:{validated:true,source:'TEST_NO_CONFIDENCE',project:p=>({x:p.x,y:p.y})}};

const diagnostic=Quality.robustMetricForTrack(track,projector);
assert.equal(diagnostic.metricCoverage,1,'geometry coverage must remain auditable internally');
assert.equal(diagnostic.metricCoveredSeconds,3);
assert.equal(diagnostic.distanceM,15,'diagnostic geometry must remain available internally');
assert.equal(diagnostic.avgCalibrationConfidence,0,'missing explicit calibration confidence contributes zero defendability');
assert.equal(diagnostic.defendableScore,0);
assert.equal(diagnostic.quality,'INDISPONIBLE');
assert.ok(diagnostic.speedSamples.length>0,'raw speed evidence remains available for diagnostics before publication');

const published=Publication.applyPublicationPolicy(diagnostic,{identityQuality:'FIABLE'});
assert.equal(published.publication.status,'INDISPONIBLE');
assert.match(published.publication.reason,/confiance de calibration absente ou nulle/i,'publication must expose the actual missing proof');
assert.equal(published.distanceM,null,'distance must fail closed at the publication boundary');
assert.equal(published.avgSpeedKmh,null,'average speed must fail closed at the publication boundary');
assert.equal(published.maxSpeedKmh,null,'max speed must fail closed at the publication boundary');
assert.equal(published.sprintCount,null,'sprints must fail closed at the publication boundary');
assert.equal(published.metricCoverage,0,'UI-facing metric coverage must close when no physical field is defensible');
assert.equal(published.diagnosticMetricCoverage,1,'raw coverage remains separately auditable');
assert.equal(published.diagnosticPhysicalMetrics.distanceM,15,'raw distance remains separately auditable');
assert.deepEqual(published.speedSamples,[],'non-defendable per-interval speed values must not leak onto the public surface');
assert.ok(published.diagnosticSpeedSamples.length>0,'speed evidence must remain available only in explicit diagnostics');

console.log('metric publication missing calibration confidence non-regression: PASS');
