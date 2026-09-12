const assert=require('assert');
const IdentityEval=require('../tracking_identity_episode_eval_v1.js');
const Gate=require('../tracking_persistent_identity_promotion_gate_v1.js');
const box=(id,x)=>({id,bbox:{x1:x,y1:0,x2:x+10,y2:20}});

// A tracker-induced miss while ground truth stays continuously visible is NOT a
// ground-truth re-entry opportunity. This prevents a candidate from changing
// its own evaluation denominator.
{
  const rows=[
    {frame:0,truth:[box('P1',0)],predictions:[box('T1',0)]},
    {frame:1,truth:[box('P1',1)],predictions:[]},
    {frame:2,truth:[box('P1',2)],predictions:[box('T1',2)]}
  ];
  const r=IdentityEval.evaluateIdentityEpisodes(rows,{minLongGapFrames:1});
  assert.equal(r.reidAttempts,1);
  assert.equal(r.groundTruthReentryAttempts,0);
  assert.equal(r.groundTruthReentryQuality,'INDISPONIBLE');
}

// A true ground-truth absence and a segment transition are candidate-independent
// opportunities and must evaluate recovery even when the candidate fails to match.
{
  const rows=[
    {frame:0,segmentId:'A',truth:[box('P1',0)],predictions:[box('T1',0)]},
    {frame:1,segmentId:'A',truth:[],predictions:[]},
    {frame:2,segmentId:'A',truth:[],predictions:[]},
    {frame:3,segmentId:'B',truth:[box('P1',3)],predictions:[]}
  ];
  const r=IdentityEval.evaluateIdentityEpisodes(rows,{minLongGapFrames:2});
  assert.equal(r.groundTruthReentryQuality,'EVALUABLE');
  assert.equal(r.groundTruthReentryAttempts,1);
  assert.equal(r.groundTruthLongGapAttempts,1);
  assert.equal(r.groundTruthCrossSegmentAttempts,1);
  assert.equal(r.groundTruthReentryRecoveredSameId,0);
  assert.equal(r.groundTruthFailedReidentifications,1);
}

const identityBaseline={
  groundTruthReentryQuality:'EVALUABLE',
  groundTruthReentryAttempts:5,groundTruthReentryRecoveryRate:.8,
  groundTruthLongGapAttempts:3,groundTruthLongGapRecoveryRate:2/3,
  groundTruthCrossSegmentAttempts:2,groundTruthCrossSegmentRecoveryRate:1,
  groundTruthFailedReidentifications:1
};

{
  const candidate={...identityBaseline,groundTruthReentryRecoveryRate:1,groundTruthLongGapRecoveryRate:1,groundTruthFailedReidentifications:0};
  const r=Gate.evaluateIdentityEvidence(identityBaseline,candidate);
  assert.equal(r.status,'PASS');
  assert.equal(r.pass,true);
}

{
  const candidate={...identityBaseline,groundTruthReentryRecoveryRate:.6,groundTruthFailedReidentifications:2};
  const r=Gate.evaluateIdentityEvidence(identityBaseline,candidate);
  assert.equal(r.status,'REJECT');
  assert(r.blockers.includes('GROUND_TRUTH_REENTRY_RECOVERY_REGRESSION'));
  assert(r.blockers.includes('FAILED_REIDENTIFICATION_REGRESSION'));
}

{
  const candidate={...identityBaseline,groundTruthReentryAttempts:4};
  const r=Gate.evaluateIdentityEvidence(identityBaseline,candidate);
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'GROUND_TRUTH_REENTRY_OPPORTUNITY_MISMATCH');
}

{
  const tooSmall={...identityBaseline,groundTruthReentryAttempts:2};
  const r=Gate.evaluateIdentityEvidence(tooSmall,{...tooSmall});
  assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
  assert.equal(r.reason,'NOT_ENOUGH_GROUND_TRUTH_REENTRY_OPPORTUNITIES');
}

const sequenceIds=['cay-wide-pan-01','cay-zoom-02','cay-crowded-03','cay-multiplan-04'];
const trackingBaseline={hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds};
const trackingCandidate={hota:71,idf1:73,mota:69,idSwitches:8,falseCay:0,benchSpectatorFalseTracks:0,sequences:4,sequenceIds};
const trajectoryBaseline={status:'DISPONIBLE',totalGroundTruthPoints:1000,comparablePoints:900,rmseM:1.2,p95ErrorM:2.8,metricCoverage:.90,outOfPitchFalsePoints:0,sequenceIds,trajectoryGroundTruthId:'cay-fixed-gt-v1'};
const trajectoryCandidate={...trajectoryBaseline,comparablePoints:930,rmseM:1.0,p95ErrorM:2.4,metricCoverage:.93};

{
  const identityCandidate={...identityBaseline,groundTruthReentryRecoveryRate:1,groundTruthLongGapRecoveryRate:1,groundTruthFailedReidentifications:0};
  const r=Gate.evaluateCompletePromotion(trackingBaseline,trackingCandidate,trajectoryBaseline,trajectoryCandidate,identityBaseline,identityCandidate);
  assert.equal(r.status,'PROMOTE');
  assert.equal(r.promote,true);
  assert.equal(r.trackingAndTrajectory.promote,true);
  assert.equal(r.persistentIdentity.pass,true);
}

{
  const identityCandidate={...identityBaseline,groundTruthReentryRecoveryRate:.6,groundTruthFailedReidentifications:2};
  const r=Gate.evaluateCompletePromotion(trackingBaseline,trackingCandidate,trajectoryBaseline,trajectoryCandidate,identityBaseline,identityCandidate);
  assert.equal(r.status,'REJECT');
  assert.equal(r.promote,false);
  assert.equal(r.reason,'PERSISTENT_IDENTITY_PROMOTION_GATE_BLOCKED');
}

console.log('tracking_persistent_identity_promotion_gate_nonregression: PASS');
