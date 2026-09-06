'use strict';
const assert=require('assert');
const SkillCorner=require('../skillcorner_tracking_benchmark_v1.js');
const Quality=require('../metric_quality_guard_v1.js');

const frames=[
  {frame:0,period:1,player_data:[{player_id:7,x:0,y:0,is_detected:true}]},
  {frame:1,period:1,player_data:[{player_id:7,x:1,y:0,is_detected:true}]},
  {frame:2,period:1,player_data:[{player_id:7,x:2,y:0,is_detected:false}]},
  {frame:3,period:1,player_data:[{player_id:7,x:3,y:0,is_detected:true}]}
];

const detectedOnly=SkillCorner.buildPlayerTracks(frames);
assert.equal(detectedOnly.tracks.length,1);
assert.equal(detectedOnly.tracks[0].detectedObservations,3);
assert.equal(detectedOnly.tracks[0].extrapolatedObservations,1);
assert.equal(detectedOnly.tracks[0].detectedCoverage,.75);
assert.equal(detectedOnly.diagnostics.extrapolatedEvidenceGaps,1);
assert.equal(detectedOnly.tracks[0].fullPath[2].x,null,'an extrapolated SkillCorner point must be an evidence gap by default, not observed CAY proof');
assert.equal(detectedOnly.tracks[0].fullPath[2].referenceX,2,'reference coordinate remains auditable without being published as observed evidence');

const projectors=SkillCorner.metricProjectors(detectedOnly.tracks);
const metric=Quality.robustMetricForTrack(detectedOnly.tracks[0],projectors);
assert.equal(metric.distanceM,1,'detected-only benchmark must not bridge distance across an extrapolated frame');
assert.equal(metric.metricCoverage,.3333,'the extrapolated interval remains visible as missing metric evidence');
assert.equal(metric.metricCoveredSeconds,.1);
assert.equal(metric.eligibleSeconds,.3);

const withExtrapolation=SkillCorner.buildPlayerTracks(frames,{includeExtrapolated:true});
assert.equal(withExtrapolation.tracks[0].fullPath[2].x,2);
const fullMetric=Quality.robustMetricForTrack(withExtrapolation.tracks[0],SkillCorner.metricProjectors(withExtrapolation.tracks));
assert.equal(fullMetric.distanceM,3,'optional reference mode can use the provider extrapolation for benchmark comparison only');
assert.equal(fullMetric.metricCoverage,1);

console.log('SkillCorner tracking benchmark non-regression: PASS');
