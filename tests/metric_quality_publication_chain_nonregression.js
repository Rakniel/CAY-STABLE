'use strict';
const assert=require('assert');
const Quality=require('../metric_quality_guard_v1.js');
const Publication=require('../metric_publication_guard_v1.js');

const projectors={1:{validated:true,confidence:1,source:'test',project:p=>({x:p.x,y:p.y})}};

// Real quality -> publication contract: no manually injected sprintQualifiedSeconds/defendableScore.
const continuous={fullPath:Array.from({length:9},(_,i)=>({x:i*4,y:0,time:i*.5,segment:1}))};
const metric=Quality.robustMetricForTrack(continuous,projectors);
assert.strictEqual(metric.maxMetricGapSec,1,'quality metric must expose the canonical 1s gap cutoff');
assert.strictEqual(metric.sprintCount,1,'sustained 28.8 km/h run must produce one sprint');
assert.strictEqual(metric.sprintQualifiedSeconds,4,'qualified sprint duration must come from the real quality metric');
assert.strictEqual(metric.defendableScore,1,'fully covered confidence=1 metric must be defendable');
const decision=Publication.publicationDecision(metric);
assert.strictEqual(decision.publishable,true,'real quality output must satisfy the publication guard without fixture-only fields');
assert.strictEqual(decision.status,'FIABLE');

// Missing calibration confidence may keep observable geometry internally, but must never publish physical truth.
const missingConfidenceMetric=Quality.robustMetricForTrack(continuous,{1:{validated:true,source:'legacy',project:p=>({x:p.x,y:p.y})}});
assert.strictEqual(missingConfidenceMetric.metricCoverage,1,'projection coverage remains observable');
assert.strictEqual(missingConfidenceMetric.avgCalibrationConfidence,0,'unknown calibration confidence contributes zero defendability');
assert.strictEqual(missingConfidenceMetric.quality,'INDISPONIBLE');
const missingConfidenceDecision=Publication.publicationDecision(missingConfidenceMetric);
assert.strictEqual(missingConfidenceDecision.publishable,false,'distance/speed/sprints must not publish without explicit calibration confidence');
assert.strictEqual(missingConfidenceDecision.status,'INDISPONIBLE');

// A tracking hole above the canonical cutoff must never be bridged into distance/speed/sprint evidence.
const withGap={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:4,y:0,time:.5,segment:1},
  {x:8,y:0,time:1,segment:1},
  {x:40,y:0,time:3,segment:1},
  {x:44,y:0,time:3.5,segment:1},
  {x:48,y:0,time:4,segment:1}
]};
const gapMetric=Quality.robustMetricForTrack(withGap,projectors);
assert.strictEqual(gapMetric.distanceM,16,'2s tracking hole must not add invented cross-gap metres');
assert.strictEqual(gapMetric.metricCoveredSeconds,2,'only valid <=1s pairs count as covered metric time');
assert.deepStrictEqual(gapMetric.speedSamples.filter(s=>s.sampleRole==='RUN_INTERVAL_ANCHOR').map(s=>s.time),[0,3],'each side of the tracking hole must start an independent speed-evidence run');
assert.strictEqual(Publication.longestContinuousSpeedEvidenceSeconds(gapMetric.speedSamples),1,'speed evidence must remain split at the tracking hole');

console.log('metric quality -> publication chain non-regression: PASS');
