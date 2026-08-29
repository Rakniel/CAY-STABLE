const assert=require('assert');
const {analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true}
];
function sample(time,ballX){return {time,ball:{pitchX:ballX,pitchY:10,confidence:.95},players};}

// Deux détections du ballon au même instant ne constituent pas deux preuves temporelles
// indépendantes d'un vol. Avant ce garde, deux lignes dupliquées pouvaient suffire à
// satisfaire minPassDetachedObservations et publier une passe.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14),sample(.8,16),
    sample(1.0,20.2),sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,0);
  assert.equal(r.rejectedPassTransitions,1);
  assert.equal(r.thresholds.minPassDetachedSpanSec,.03);
}

// Un micro-burst plus court que la preuve temporelle minimale est rejeté même si deux
// positions détachées différentes sont présentes.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14),sample(.81,16),
    sample(1.0,20.2),sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,0);
  assert.equal(r.rejectedPassTransitions,1);
}

// Contrôle positif : un vrai vol observé sur plusieurs instants reste publiable.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14),sample(1.0,16),
    sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2),sample(1.8,20.2)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,1);
  assert.equal(r.events[0].type,'PASS');
  assert.equal(r.events[0].detachedBallObservations,2);
  assert(r.events[0].detachedBallSpanSec>=.19);
}

console.log('ball pass temporal evidence non-regression: PASS');
