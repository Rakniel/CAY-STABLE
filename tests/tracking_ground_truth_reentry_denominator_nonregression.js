const assert=require('assert');
const IdentityEval=require('../tracking_identity_episode_eval_v1.js');
const Gate=require('../tracking_persistent_identity_promotion_gate_v1.js');
const box=(id,x)=>({id,bbox:{x1:x,y1:0,x2:x+10,y2:20}});

// Same ground-truth disappearance/re-entry for both trackers. The weak candidate
// never establishes an ID before the gap, but must still receive exactly the same
// ground-truth re-entry opportunity denominator as the baseline.
const baselineFrames=[
  {frame:0,segmentId:'A',truth:[box('P1',0)],predictions:[box('T1',0)]},
  {frame:1,segmentId:'A',truth:[],predictions:[]},
  {frame:2,segmentId:'B',truth:[box('P1',2)],predictions:[box('T1',2)]}
];
const weakFrames=[
  {frame:0,segmentId:'A',truth:[box('P1',0)],predictions:[]},
  {frame:1,segmentId:'A',truth:[],predictions:[]},
  {frame:2,segmentId:'B',truth:[box('P1',2)],predictions:[box('T9',2)]}
];

const baseline=IdentityEval.evaluateIdentityEpisodes(baselineFrames,{minLongGapFrames:1});
const weak=IdentityEval.evaluateIdentityEpisodes(weakFrames,{minLongGapFrames:1});
assert.equal(baseline.version,'CAY_TRACKING_IDENTITY_EPISODE_EVAL_V1_2');
assert.equal(baseline.groundTruthReentryAttempts,1);
assert.equal(weak.groundTruthReentryAttempts,1);
assert.equal(baseline.groundTruthLongGapAttempts,1);
assert.equal(weak.groundTruthLongGapAttempts,1);
assert.equal(baseline.groundTruthCrossSegmentAttempts,1);
assert.equal(weak.groundTruthCrossSegmentAttempts,1);
assert.equal(baseline.groundTruthReentryRecoveryRate,1);
assert.equal(weak.groundTruthReentryRecoveryRate,0);
assert.equal(weak.groundTruthFailedReidentifications,1);
assert.equal(weak.groundTruthReentryEpisodes[0].fromPredictionId,null);
assert.equal(weak.groundTruthReentryEpisodes[0].recovered,false);

// With enough repeated opportunities the promotion gate must reject the weak
// candidate for quality, not hide the problem behind an opportunity mismatch.
const repeat=(prefix,predAtStart,predAtReturn)=>{
  const rows=[];
  for(let i=0;i<3;i++){
    const f=i*3;
    rows.push({frame:f,segmentId:`${prefix}${i}A`,truth:[box(`P${i}`,0)],predictions:predAtStart?[box(`T${i}`,0)]:[]});
    rows.push({frame:f+1,segmentId:`${prefix}${i}A`,truth:[],predictions:[]});
    rows.push({frame:f+2,segmentId:`${prefix}${i}B`,truth:[box(`P${i}`,2)],predictions:[box(predAtReturn?`T${i}`:`X${i}`,2)]});
  }
  return rows;
};
const strong=IdentityEval.evaluateIdentityEpisodes(repeat('S',true,true),{minLongGapFrames:1});
const weakRepeated=IdentityEval.evaluateIdentityEpisodes(repeat('S',false,false),{minLongGapFrames:1});
assert.equal(strong.groundTruthReentryAttempts,3);
assert.equal(weakRepeated.groundTruthReentryAttempts,3);
const verdict=Gate.evaluateIdentityEvidence(strong,weakRepeated);
assert.equal(verdict.status,'REJECT');
assert(verdict.blockers.includes('GROUND_TRUTH_REENTRY_RECOVERY_REGRESSION'));
assert(verdict.blockers.includes('FAILED_REIDENTIFICATION_REGRESSION'));

console.log('tracking_ground_truth_reentry_denominator_nonregression: PASS');
