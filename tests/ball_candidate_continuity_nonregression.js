const assert=require('assert');
const {create}=require('../ball_candidate_continuity_v1.js');
const ball=(x,y,c=.9,extra={})=>({pitchX:x,pitchY:y,confidence:c,...extra});
const s=create({bufferSize:4,maxPitchJumpM:10,minConfidence:.4,maxGapSec:.5});

let r=s.select([ball(10,10,.8),ball(50,30,.95)],0,{segmentId:'A'});
assert.strictEqual(r.status,'SELECTED');
assert.strictEqual(r.index,1,'without history highest confidence may initialize');

r=s.select([ball(51,30,.7),ball(12,10,.99)],.1,{segmentId:'A'});
assert.strictEqual(r.status,'SELECTED');
assert.strictEqual(r.index,0,'recent trajectory continuity beats a distant high-confidence false candidate');

r=s.select([ball(90,60,.99)],.2,{segmentId:'A'});
assert.strictEqual(r.status,'UNAVAILABLE');
assert.strictEqual(r.reason,'ALL_CANDIDATES_BREAK_CONTINUITY');

r=s.select([ball(20,20,.95)],1.0,{segmentId:'A'});
assert.strictEqual(r.status,'SELECTED','large time gap resets continuity instead of fabricating a bridge');
assert.strictEqual(r.historySize,1);

r=s.select([ball(80,50,.9)],1.1,{segmentId:'B'});
assert.strictEqual(r.status,'SELECTED','camera/segment change resets temporal prior');
assert.strictEqual(r.historySize,1);

r=s.select([ball(81,50,.2,{valid:true})],1.2,{segmentId:'B'});
assert.strictEqual(r.status,'UNAVAILABLE');
assert.strictEqual(r.reason,'NO_VALID_BALL_CANDIDATE');

const blackout=create({bufferSize:4,maxPitchJumpM:10,minConfidence:.4,maxGapSec:.5});
assert.strictEqual(blackout.select([ball(10,10,.9)],0,{segmentId:'LIVE'}).status,'SELECTED');
for(const t of [.2,.4,.6,.8,1.0])assert.strictEqual(blackout.select([],t,{segmentId:'LIVE'}).status,'UNAVAILABLE');
r=blackout.select([ball(50,30,.9)],1.1,{segmentId:'LIVE'});
assert.strictEqual(r.status,'SELECTED','successive empty frames must not keep a stale ball prior alive across a long observation blackout');
assert.strictEqual(r.historySize,1,'post-blackout ball must start a fresh continuity history');
assert.ok(blackout.snapshot().resets>=1,'observation blackout must be auditable as a continuity reset');
assert.strictEqual(blackout.snapshot().lastObservedTime,1.1,'only a selected observed ball may advance the observation anchor');

const img=create({maxImageJump:.1,minConfidence:.3});
assert.strictEqual(img.select([{x:.5,y:.5,confidence:.8}],0,{planId:'P1'}).status,'SELECTED');
assert.strictEqual(img.select([{x:.55,y:.5,confidence:.7},{x:.9,y:.9,confidence:.99}],.1,{planId:'P1'}).index,0);
assert.strictEqual(img.select([],0.2,{planId:'P1'}).status,'UNAVAILABLE');
console.log('ball_candidate_continuity_nonregression: PASS');