'use strict';
const assert=require('assert');
const Core=require('../tracking_core_v1.js');
const Adapter=require('../tracking_two_stage_adapter_v1.js');
const Stats=require('../player_stats_v1.js');

function det(x=.30,score=.92){return {x,y:.45,score,cat:'team',feature:[.1,.2,.3]};}

// Default CAY policy: a single strong detection remains internal-only and must not leak into roster/stats.
{
  const state=Core.createState();
  const first=Adapter.assignFrame(state,[det()],0,{maxPlayers:11,lostAfter:8});
  assert.strictEqual(first.confirmation.minimumConsecutiveFrames,2);
  assert.strictEqual(first.assigned.length,0,'single-frame candidate must stay tentative');
  assert.strictEqual(state.active.length,1,'tentative track must remain internally available for next-frame matching');
  assert.strictEqual(state.active[0].cayIdentityConfirmed,false);
  assert.strictEqual(Core.summary(state).rosterTotal,0,'tentative candidate must not count in roster summary');
  const tentativeReport=Stats.buildReport(state,Core,{});
  assert.strictEqual(tentativeReport.players.length,0,'tentative candidate must not produce a player card');
  assert.strictEqual(tentativeReport.teamTimeline.length,0,'tentative candidate must not affect team coverage timeline');

  const second=Adapter.assignFrame(state,[det(.305)],.5,{maxPlayers:11,lostAfter:8});
  assert.strictEqual(second.assigned.length,1,'second consecutive strong detection must confirm the track');
  assert.strictEqual(second.assigned[0].trackId,1);
  assert.strictEqual(state.active[0].cayIdentityConfirmed,true);
  assert.strictEqual(Core.summary(state).rosterTotal,1);
  const confirmedReport=Stats.buildReport(state,Core,{});
  assert.strictEqual(confirmedReport.players.length,1,'confirmed identity must produce one player card');
  assert.ok(confirmedReport.teamTimeline.length>=1,'confirmed identity may enter observed coverage');
}

// A gap before confirmation resets the strong-detection streak.
{
  const state=Core.createState();
  assert.strictEqual(Adapter.assignFrame(state,[det()],0,{maxPlayers:11,lostAfter:8}).assigned.length,0);
  assert.strictEqual(Adapter.assignFrame(state,[],.5,{maxPlayers:11,lostAfter:8}).assigned.length,0);
  const afterGap=Adapter.assignFrame(state,[det(.302)],1,{maxPlayers:11,lostAfter:8});
  assert.strictEqual(afterGap.assigned.length,0,'non-consecutive evidence must not confirm a tentative identity');
  const confirmed=Adapter.assignFrame(state,[det(.304)],1.5,{maxPlayers:11,lostAfter:8});
  assert.strictEqual(confirmed.assigned.length,1);
}

// Explicit legacy override remains available for diagnostics/controlled tests.
{
  const state=Core.createState();
  const immediate=Adapter.assignFrame(state,[det()],0,{maxPlayers:11,lostAfter:8,minimumConsecutiveFrames:1});
  assert.strictEqual(immediate.assigned.length,1);
}

console.log('tentative identity confirmation non-regression: PASS');
