const assert=require('assert');
const {analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true}
];
const sample=(time,ballX)=>({time,ball:{pitchX:ballX,pitchY:10,confidence:.95},players});

// Une vraie transition rapide et détachée conserve la passe et expose la vitesse moyenne auditée.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,13),sample(1.0,16),sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,1);
  assert.equal(r.events[0].type,'PASS');
  assert(r.events[0].meanBallSpeedMps>=2.5);
  assert.equal(r.events[0].source,'validated_ball_flight_motion_and_ownership_transition');
}

// Un glissement très lent entre deux joueurs du même camp ne doit pas être publié comme passe,
// même si distance + détachement + changement de propriétaire sont observés.
{
  const samples=[
    sample(0,10.2),sample(.5,10.2),
    sample(1.0,12.5),sample(1.5,13.5),sample(2.0,14.5),sample(2.5,15),
    sample(3.0,15.5),sample(3.5,16.5),sample(4.0,17.5),
    sample(4.5,20.2),sample(5.0,20.2)
  ];
  const r=analyzeBallEvents(samples,{
    minStableOwnershipSec:.3,minCoverage:.5,maxObservationGapSec:.75,
    maxPassTransitionSec:6,minPassMeanSpeedMps:3
  });
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,0);
  assert.equal(r.rejectedPassTransitions,1);
  assert.deepEqual(r.events,[]);
  assert.equal(r.thresholds.minPassMeanSpeedMps,3);
}

console.log('ball motion evidence non-regression: PASS');
