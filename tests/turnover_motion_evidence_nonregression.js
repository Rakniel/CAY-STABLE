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

// Faux positif historique : le ballon reste immobile, seuls les joueurs changent
// de proximité. Une bascule du plus proche ne suffit plus à publier un turnover.
{
  const samples=[
    row(0,15,15.1,19),row(.2,15,15.1,19),row(.4,15,15.1,19),
    row(.6,15,19,15.1),row(.8,15,19,15.1),row(1.0,15,19,15.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.turnovers,0);
  assert.equal(r.rejectedTurnoverTransitions,1);
  assert.deepEqual(r.events,[]);
}

// Contrôle positif : une récupération adverse avec déplacement métrique observable
// du ballon reste publiable.
{
  const samples=[
    row(0,10,10.1,16),row(.2,10,10.1,16),row(.4,10,10.1,16),
    row(.6,11,16,11.1),row(.8,11.5,16,11.6),row(1.0,12,16,12.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.turnovers,1);
  assert.equal(r.rejectedTurnoverTransitions,0);
  assert.equal(r.events[0].type,'TURNOVER');
  assert(r.events[0].travelM>=1.9);
  assert(r.events[0].transitionSec<=.5);
  assert.equal(r.events[0].source,'validated_ball_motion_and_ownership_transition');
}

console.log('turnover motion evidence non-regression: PASS');
