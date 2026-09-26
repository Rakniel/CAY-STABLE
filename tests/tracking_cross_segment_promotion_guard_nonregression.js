const assert=require('assert');
const {evaluate}=require('../tracking_cross_segment_promotion_guard_v1.js');
const ids=['a','b','c'];
const inputs={detectorArtifactId:'det-a',frameSetId:'frames-a',timestampMode:'FIXED_RATE',referenceFrameRate:25};
const baseline={...inputs,hota:70,idf1:72,mota:68,idSwitches:10,falseCay:0,benchSpectatorFalseTracks:0,sequences:3,sequenceIds:ids,unsafeCrossSegmentSameId:2,crossSegmentUnsafeCarryoverRate:0.2};
const improved={...baseline,hota:71,idf1:73,mota:69,idSwitches:8,unsafeCrossSegmentSameId:1,crossSegmentUnsafeCarryoverRate:0.1};
{
 const r=evaluate(baseline,improved); assert.equal(r.status,'PROMOTE'); assert.equal(r.promote,true); assert.equal(r.crossSegmentGuard,'PASSED');
}
{
 const r=evaluate(baseline,{...improved,unsafeCrossSegmentSameId:3,crossSegmentUnsafeCarryoverRate:0.3}); assert.equal(r.status,'REJECT'); assert(r.blockers.includes('UNSAFE_CROSS_SEGMENT_IDENTITY_REGRESSION')); assert(r.blockers.includes('UNSAFE_CROSS_SEGMENT_RATE_REGRESSION'));
}
{
 const r=evaluate(baseline,{...improved,crossSegmentUnsafeCarryoverRate:undefined}); assert.equal(r.status,'INSUFFICIENT_EVIDENCE'); assert.equal(r.reason,'MISSING_CROSS_SEGMENT_IDENTITY_FIELDS');
}
{
 const r=evaluate(baseline,{...improved,falseCay:1}); assert.equal(r.status,'REJECT'); assert.equal(r.crossSegmentGuard,'NOT_REACHED'); assert(r.blockers.includes('FALSE_CAY_REGRESSION'));
}
console.log('tracking_cross_segment_promotion_guard_nonregression: PASS');
