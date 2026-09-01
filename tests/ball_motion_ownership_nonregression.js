const assert=require('assert');
const {inferOwner,analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true}
];

// A clearly fast ball passing close to a player is observed, but is not credited as controlled possession.
// Default is deliberately conservative so plausible receiver acquisition stays compatible.
{
  const r=inferOwner({ball:{pitchX:10.2,pitchY:10,confidence:.95},players,observedBallSpeedMps:35});
  assert.equal(r.status,'FREE');
  assert.equal(r.reason,'BALL_MOVING_TOO_FAST_FOR_STABLE_OWNERSHIP');
  assert.equal(r.maxOwnershipBallSpeedMps,30);
}

// An implausible metric jump is excluded from observability rather than assigned to a player.
{
  const r=inferOwner({ball:{pitchX:10.2,pitchY:10,confidence:.95},players,observedBallSpeedMps:70});
  assert.equal(r.status,'UNAVAILABLE');
  assert.equal(r.reason,'BALL_MOTION_IMPLAUSIBLE');
}

// Normal controlled-ball speed keeps the historical nearest-player behavior.
{
  const r=inferOwner({ball:{pitchX:10.2,pitchY:10,confidence:.95},players,observedBallSpeedMps:4});
  assert.equal(r.status,'OWNED');
  assert.equal(r.playerId,'cay-9');
}

// A configurable stricter gate can keep fast pass-flight observations detached in the event state machine.
{
  const samples=[
    {time:0,segment:1,ball:{pitchX:10.1,pitchY:10,confidence:.95},players},
    {time:.2,segment:1,ball:{pitchX:10.1,pitchY:10,confidence:.95},players},
    {time:.4,segment:1,ball:{pitchX:10.1,pitchY:10,confidence:.95},players},
    {time:.6,segment:1,ball:{pitchX:13.5,pitchY:10,confidence:.95},players},
    {time:.8,segment:1,ball:{pitchX:17.0,pitchY:10,confidence:.95},players},
    {time:1.0,segment:1,ball:{pitchX:19.9,pitchY:10,confidence:.95},players},
    {time:1.2,segment:1,ball:{pitchX:20.1,pitchY:10,confidence:.95},players},
    {time:1.4,segment:1,ball:{pitchX:20.1,pitchY:10,confidence:.95},players},
    {time:1.6,segment:1,ball:{pitchX:20.1,pitchY:10,confidence:.95},players}
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,maxOwnershipBallSpeedMps:12,maxPlausibleBallSpeedMps:45});
  assert.equal(r.quality,'FIABLE');
  assert(r.fastBallFreeFrames>=2);
  assert.equal(r.motionRejectedFrames,0);
  assert.equal(r.thresholds.maxOwnershipBallSpeedMps,12);
  assert.equal(r.passes,1);
}

// Motion evidence never crosses a camera-plan boundary.
{
  const samples=[
    {time:0,segment:1,ball:{pitchX:10,pitchY:10,confidence:.95},players},
    {time:.2,segment:1,ball:{pitchX:10,pitchY:10,confidence:.95},players},
    {time:.4,segment:2,ball:{pitchX:20,pitchY:10,confidence:.95},players},
    {time:.6,segment:2,ball:{pitchX:20,pitchY:10,confidence:.95},players}
  ];
  const r=analyzeBallEvents(samples,{minCoverage:.01});
  assert.equal(r.segmentBreaks,1);
  assert.equal(r.motionRejectedFrames,0);
}

console.log('ball_motion_ownership_nonregression: PASS');
