const assert=require('assert');
const {analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true}
];

function sample(time,ballX){
  return {time,ball:{pitchX:ballX,pitchY:10,confidence:.95},players};
}

// Une seule frame classée FREE/AMBIGUOUS ne doit pas suffire à prouver un vol de ballon.
// Avant ce garde, un glitch isolé au milieu d'un changement de propriétaire pouvait devenir
// une passe si la distance et la vitesse apparentes dépassaient les seuils.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,15),
    sample(1.0,20.2),sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2)
  ];
  const r=analyzeBallEvents(samples,{ownerRadiusM:2.2,minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,0);
  assert.equal(r.rejectedPassTransitions,1);
  assert.deepEqual(r.events,[]);
  assert.equal(r.thresholds.minPassDetachedObservations,2);
}

// Contrôle positif : deux observations détachées avec déplacement métrique suffisant
// doivent préserver la détection d'une vraie passe.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14),sample(1.0,16),
    sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2),sample(1.8,20.2)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,1);
  assert.equal(r.events.length,1);
  assert.equal(r.events[0].type,'PASS');
  assert.equal(r.events[0].detachedBallObservations,2);
  assert(r.events[0].travelM>=9);
}

console.log('ball pass detached sequence non-regression: PASS');
