const assert=require('assert');
const Projector=require('../metric_homography_projector_v1.js');
const PlayerStats=require('../player_stats_v1.js');

// Deterministic physical oracle: identity image->pitch mapping in metres.
const projector=Projector.createProjector({
  correspondences:[
    {image:{x:0,y:0},pitch:{x:0,y:0}},
    {image:{x:1,y:0},pitch:{x:105,y:0}},
    {image:{x:1,y:1},pitch:{x:105,y:68}},
    {image:{x:0,y:1},pitch:{x:0,y:68}},
  ],
  validationPoints:[
    {image:{x:.2,y:.5},pitch:{x:21,y:34}},
    {image:{x:.5,y:.5},pitch:{x:52.5,y:34}},
    {image:{x:.8,y:.5},pitch:{x:84,y:34}},
  ],
  pitchLengthM:105,pitchWidthM:68,maxMeanErrorM:.01,maxPeakErrorM:.02,
});
assert.strictEqual(projector.validated,true);

const pt=(xM,t,segment=1)=>({x:xM/105,y:.5,time:t,segment});

// 10.8 km/h for 1 s, then 28.8 km/h for 1.2 s: exactly one sustained sprint.
const path=[
  pt(10,0),pt(11.5,.5),pt(13,1),
  pt(17,1.5),pt(21,2),pt(22.6,2.2),
];
const metric=PlayerStats.metricForTrack({fullPath:path},{1:projector});
assert.strictEqual(metric.metricCoverage,1,'all oracle intervals must be metric eligible');
assert.strictEqual(metric.quality,'FIABLE');
assert.strictEqual(metric.distanceM,12.6,'distance must equal pitch-space ground truth');
assert.strictEqual(metric.maxSpeedKmh,28.8,'peak speed must equal deterministic ground truth');
assert.strictEqual(metric.sprintCount,1,'1.2 continuous seconds >=25 km/h must count exactly one sprint');
assert.strictEqual(metric.sprintQualifiedSeconds,1.2,'qualified sprint duration must be preserved');

// Same physical sprint split by a camera-plan cut: continuity must reset and no sprint may be invented.
const cutPath=[
  pt(10,0,1),pt(14,.5,1),
  pt(18,1,2),pt(22,1.5,2),
];
const cutMetric=PlayerStats.metricForTrack({fullPath:cutPath},{1:projector,2:projector});
assert.strictEqual(cutMetric.sprintCount,0,'camera-plan cut must reset sprint continuity');
assert.strictEqual(cutMetric.distanceM,8,'cut interval itself must contribute zero synthetic distance');
assert.strictEqual(cutMetric.metricCoveredSeconds,1,'only same-plan intervals may contribute metric time');
assert.strictEqual(cutMetric.eligibleSeconds,1,'cut interval must not inflate eligible metric duration');

// A >1 s observation gap must also reset sprint continuity and be explicit in coverage/audit.
const gapPath=[pt(10,0),pt(14,.5),pt(22,2),pt(26,2.5)];
const gapMetric=PlayerStats.metricForTrack({fullPath:gapPath},{1:projector});
assert.strictEqual(gapMetric.sprintCount,0,'temporal gap must reset sprint continuity');
assert.strictEqual(gapMetric.gapBreaks,1,'temporal gap must be audited');
assert.strictEqual(gapMetric.rejectedGapSeconds,1.5,'rejected gap duration must stay explicit');
assert(gapMetric.metricCoverage<1,'rejected gap must reduce metric coverage');

console.log(`PASS synthetic physical sprint oracle: distance=${metric.distanceM}m vmax=${metric.maxSpeedKmh}km/h sprints=${metric.sprintCount} cutSprints=${cutMetric.sprintCount} gapBreaks=${gapMetric.gapBreaks}`);
