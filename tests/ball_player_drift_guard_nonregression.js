const assert=require('assert');
const Drift=require('../ball_player_drift_guard_v1.js');
const Continuity=require('../ball_candidate_continuity_v1.js');

const guard=Drift.create({minAttachedSec:.3,maxGapSec:.4,playerNearImage:.08,stableRelativeImage:.02,areaGrowthRatio:3,minEvidence:2});
const player={id:'P7',x:.50,y:.50,onField:true};

// Learn a plausible small-ball area away from players.
let r=guard.evaluate({x:.10,y:.10,confidence:.8,area:.001},[player],0,{segmentId:'A'});
assert.strictEqual(r.status,'CLEAR');

// A short overlap is tolerated: real football contact/occlusion must not be killed instantly.
r=guard.evaluate({x:.505,y:.50,confidence:.7,area:.004,propagated:true},[player],.10,{segmentId:'A'});
assert.strictEqual(r.status,'WATCH');
assert.strictEqual(r.drifted,false);

r=guard.evaluate({x:.506,y:.501,confidence:.7,area:.004,propagated:true},[player],.25,{segmentId:'A'});
assert.strictEqual(r.status,'WATCH');

// Sustained same-player attachment + stable relative geometry + propagation/area growth => drift.
r=guard.evaluate({x:.507,y:.501,confidence:.7,area:.004,propagated:true},[player],.45,{segmentId:'A'});
assert.strictEqual(r.status,'DRIFTED');
assert.strictEqual(r.drifted,true);
assert.ok(r.durationSec>=.3);
assert.ok(r.evidence.count>=2);
assert.strictEqual(r.playerId,'P7');

// A camera/shot segment change must reset attachment evidence.
r=guard.evaluate({x:.507,y:.501,confidence:.7,area:.004,propagated:true},[player],.50,{segmentId:'B'});
assert.strictEqual(r.status,'WATCH');
assert.strictEqual(r.drifted,false);

// Bench/spectator detections never become drift anchors.
const ignored=Drift.create();
r=ignored.evaluate({x:.5,y:.5,confidence:.8,area:.001},[{id:'BENCH',x:.5,y:.5,bench:true}],0,{segmentId:'A'});
assert.strictEqual(r.status,'CLEAR');

// Two almost equally-near on-field players are not a defensible ball-player association.
const ambiguous=Drift.create({playerNearImage:.08,ambiguityImage:.015});
r=ambiguous.evaluate({x:.50,y:.50,confidence:.9,area:.001},[
  {id:'P1',x:.49,y:.50,onField:true},
  {id:'P2',x:.512,y:.50,onField:true}
],0,{segmentId:'A'});
assert.strictEqual(r.status,'CLEAR');
assert.strictEqual(r.reason,'AMBIGUOUS_NEAREST_PLAYERS');
assert.strictEqual(r.associationAvailable,false);
assert.strictEqual(ambiguous.snapshot().ambiguousAssociations,1);
assert.strictEqual(ambiguous.snapshot().attachment,null);

// A clearly separated nearest player remains eligible.
r=ambiguous.evaluate({x:.50,y:.50,confidence:.9,area:.001},[
  {id:'P1',x:.505,y:.50,onField:true},
  {id:'P2',x:.55,y:.50,onField:true}
],.1,{segmentId:'A'});
assert.strictEqual(r.status,'WATCH');
assert.strictEqual(r.associationAvailable,true);
assert.strictEqual(r.playerId,'P1');

// Invalid negative tuning must fail closed to STABLE defaults instead of weakening drift evidence.
const hardened=Drift.create({
  minAttachedSec:-1,
  maxGapSec:-1,
  playerNearPitchM:-1,
  playerNearImage:-1,
  ambiguityPitchM:-1,
  ambiguityImage:-1,
  stableRelativePitchM:-1,
  stableRelativeImage:-1,
  lowConfidence:-1,
  areaGrowthRatio:-1,
  minEvidence:-1
});
const hc=hardened.snapshot().config;
assert.strictEqual(hc.minAttachedSec,.32);
assert.strictEqual(hc.maxGapSec,.25);
assert.strictEqual(hc.playerNearPitchM,1.25);
assert.strictEqual(hc.playerNearImage,.055);
assert.strictEqual(hc.ambiguityPitchM,.35);
assert.strictEqual(hc.ambiguityImage,.012);
assert.strictEqual(hc.stableRelativePitchM,.42);
assert.strictEqual(hc.stableRelativeImage,.018);
assert.strictEqual(hc.lowConfidence,.30);
assert.strictEqual(hc.areaGrowthRatio,3.5);
assert.strictEqual(hc.minEvidence,2);

// Before hardening, ambiguityPitchM:-1 collapsed to 0 and would force a false nearest-player association.
r=hardened.evaluate({pitchX:10,pitchY:10,confidence:.9,area:.001},[
  {id:'P1',pitchX:10.20,pitchY:10,onField:true},
  {id:'P2',pitchX:10.40,pitchY:10,onField:true}
],0,{segmentId:'NEG'});
assert.strictEqual(r.status,'CLEAR');
assert.strictEqual(r.reason,'AMBIGUOUS_NEAREST_PLAYERS');
assert.strictEqual(r.associationAvailable,false);

// Before hardening, playerNearPitchM:-1 shrank to .2 m and could miss a suspicious ball latched .5 m from a player.
const latched=Drift.create({playerNearPitchM:-1,lowConfidence:-1,minAttachedSec:-1,maxGapSec:.4,minEvidence:2});
const pitchPlayer={id:'P9',pitchX:20,pitchY:20,onField:true};
r=latched.evaluate({pitchX:20.5,pitchY:20,confidence:.1,propagated:true},[pitchPlayer],0,{segmentId:'L'});
assert.strictEqual(r.status,'WATCH');
r=latched.evaluate({pitchX:20.5,pitchY:20,confidence:.1,propagated:true},[pitchPlayer],.33,{segmentId:'L'});
assert.strictEqual(r.status,'DRIFTED');
assert.strictEqual(r.evidence.lowConfidence,true);
assert.strictEqual(r.evidence.propagated,true);

// Explicit zero remains respected only where zero is a meaningful defensive tuning value.
const zeroes=Drift.create({ambiguityPitchM:0,ambiguityImage:0,lowConfidence:0});
assert.strictEqual(zeroes.snapshot().config.ambiguityPitchM,0);
assert.strictEqual(zeroes.snapshot().config.ambiguityImage,0);
assert.strictEqual(zeroes.snapshot().config.lowConfidence,0);

// Existing continuity selector must never re-select a candidate explicitly flagged as drifted.
const continuity=Continuity.create({minConfidence:.35});
const selected=continuity.select([
  {x:.50,y:.50,confidence:.95,drifted:true,label:'latched-player'},
  {x:.52,y:.50,confidence:.80,label:'real-ball'}
],0,{segmentId:'A'});
assert.strictEqual(selected.status,'SELECTED');
assert.strictEqual(selected.candidate.label,'real-ball');

const unavailable=continuity.select([{x:.51,y:.50,confidence:.99,driftStatus:'DRIFTED'}],.1,{segmentId:'A'});
assert.strictEqual(unavailable.status,'UNAVAILABLE');
assert.strictEqual(unavailable.reason,'NO_VALID_BALL_CANDIDATE');

console.log('ball_player_drift_guard_nonregression: PASS');
