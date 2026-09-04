'use strict';
const assert=require('assert');
const Quality=require('../metric_quality_guard_v1.js');
const Publication=require('../metric_publication_guard_v1.js');

const projectors={1:{validated:true,confidence:1,source:'test',project:p=>({x:p.x,y:p.y})}};

// Exactly 3 seconds of valid metric movement must remain exactly 3 seconds of speed evidence.
// Previously speedSamples started at the first interval END (t=.5), so the publication guard
// only saw 2.5s and rejected an otherwise fully defendable 3s run.
const exactThreeSeconds={fullPath:Array.from({length:7},(_,i)=>({x:i*4,y:0,time:i*.5,segment:1}))};
const metric=Quality.robustMetricForTrack(exactThreeSeconds,projectors);
assert.equal(metric.metricCoveredSeconds,3);
assert.equal(metric.speedSamples.length,7,'one run anchor plus six interval ends must preserve the full temporal support');
assert.equal(metric.speedSamples[0].time,0);
assert.equal(metric.speedSamples[0].sampleRole,'RUN_INTERVAL_ANCHOR');
assert.equal(metric.speedSamples.at(-1).time,3);
assert.equal(Publication.longestContinuousSpeedEvidenceSeconds(metric.speedSamples),3,'publication evidence must include the first valid interval');
const published=Publication.applyPublicationPolicy(metric,{identityQuality:'FIABLE'});
assert.equal(published.publication.status,'FIABLE','exactly 3s of fully defendable evidence must satisfy the 3s publication gate');
assert.equal(published.continuousSpeedEvidenceSeconds,3);
assert.equal(published.distanceM,24);
assert.equal(published.sprintCount,1);

// Every metric run gets its own anchor; a tracking gap is never bridged.
const splitRun={fullPath:[
  {x:0,y:0,time:0,segment:1},{x:4,y:0,time:.5,segment:1},{x:8,y:0,time:1,segment:1},
  {x:40,y:0,time:3,segment:1},{x:44,y:0,time:3.5,segment:1},{x:48,y:0,time:4,segment:1}
]};
const splitMetric=Quality.robustMetricForTrack(splitRun,projectors);
const anchors=splitMetric.speedSamples.filter(s=>s.sampleRole==='RUN_INTERVAL_ANCHOR');
assert.equal(anchors.length,2,'each continuous run must expose its own start anchor');
assert.deepEqual(anchors.map(s=>s.time),[0,3]);
assert.equal(Publication.longestContinuousSpeedEvidenceSeconds(splitMetric.speedSamples),1,'the 2s tracking hole must still break evidence continuity');
assert.equal(splitMetric.distanceM,16,'gap must not invent cross-gap distance');

console.log('metric speed interval evidence non-regression: PASS');
