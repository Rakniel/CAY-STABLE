const assert=require('assert');
const {inferOwner,analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true}
];
const sample=(time,visible=true)=>({
  time,
  ball:visible?{pitchX:10.2,pitchY:10,confidence:.95}:null,
  players
});

// A negative coverage threshold used to make a timeline with 0% observable
// coverage publish as FIABLE because 0 >= -1. Invalid negative thresholds must
// now fall back to the STABLE default instead of weakening the evidence gate.
{
  const r=analyzeBallEvents([sample(0),sample(1,false),sample(2)],{
    maxObservationGapSec:2,
    minCoverage:-1
  });
  assert.equal(r.coverage,0);
  assert.equal(r.thresholds.minCoverage,.55);
  assert.equal(r.quality,'INDISPONIBLE');
  assert.equal(r.passes,'INDISPONIBLE');
}

// Negative event thresholds must never silently lower the proof required for a
// pass/turnover. The shared sanitizer restores each documented safe default.
{
  const r=analyzeBallEvents([sample(0),sample(.2),sample(.4)],{
    minStableOwnershipSec:-1,
    minOpponentStableOwnershipSec:-1,
    minPassTravelM:-1,
    minPassMeanSpeedMps:-1,
    minPassDetachedObservations:-1,
    minPassDetachedSpanSec:-1,
    minTurnoverTravelM:-1,
    minTurnoverObservations:-1,
    maxObservationGapSec:-1,
    minCoverage:0
  });
  assert.equal(r.thresholds.minStableOwnershipSec,.30);
  assert(Math.abs(r.thresholds.minOpponentStableOwnershipSec-.4)<1e-12);
  assert.equal(r.thresholds.minPassTravelM,3);
  assert.equal(r.thresholds.minPassMeanSpeedMps,2.5);
  assert.equal(r.thresholds.minPassDetachedObservations,2);
  assert.equal(r.thresholds.minPassDetachedSpanSec,.03);
  assert.equal(r.thresholds.minTurnoverTravelM,.75);
  assert.equal(r.thresholds.minTurnoverObservations,3);
  assert.equal(r.thresholds.maxObservationGapSec,.75);
}

// Explicit zero remains a legitimate explicit configuration: the hardening is
// about invalid negative input, not about rewriting operator intent.
{
  const r=analyzeBallEvents([sample(0),sample(.2),sample(.4)],{
    minCoverage:0,
    minStableOwnershipSec:0,
    minPassTravelM:0
  });
  assert.equal(r.thresholds.minCoverage,0);
  assert.equal(r.thresholds.minStableOwnershipSec,0);
  assert.equal(r.thresholds.minPassTravelM,0);
}

// Owner inference receives the same protection. A negative confidence floor
// must not allow a low-confidence ball through, while an explicit zero still can.
{
  const low={ball:{pitchX:10.2,pitchY:10,confidence:.2},players};
  const guarded=inferOwner(low,{minBallConfidence:-1});
  assert.equal(guarded.status,'UNAVAILABLE');
  assert.equal(guarded.reason,'BALL_CONFIDENCE_TOO_LOW');
  const explicitZero=inferOwner(low,{minBallConfidence:0});
  assert.equal(explicitZero.status,'OWNED');
}

console.log('ball negative thresholds non-regression: PASS');
