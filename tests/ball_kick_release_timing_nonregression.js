const assert=require('assert');
const {validatePassKick}=require('../ball_kick_evidence_v1.js');

const player=(id,x)=>({id,team:'CAY',pitchX:x,pitchY:20,confidence:.95,onField:true});
const row=(time,bx,px)=>({time,ball:{pitchX:bx,pitchY:20,confidence:.95,valid:true,visible:true},players:[player('P1',px),player('P2',20)]});

const event={type:'PASS',time:1.0,transitionSec:.2,fromPlayerId:'P1',toPlayerId:'P2'};

// A large acceleration after the receiver already owns the ball cannot prove
// that the original passer kicked it. The old symmetric window around the
// transition start could include 1.1/1.2s here and falsely confirm the pass.
const postReceptionSpike=[
  row(.55,10,10),
  row(.65,10.05,10.02),
  row(.75,10.10,10.04),
  row(.85,10.15,10.06),
  row(.95,10.20,10.08),
  row(1.00,10.25,10.10),
  row(1.10,14,10.12),
  row(1.20,19,10.15)
];
const post=validatePassKick(postReceptionSpike,event,{windowSec:.45,minReleaseSpeedMps:3,minSpeedGainMps:1.2,minSeparationGainM:.7,minObservations:4});
assert.notStrictEqual(post.status,'CONFIRMED','post-reception ball acceleration must never confirm the passer kick');
assert.ok(post.windowEnd<=event.time,'kick evidence window must end no later than reception');
if(post.releaseTime!==undefined)assert.ok(post.releaseTime<=event.time,'selected kick evidence must occur before reception');

// A real release before reception remains valid with the same timing guard.
const realRelease=[
  row(.45,10,10),
  row(.60,10.1,10.05),
  row(.72,10.2,10.1),
  row(.82,11.5,10.15),
  row(.90,14.0,10.2),
  row(.96,17.0,10.25),
  row(1.00,20,20)
];
const real=validatePassKick(realRelease,event,{windowSec:.45,minReleaseSpeedMps:3,minSpeedGainMps:1.2,minSeparationGainM:.7,minObservations:4});
assert.strictEqual(real.status,'CONFIRMED','pre-reception release evidence must still confirm a valid pass');
assert.ok(real.releaseTime<=event.time);
assert.ok(real.windowEnd<=event.time);

console.log('ball kick release timing non-regression: PASS');