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

// Des doublons issus d'un export/replay au meme timestamp ne sont pas des
// observations temporelles independantes. Avant ce garde, trois lignes a t=.6
// pouvaient satisfaire minTurnoverObservations=3 puis publier un turnover a t=1.
{
  const samples=[
    row(0,10,10.1,16),row(.2,10,10.1,16),row(.4,10,10.1,16),
    row(.6,11,16,11.1),row(.6,11,16,11.1),row(.6,11,16,11.1),
    row(1.0,12,16,12.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.turnovers,0);
  assert.equal(r.rejectedTurnoverTransitions,1);
  assert.deepEqual(r.events,[]);
  assert.equal(r.thresholds.minTurnoverObservations,3);
}

// Controle positif : trois timestamps distincts restent bien trois preuves.
{
  const samples=[
    row(0,10,10.1,16),row(.2,10,10.1,16),row(.4,10,10.1,16),
    row(.6,11,16,11.1),row(.8,11.5,16,11.6),row(1.0,12,16,12.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.turnovers,1);
  assert.equal(r.events[0].transitionBallObservations,3);
}

console.log('turnover distinct timestamp evidence non-regression: PASS');
