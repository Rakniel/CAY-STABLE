'use strict';
const assert=require('assert');
const Quality=require('../metric_quality_guard_v1.js');

const projectors={1:{validated:true,confidence:.95,source:'TEST',project:p=>({x:p.metricX,y:p.metricY})}};

// The robust quality layer runs after player_stats and must not re-introduce
// low-speed out-of-pitch coordinates already rejected by the shared pitch guard.
const track={fullPath:[
  {time:0,segment:1,metricX:104.5,metricY:20},
  {time:1,segment:1,metricX:105.5,metricY:20},
  {time:2,segment:1,metricX:104.8,metricY:20}
]};
const legacyFalseDistance=1.7;
const metric=Quality.robustMetricForTrack(track,projectors);
assert.equal(legacyFalseDistance,1.7,'fixture documents the distance the unguarded robust chain could fabricate');
assert.equal(metric.eligibleSeconds,2,'source chronology must remain in the denominator');
assert.equal(metric.rejectedOutsidePitchSamples,1,'the bad projection must be explicitly audited');
assert.equal(metric.metricCoveredSeconds,0,'no physical interval may cross the invalid projection');
assert.equal(metric.metricCoverage,0);
assert.equal(metric.distanceM,null,'distance must be unavailable, not 1.7 m');
assert.equal(metric.maxSpeedKmh,null,'speed must be unavailable');
assert.equal(metric.sprintCount,null,'sprints must be unavailable');
assert.ok(metric.pitchBoundsPolicy.includes('INSIDE_PITCH'));

// Boundary points remain valid; the guard must not shrink the official field.
const boundary={fullPath:[
  {time:0,segment:1,metricX:104,metricY:68},
  {time:1,segment:1,metricX:105,metricY:68}
]};
const valid=Quality.robustMetricForTrack(boundary,projectors);
assert.equal(valid.rejectedOutsidePitchSamples,0);
assert.equal(valid.metricCoveredSeconds,1);
assert.equal(valid.distanceM,1);

console.log('metric quality pitch bounds non-regression: PASS');
