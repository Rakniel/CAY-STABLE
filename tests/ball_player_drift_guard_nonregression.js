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
