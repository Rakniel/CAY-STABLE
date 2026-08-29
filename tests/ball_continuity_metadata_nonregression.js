const assert=require('assert');
const {analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true}
];

function sample(time,ballX,segmentMarker){
  const row={time,ball:{pitchX:ballX,pitchY:10,confidence:.95},players};
  if(segmentMarker!==undefined)row.segment=segmentMarker;
  return row;
}

// A transient loss of segment/plan metadata must be treated as a continuity
// boundary. Previously lastContinuityKey survived the metadata-less frame, so
// a detached ball before the hole and a new owner after it could become a false pass.
{
  const samples=[
    sample(0,10.2,0),sample(.2,10.2,0),sample(.4,10.2,0),sample(.6,10.2,0),
    sample(.8,14,0),sample(1.0,16),
    sample(1.2,20.2,0),sample(1.4,20.2,0),sample(1.6,20.1,0),sample(1.8,20.1,0)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.3,maxObservationGapSec:.75});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.segmentBreaks,2);
  assert.equal(r.continuityMetadataBreaks,2);
  assert.equal(r.continuityBreaks,2);
  assert.equal(r.passes,0);
  assert.equal(r.turnovers,0);
  assert.deepEqual(r.events,[]);
}

// Backwards compatibility: a legacy timeline with no plan metadata anywhere
// remains analyzable; absence everywhere is not itself interpreted as repeated cuts.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14),sample(1.0,16),sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.3,maxObservationGapSec:.75});
  assert.equal(r.segmentBreaks,0);
  assert.equal(r.continuityMetadataBreaks,0);
  assert.equal(r.passes,1);
}

console.log('ball continuity metadata non-regression: PASS');
