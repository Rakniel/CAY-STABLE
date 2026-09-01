const assert=require('assert');
const Bridge=require('../ball_event_evidence_bridge_v1.js');

const players=[
  {id:'cay-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
  {id:'cay-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true}
];
function sample(time,ballX,extra={}){
  return {time,ball:{pitchX:ballX,pitchY:10,confidence:.95},players,...extra};
}

assert.equal(Bridge.explicitNonLive({isReplay:true}),true);
assert.equal(Bridge.explicitNonLive({frameClass:'slow_motion'}),true);
assert.equal(Bridge.explicitNonLive({live:false}),true);
assert.equal(Bridge.explicitNonLive({frameClass:'LIVE'}),false);
assert.equal(Bridge.explicitNonLive({}),false);

// A sequence that visually resembles a completed pass but occurs inside an explicit replay
// must not create an event or bridge possession across the replay boundary.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14,{isReplay:true}),sample(1.0,16,{isReplay:true}),
    sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2),sample(1.8,20.2)
  ];
  const r=Bridge.analyze(samples,{minStableOwnershipSec:.3,minCoverage:.25});
  assert.equal(r.nonLiveExcludedFrames,2);
  assert.equal(r.nonLiveRuns,1);
  assert.equal(r.passes,0);
  assert.equal(r.events.filter(e=>e.type==='PASS').length,0);
  assert(r.segmentBreaks>=2,'entering and leaving non-live content must break continuity');
}

// Metadata-free footage keeps the historical behavior: CAY never guesses that a segment is a replay.
{
  const samples=[
    sample(0,10.2),sample(.2,10.2),sample(.4,10.2),sample(.6,10.2),
    sample(.8,14),sample(1.0,16),
    sample(1.2,20.2),sample(1.4,20.2),sample(1.6,20.2),sample(1.8,20.2)
  ];
  const r=Bridge.analyze(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.nonLiveExcludedFrames,0);
  assert.equal(r.nonLiveRuns,0);
  assert.equal(r.passes,1);
}

// Consecutive replay frames are one non-live run, not one artificial segment per frame.
{
  const guarded=Bridge.guardLivePlaySamples([
    sample(0,10.2),sample(.2,10.2,{frameClass:'REPLAY'}),sample(.4,11,{frameClass:'REPLAY'}),sample(.6,12)
  ]);
  assert.equal(guarded.excludedFrames,2);
  assert.equal(guarded.nonLiveRuns,1);
  assert.equal(guarded.samples[1].segment,guarded.samples[2].segment);
  assert.equal(guarded.samples[1].ball.valid,false);
  assert.deepEqual(guarded.samples[1].players,[]);
}

console.log('ball non-live guard non-regression: PASS');
