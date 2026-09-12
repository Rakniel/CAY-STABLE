const assert=require('assert');
const Gate=require('../tracking_metric_trajectory_promotion_gate_v1.js');

const sequenceIds=['cay-wide-pan-01','cay-zoom-02','cay-crowded-03','cay-multiplan-04'];
const trackingBaseline={hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds};
const trackingCandidate={hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds:[...sequenceIds].reverse()};
const trajectoryBaseline={status:'DISPONIBLE',totalGroundTruthPoints:1000,comparablePoints:900,rmseM:1.2,p95ErrorM:2.8,metricCoverage:.90,outOfPitchFalsePoints:0,sequenceIds,trajectoryGroundTruthId:'teamtrack-soccer-fixed-side-v1'};
const near=(actual,expected,eps=1e-12)=>Math.abs(actual-expected)<=eps;

{
  const candidate={...trajectoryBaseline,comparablePoints:930,rmseM:1.0,p95ErrorM:2.4,metricCoverage:.93};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'PASS');
  assert.equal(r.pass,true);
  assert(near(r.delta.rmseM,-.2));
  assert(near(r.delta.metricCoverage,.03));
  assert.equal(r.trajectoryGroundTruthId,'teamtrack-soccer-fixed-side-v1');
}

{
  const candidate={...trajectoryBaseline,rmseM:1.21};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('METRIC_TRAJECTORY_RMSE_REGRESSION'));
}

{
  const candidate={...trajectoryBaseline,p95ErrorM:2.81};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('METRIC_TRAJECTORY_P95_REGRESSION'));
}

{
  const candidate={...trajectoryBaseline,metricCoverage:.89};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('METRIC_TRAJECTORY_COVERAGE_REGRESSION'));
}

{
  const candidate={...trajectoryBaseline,outOfPitchFalsePoints:1};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('METRIC_TRAJECTORY_OUT_OF_PITCH_REGRESSION'));
}

{
  const candidate={...trajectoryBaseline,trajectoryGroundTruthId:'different-gt'};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'TRAJECTORY_GROUND_TRUTH_MISMATCH');
}

{
  const candidate={...trajectoryBaseline,sequenceIds:['other-sequence']};
  const r=Gate.evaluateTrajectoryEvidence(trajectoryBaseline,candidate);
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'CAY_SEQUENCE_SET_MISMATCH');
}

{
  const small={...trajectoryBaseline,totalGroundTruthPoints:299,comparablePoints:299};
  const r=Gate.evaluateTrajectoryEvidence(small,{...small,rmseM:1.0,p95ErrorM:2.4});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'NOT_ENOUGH_METRIC_TRAJECTORY_POINTS');
}

{
  const candidate={...trajectoryBaseline,comparablePoints:930,rmseM:1.0,p95ErrorM:2.4,metricCoverage:.93};
  const r=Gate.evaluateCompletePromotion(trackingBaseline,trackingCandidate,trajectoryBaseline,candidate);
  assert.equal(r.status,'PROMOTE');
  assert.equal(r.promote,true);
  assert.equal(r.tracking.promote,true);
  assert.equal(r.trajectory.pass,true);
}

{
  const worseTrajectory={...trajectoryBaseline,rmseM:1.4,p95ErrorM:3.0};
  const r=Gate.evaluateCompletePromotion(trackingBaseline,trackingCandidate,trajectoryBaseline,worseTrajectory);
  assert.equal(r.status,'REJECT');
  assert.equal(r.promote,false);
  assert.equal(r.reason,'METRIC_TRAJECTORY_PROMOTION_GATE_BLOCKED');
  assert.equal(r.tracking.promote,true);
  assert.equal(r.trajectory.pass,false);
}

{
  const weakTracking={...trackingCandidate,hota:70.1};
  const r=Gate.evaluateCompletePromotion(trackingBaseline,weakTracking,trajectoryBaseline,trajectoryBaseline);
  assert.equal(r.status,'REJECT');
  assert.equal(r.promote,false);
  assert.equal(r.reason,'TRACKING_PROMOTION_GATE_BLOCKED');
  assert.equal(r.trajectory,null);
}

console.log('tracking_metric_trajectory_promotion_gate_nonregression: PASS');
