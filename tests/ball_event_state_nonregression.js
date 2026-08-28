const assert=require('assert');
const {inferOwner,analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true},
  {id:'opp-4',team:'ADV',pitchX:30,pitchY:10,confidence:.95,onField:true}
];

{
  const r=inferOwner({ball:{pitchX:10.4,pitchY:10,confidence:.9},players});
  assert.equal(r.status,'OWNED');
  assert.equal(r.playerId,'cay-9');
  assert.equal(r.team,'CAY');
}

{
  const r=inferOwner({ball:{pitchX:15,pitchY:10,confidence:.9},players},{ownerRadiusM:6,ambiguityMarginM:1});
  assert.equal(r.status,'AMBIGUOUS');
}

{
  const r=inferOwner({ball:{pitchX:10.2,pitchY:10,confidence:.2},players});
  assert.equal(r.status,'UNAVAILABLE');
  assert.equal(r.reason,'BALL_CONFIDENCE_TOO_LOW');
}

function sample(time,ballX,ownerVisible=true){
  return {time,ball:ownerVisible?{pitchX:ballX,pitchY:10,confidence:.95}:null,players};
}

{
  const samples=[
    sample(0,10.2),sample(.2,10.3),sample(.4,10.3),sample(.6,10.2),
    sample(.8,14),sample(1.0,16),
    sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.1),sample(1.8,20.1),
    sample(2.0,30.1),sample(2.2,30.2),sample(2.4,30.2),sample(2.6,30.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,1);
  assert.equal(r.turnovers,1);
  assert.equal(r.events.length,2);
  assert.equal(r.events[0].type,'PASS');
  assert.equal(r.events[0].fromPlayerId,'cay-9');
  assert.equal(r.events[0].toPlayerId,'cay-10');
  assert.equal(r.events[0].detachedBallObserved,true);
  assert(r.events[0].travelM>=9);
  assert.equal(r.events[1].type,'TURNOVER');
  assert.equal(r.events[1].toPlayerId,'opp-4');
}

{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,20.2),sample(1.0,20.2),sample(1.2,20.1),sample(1.4,20.1)
  ];
  const r=analyzeBallEvents(samples,{minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,0);
  assert.equal(r.rejectedPassTransitions,1);
  assert.deepEqual(r.events,[]);
}

{
  const samples=[sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),sample(.8,10.2,false),sample(1.0,10.2,false),sample(1.2,10.2,false),sample(1.4,10.2,false),sample(1.6,10.2,false)];
  const r=analyzeBallEvents(samples,{minCoverage:.7});
  assert.equal(r.quality,'INDISPONIBLE');
  assert.equal(r.reason,'BALL_COVERAGE_TOO_LOW');
  assert.equal(r.passes,'INDISPONIBLE');
  assert.deepEqual(r.events,[]);
}

{
  const samples=[
    sample(0,10.1),sample(.2,10.1),sample(.4,10.1),
    {time:.6,ball:{pitchX:15,pitchY:10,confidence:.95},players},
    {time:.8,ball:{pitchX:15,pitchY:10,confidence:.95},players},
    sample(1.0,20.1),sample(1.2,20.1),sample(1.4,20.1)
  ];
  const r=analyzeBallEvents(samples,{ownerRadiusM:6,ambiguityMarginM:1,minCoverage:.4});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,1);
}

// Une frame visible suivie d'une frame absente ne doit plus créditer l'intervalle
// comme observable. Avant le garde v1, ce scénario donnait 50 % de couverture.
{
  const samples=[sample(0,10.2),sample(1,10.2,false),sample(2,10.2)];
  const r=analyzeBallEvents(samples,{maxObservationGapSec:2,minCoverage:.01});
  assert.equal(r.coverage,0);
  assert.equal(r.observableSeconds,0);
  assert.equal(r.ownedSeconds,0);
  assert.equal(r.quality,'INDISPONIBLE');
}

// Une transition directe vers un autre propriétaire ne doit pas attribuer
// l'intervalle entier au propriétaire précédent.
{
  const samples=[sample(0,10.2),sample(.4,10.2),sample(.8,10.2),sample(1.2,20.2),sample(1.6,20.2)];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,maxObservationGapSec:1});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.ownedSeconds,.4);
  assert.equal(r.possession.CAY.seconds,.4);
}

// Un long trou dans la timeline doit rester dans le dénominateur de couverture.
// L'ancien calcul supprimait entièrement ces secondes et pouvait transformer
// artificiellement une vidéo très lacunaire en séquence FIABLE.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),
    sample(5.4,10.2),sample(5.6,10.2),sample(5.8,10.2)
  ];
  const r=analyzeBallEvents(samples,{maxObservationGapSec:.75,minCoverage:.5});
  assert.equal(r.timelineSeconds,5.8);
  assert.equal(r.observableSeconds,.8);
  assert.equal(r.unobservedGapSeconds,5);
  assert.equal(r.gapBreaks,1);
  assert.equal(r.largestGapSec,5);
  assert(r.coverage<.14);
  assert.equal(r.quality,'INDISPONIBLE');
  assert.equal(r.passes,'INDISPONIBLE');
}

// Une possession ne doit jamais traverser un long trou : après le gap il faut
// reconstruire une possession stable avant toute passe/turnover publiable.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(3.0,20.2),sample(3.2,20.2),sample(3.4,20.2),sample(3.6,20.2)
  ];
  const r=analyzeBallEvents(samples,{maxObservationGapSec:.75,minStableOwnershipSec:.3,minCoverage:.1});
  assert.equal(r.gapBreaks,1);
  assert.equal(r.passes,0);
  assert.equal(r.turnovers,0);
  assert.deepEqual(r.events,[]);
}

console.log('ball event state non-regression: PASS');
