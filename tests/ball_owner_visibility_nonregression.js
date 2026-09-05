const assert=require('assert');
const {normalizePlayer,inferOwner,analyzeBallEvents}=require('../ball_event_state_v1.js');

const hidden={id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.99,onField:true,valid:true,visible:false};
const visible={id:'cay-10',team:'CAY',pitchX:11.2,pitchY:10,confidence:.95,onField:true,valid:true,visible:true};

// Explicitly invisible players may still carry predicted metric coordinates,
// but they are not observed evidence and must never own the ball.
assert.equal(normalizePlayer(hidden),null);
{
  const r=inferOwner({ball:{pitchX:10.1,pitchY:10,confidence:.95},players:[hidden]});
  assert.equal(r.status,'UNAVAILABLE');
  assert.equal(r.reason,'NO_VALID_ON_FIELD_PLAYER');
}

// A visible alternative remains eligible even when an invisible prediction is closer.
{
  const r=inferOwner({ball:{pitchX:10.4,pitchY:10,confidence:.95},players:[hidden,visible]},{ownerRadiusM:2});
  assert.equal(r.status,'OWNED');
  assert.equal(r.playerId,'cay-10');
}

// Invisible predicted coordinates must not accumulate possession seconds.
{
  const samples=[0,.2,.4,.6,.8].map(time=>({
    time,
    ball:{pitchX:10.1,pitchY:10,confidence:.95},
    players:[hidden]
  }));
  const r=analyzeBallEvents(samples,{minCoverage:.01,maxObservationGapSec:.75});
  assert.equal(r.ownedSeconds,0);
  assert.equal(r.coverage,0);
  assert.equal(r.quality,'INDISPONIBLE');
  assert.equal(r.passes,'INDISPONIBLE');
  assert.deepEqual(r.events,[]);
}

console.log('ball owner visibility non-regression: PASS');
