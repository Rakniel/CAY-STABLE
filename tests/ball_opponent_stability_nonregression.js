const assert=require('assert');
const {analyzeBallEvents}=require('../ball_event_state_v1.js');

function row(time,ballX,cayX,oppX){
  return {
    time,
    ball:{pitchX:ballX,pitchY:10,confidence:.98},
    players:[
      {id:'cay-6',team:'CAY',pitchX:cayX,pitchY:10,confidence:.97,onField:true},
      {id:'opp-8',team:'ADV',pitchX:oppX,pitchY:10,confidence:.97,onField:true}
    ]
  };
}

// Une recuperation adverse transitoire qui aurait depasse le seuil standard
// de 0.30 s mais pas le seuil renforce ne doit pas devenir un turnover.
{
  const samples=[
    row(0,10,10.1,16),row(.2,10,10.1,16),row(.4,10,10.1,16),
    row(.6,11,16,11.1),row(.8,11.5,16,11.6),row(.95,12,16,12.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.thresholds.minStableOwnershipSec,.3);
  assert(Math.abs(r.thresholds.minOpponentStableOwnershipSec-.4)<1e-9);
  assert.equal(r.turnovers,0);
  assert.equal(r.events.length,0);
  assert(r.opponentStabilityDeferrals>=1);
}

// Controle positif : avec la meme preuve de mouvement et 0.40 s de stabilisation
// adverse, le turnover reste publiable.
{
  const samples=[
    row(0,10,10.1,16),row(.2,10,10.1,16),row(.4,10,10.1,16),
    row(.6,11,16,11.1),row(.8,11.5,16,11.6),row(1.0,12,16,12.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.turnovers,1);
  assert.equal(r.events[0].type,'TURNOVER');
  assert.equal(r.events[0].receiverStableSec,.4);
  assert.equal(r.events[0].transitionBallObservations,3);
}

// Un seuil utilisateur ne peut jamais rendre la bascule adverse moins stricte
// que le seuil de possession standard.
{
  const samples=[row(0,10,10.1,16),row(.2,10,10.1,16)];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.5,minOpponentStableOwnershipSec:.2,minCoverage:0});
  assert.equal(r.thresholds.minOpponentStableOwnershipSec,.5);
}

console.log('ball opponent stability non-regression: PASS');
