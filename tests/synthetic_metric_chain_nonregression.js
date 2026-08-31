'use strict';
const assert=require('assert');
const Homography=require('../metric_homography_projector_v1.js');
const Heatmap=require('../metric_pitch_heatmap_v1.js');
const Metrics=require('../metric_quality_guard_v1.js');

const pitch={lengthM:105,widthM:68};
const latentToPitch=p=>({x:p.x*pitch.lengthM,y:p.y*pitch.widthM});
const seg1Image=p=>({x:p.x,y:p.y});
const seg2Image=p=>({x:.10+.80*p.x,y:.05+.90*p.y});

function correspondence(imageFn,p){return {image:imageFn(p),pitch:latentToPitch(p)};}
function buildProjector(imageFn){
  const calibration=[
    {x:.08,y:.12},{x:.22,y:.18},{x:.44,y:.14},{x:.70,y:.20},{x:.16,y:.70},{x:.62,y:.76},{x:.82,y:.64}
  ].map(p=>correspondence(imageFn,p));
  // One deterministic bad click: robust consensus must reject it instead of
  // letting a single manual annotation poison the whole metric chain.
  calibration[3]={...calibration[3],pitch:{x:12,y:62}};
  const validation=[{x:.30,y:.40},{x:.76,y:.48}].map(p=>correspondence(imageFn,p));
  return Homography.createProjector({
    correspondences:calibration,
    validationPoints:validation,
    consensusThresholdM:1.5,
    minInlierRatio:.70,
    maxMeanErrorM:.25,
    maxPeakErrorM:.5,
    pitchLengthM:pitch.lengthM,
    pitchWidthM:pitch.widthM
  });
}

const p1=buildProjector(seg1Image),p2=buildProjector(seg2Image);
assert.equal(p1.validated,true,'segment 1 homography must validate');
assert.equal(p2.validated,true,'segment 2 homography must validate');
assert.equal(p1.fit.rejectedIndices.length,1,'segment 1 must reject the injected bad calibration click');
assert.equal(p2.fit.rejectedIndices.length,1,'segment 2 must reject the injected bad calibration click');
assert.ok(p1.validation.meanM<=.25&&p2.validation.meanM<=.25,'independent reprojection error must remain sub-25cm');

const latentPath=[
  {time:0,segment:1,x:.10,y:.30},{time:1,segment:1,x:.12,y:.30},{time:2,segment:1,x:.14,y:.30},
  {time:3,segment:2,x:.20,y:.42},{time:4,segment:2,x:.22,y:.42},{time:5,segment:2,x:.24,y:.42}
];
const fullPath=latentPath.map(p=>{
  const image=(p.segment===1?seg1Image:seg2Image)(p);
  return {...image,time:p.time,segment:p.segment};
});
const track={fullPath};
const projectors={1:p1,2:p2};

const heat=Heatmap.build(track,projectors,{pitchLengthM:105,pitchWidthM:68,cols:6,rows:4,minMetricCoverage:.95,minCalibrationConfidence:.5,maxDwellGapSec:1.1});
assert.equal(heat.status,'DISPONIBLE','metric heatmap must be publishable when every point is calibrated');
assert.equal(heat.metricCoverage,1,'heatmap metric coverage must stay explicit and complete');
assert.equal(heat.trajectory.runs.length,2,'camera cut must split the field trajectory into two runs');
assert.equal(heat.trajectory.points.length,6,'all calibrated observations must remain in the metric trajectory');

let maxTrajectoryError=0;
for(let i=0;i<latentPath.length;i++){
  const expected=latentToPitch(latentPath[i]);
  const actual=heat.trajectory.points[i];
  maxTrajectoryError=Math.max(maxTrajectoryError,Math.hypot(actual.x-expected.x,actual.y-expected.y));
}
assert.ok(maxTrajectoryError<=.25,`trajectory projection error too high: ${maxTrajectoryError} m`);

const metric=Metrics.robustMetricForTrack(track,projectors);
assert.equal(metric.metricCoverage,1,'distance/speed denominator must not bridge the explicit camera cut');
assert.ok(Math.abs(metric.distanceM-8.4)<=.05,`distance drift: ${metric.distanceM} m`);
assert.ok(Math.abs(metric.avgSpeedKmh-7.56)<=.05,`average speed drift: ${metric.avgSpeedKmh} km/h`);
assert.equal(metric.sprintCount,0,'walking/jogging fixture must not create a sprint');
assert.equal(metric.rejectedSpeedPairs,0,'clean metric fixture must not need speed rejection');

const unavailable=Heatmap.build(track,{1:p1,2:{validated:false,project:null,confidence:0}},{minMetricCoverage:.95,minCalibrationConfidence:.5,maxDwellGapSec:1.1});
assert.equal(unavailable.status,'INDISPONIBLE','missing second-plan calibration must fail closed instead of publishing an incomplete heatmap');
assert.ok(unavailable.metricCoverage<.95,'failed-plan coverage must be visible in the result');

console.log('synthetic_metric_chain_nonregression: PASS',JSON.stringify({
  segment1MeanErrorM:+p1.validation.meanM.toFixed(6),segment2MeanErrorM:+p2.validation.meanM.toFixed(6),
  maxTrajectoryErrorM:+maxTrajectoryError.toFixed(6),distanceM:metric.distanceM,avgSpeedKmh:metric.avgSpeedKmh,
  heatmapCoverage:heat.metricCoverage,failedPlanCoverage:unavailable.metricCoverage
}));
