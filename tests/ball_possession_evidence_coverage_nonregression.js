const assert=require('assert');
const {analyze}=require('../ball_event_evidence_bridge_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'opp-4',team:'OPP',pitchX:30,pitchY:10,confidence:.95,onField:true}
];

function row(time,ballX){
  return {time,segment:'A',ball:{pitchX:ballX,pitchY:10,confidence:.95},players};
}

// The ball can be observed reliably while stable ownership is known for only a
// small fraction of the timeline. Global ball/event quality must not make the
// possession percentage publishable in that case.
{
  const samples=[
    row(0,10.1),row(.2,10.1),row(.4,10.1),row(.6,10.1),
    row(.8,14),row(1.0,14),row(1.2,14),row(1.4,14),row(1.6,14),row(1.8,14),row(2.0,14)
  ];
  const r=analyze(samples,{minStableOwnershipSec:.3,minCoverage:.55,maxObservationGapSec:.75});
  assert.equal(r.quality,'FIABLE');
  assert(r.coverage>=.99);
  assert(r.possessionCoverage<.55);
  assert.equal(r.fieldStatus.possession,'INDISPONIBLE');
  assert.equal(r.possession,'INDISPONIBLE');
  assert.equal(r.playerPossession,'INDISPONIBLE');
  assert.equal(r.possessionReason,'POSSESSION_EVIDENCE_TOO_LOW');
  assert(r.diagnosticPossession.CAY);
}

// When stable ownership covers the required fraction, possession remains
// publishable and keeps the existing team-share semantics.
{
  const samples=[
    row(0,10.1),row(.2,10.1),row(.4,10.1),row(.6,10.1),row(.8,10.1),
    row(1.0,10.1),row(1.2,10.1),row(1.4,10.1),row(1.6,10.1),row(1.8,10.1),row(2.0,10.1)
  ];
  const r=analyze(samples,{minStableOwnershipSec:.3,minCoverage:.55,maxObservationGapSec:.75});
  assert.equal(r.quality,'FIABLE');
  assert(r.possessionCoverage>=.55);
  assert.equal(r.fieldStatus.possession,'FIABLE');
  assert.notEqual(r.possession,'INDISPONIBLE');
  assert.equal(r.possession.CAY.share,1);
}

console.log('ball possession evidence coverage non-regression: PASS');
