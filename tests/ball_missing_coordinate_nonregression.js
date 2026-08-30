const assert=require('assert');
const {normalizeBall,normalizePlayer,inferOwner,analyzeBallEvents}=require('../ball_event_state_v1.js');

const validPlayer={id:'cay-9',team:'CAY',pitchX:0,pitchY:0,confidence:.95,onField:true};

assert.equal(normalizeBall({pitchX:null,pitchY:null,confidence:.99}),null);
assert.equal(normalizeBall({pitchX:'',pitchY:'',confidence:.99}),null);
assert.equal(normalizePlayer({id:'ghost',team:'CAY',pitchX:null,pitchY:null,confidence:.99,onField:true}),null);
assert.equal(normalizePlayer({id:'ghost',team:'CAY',pitchX:'',pitchY:'',confidence:.99,onField:true}),null);

const missingBallOwner=inferOwner({ball:{pitchX:null,pitchY:null,confidence:.99},players:[validPlayer]});
assert.equal(missingBallOwner.status,'UNAVAILABLE');
assert.equal(missingBallOwner.reason,'BALL_NOT_OBSERVED');

const missingPlayerOwner=inferOwner({ball:{pitchX:0,pitchY:0,confidence:.99},players:[{id:'ghost',team:'CAY',pitchX:null,pitchY:null,confidence:.99,onField:true}]});
assert.equal(missingPlayerOwner.status,'UNAVAILABLE');
assert.equal(missingPlayerOwner.reason,'NO_VALID_ON_FIELD_PLAYER');

const samples=[
  {time:0,ball:{pitchX:null,pitchY:null,confidence:.99},players:[validPlayer]},
  {time:.2,ball:{pitchX:null,pitchY:null,confidence:.99},players:[validPlayer]},
  {time:.4,ball:{pitchX:null,pitchY:null,confidence:.99},players:[validPlayer]},
  {time:.6,ball:{pitchX:null,pitchY:null,confidence:.99},players:[validPlayer]}
];
const analysis=analyzeBallEvents(samples,{minCoverage:.01});
assert.equal(analysis.coverage,0);
assert.equal(analysis.observableSeconds,0);
assert.equal(analysis.ownedSeconds,0);
assert.equal(analysis.quality,'INDISPONIBLE');
assert.equal(analysis.passes,'INDISPONIBLE');
assert.deepEqual(analysis.events,[]);

console.log('ball missing coordinate non-regression: PASS');
