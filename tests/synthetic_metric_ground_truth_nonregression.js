const assert=require('assert');
const Projector=require('../metric_homography_projector_v1.js');
const PlayerStats=require('../player_stats_v1.js');

const PITCH_L=105;
const PITCH_W=68;
const SEGMENT_2_SHIFT=.012;

function makeProjector(imageShiftX=0){
  const correspondences=[
    {image:{x:0+imageShiftX,y:0},pitch:{x:0,y:0}},
    {image:{x:1+imageShiftX,y:0},pitch:{x:PITCH_L,y:0}},
    {image:{x:1+imageShiftX,y:1},pitch:{x:PITCH_L,y:PITCH_W}},
    {image:{x:0+imageShiftX,y:1},pitch:{x:0,y:PITCH_W}},
  ];
  const validationPoints=[
    {image:{x:.25+imageShiftX,y:.25},pitch:{x:PITCH_L*.25,y:PITCH_W*.25}},
    {image:{x:.50+imageShiftX,y:.50},pitch:{x:PITCH_L*.50,y:PITCH_W*.50}},
    {image:{x:.75+imageShiftX,y:.75},pitch:{x:PITCH_L*.75,y:PITCH_W*.75}},
  ];
  return Projector.createProjector({
    correspondences,
    validationPoints,
    pitchLengthM:PITCH_L,
    pitchWidthM:PITCH_W,
    maxMeanErrorM:.01,
    maxPeakErrorM:.02,
  });
}

const p1=makeProjector(0);
const p2=makeProjector(SEGMENT_2_SHIFT);
assert.strictEqual(p1.validated,true,'segment 1 homography must validate');
assert.strictEqual(p2.validated,true,'segment 2 shifted homography must validate');
assert(p1.validation.meanM<1e-8&&p2.validation.meanM<1e-8,'synthetic calibration should be effectively exact');

function imagePointForPitch(xM,yM,segment){
  const shift=segment===2?SEGMENT_2_SHIFT:0;
  return {x:xM/PITCH_L+shift,y:yM/PITCH_W};
}

const fullPath=[];
let time=0;
for(let segment=1;segment<=2;segment++){
  for(let i=0;i<10;i++){
    const pitchX=(segment===1?10:15)+i*.5;
    const pitchY=34;
    const q=imagePointForPitch(pitchX,pitchY,segment);
    fullPath.push({x:q.x,y:q.y,time:+time.toFixed(3),segment});
    time+=.2;
  }
}

const track={fullPath};
const metric=PlayerStats.metricForTrack(track,{1:p1,2:p2});

// 9 intervals per segment * 0.5 m = 9.0 m. The cut pair is intentionally excluded.
assert.strictEqual(metric.distanceM,9,'distance must match deterministic pitch-space ground truth');
assert.strictEqual(metric.metricCoveredSeconds,3.6,'only same-segment intervals are metric-eligible');
assert.strictEqual(metric.eligibleSeconds,3.6,'multi-plan cut must not add synthetic travel time');
assert.strictEqual(metric.metricCoverage,1,'all eligible intervals have validated metric projection');
assert.strictEqual(metric.avgSpeedKmh,9,'0.5 m every 0.2 s equals 9 km/h');
assert.strictEqual(metric.maxSpeedKmh,9,'constant synthetic speed must remain constant');
assert.strictEqual(metric.sprintCount,0,'9 km/h must never be counted as a sprint');
assert.strictEqual(metric.gapBreaks,0,'camera cut is a segment boundary, not a temporal gap');
assert.strictEqual(metric.quality,'FIABLE','perfect synthetic metric coverage must be reliable');

// Verify that each camera plan projects the same pitch point despite the image-space shift.
const gt={x:42,y:21};
const a=p1.project(imagePointForPitch(gt.x,gt.y,1));
const b=p2.project(imagePointForPitch(gt.x,gt.y,2));
assert(a&&b,'both projectors must return a pitch point');
assert(Math.hypot(a.x-gt.x,a.y-gt.y)<1e-8,'segment 1 projection error must be negligible');
assert(Math.hypot(b.x-gt.x,b.y-gt.y)<1e-8,'segment 2 projection error must be negligible');
assert(Math.hypot(a.x-b.x,a.y-b.y)<1e-8,'multi-plan calibration must preserve pitch-space continuity');

// If segment 2 calibration is unavailable, CAY must report partial evidence rather than inventing metric travel.
const partial=PlayerStats.metricForTrack(track,{1:p1});
assert.strictEqual(partial.distanceM,4.5,'only validated segment 1 distance may be published');
assert.strictEqual(partial.metricCoveredSeconds,1.8,'only validated segment 1 time may be published');
assert.strictEqual(partial.eligibleSeconds,3.6,'evaluable time remains explicit even when calibration is missing');
assert.strictEqual(partial.metricCoverage,.5,'missing segment 2 calibration must reduce metric coverage to 50%');
assert.strictEqual(partial.quality,'PARTIEL','partial metric evidence must not be labelled reliable');

console.log(`PASS synthetic metric ground truth: distance=${metric.distanceM}m avg=${metric.avgSpeedKmh}km/h coverage=${metric.metricCoverage} plans=2 partialCoverage=${partial.metricCoverage}`);
