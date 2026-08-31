const assert=require('assert');
const {inferOwner,analyzeBallEvents}=require('../ball_event_state_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true}
];

// Missing/null/blank configuration must behave like omitted configuration,
// never like numeric zero through JavaScript coercion.
{
  const sample={ball:{pitchX:10.1,pitchY:10,confidence:.2},players};
  const omitted=inferOwner(sample);
  const missing=inferOwner(sample,{minBallConfidence:null,ownerRadiusM:' '});
  assert.equal(omitted.status,'UNAVAILABLE');
  assert.equal(omitted.reason,'BALL_CONFIDENCE_TOO_LOW');
  assert.deepEqual(missing,omitted);
}

function sample(time,visible=true){
  return {time,ball:visible?{pitchX:10.1,pitchY:10,confidence:.95}:null,players};
}

{
  const sparse=[sample(0,true),sample(1,false),sample(2,true)];
  const omitted=analyzeBallEvents(sparse,{maxObservationGapSec:2});
  const missing=analyzeBallEvents(sparse,{maxObservationGapSec:2,minCoverage:null,minBallConfidence:'',minStableOwnershipSec:' '});
  assert.equal(omitted.coverage,0);
  assert.equal(omitted.quality,'INDISPONIBLE');
  assert.equal(missing.quality,'INDISPONIBLE');
  assert.equal(missing.thresholds.minCoverage,.55);
  assert.equal(missing.thresholds.minBallConfidence,.65);
  assert.equal(missing.thresholds.minStableOwnershipSec,.3);
}

// An explicit numeric zero remains explicit and is not replaced by a default.
{
  const sparse=[sample(0,true),sample(1,false),sample(2,true)];
  const explicit=analyzeBallEvents(sparse,{maxObservationGapSec:2,minCoverage:0});
  assert.equal(explicit.thresholds.minCoverage,0);
  assert.equal(explicit.quality,'FIABLE');
}

console.log('ball missing option defaults non-regression: PASS');
