const assert=require('assert');
const Bridge=require('../ball_roster_ownership_bridge_v1.js');

const options={
  clubTeam:'CAY',
  bindingState:{bindings:[{
    trackId:'track-9',playerId:'p9',source:'MANUAL',confidence:1,confirmed:true,evidence:[]
  }]},
  participation:{
    byPlayerId:{p9:[{startMs:0,endMs:10000}]},
    boundaryPolicy:'HALF_OPEN_SUBSTITUTION_WINDOWS_[START,END)'
  }
};

const cay={team:'CAY',trackId:'track-9'};

const blank=Bridge.scopedPlayer(cay,options,'   ');
assert.strictEqual(blank.player,null,'blank participation timestamps must not be coerced to t=0');
assert.strictEqual(blank.reason,'CLUB_PARTICIPATION_TIME_MISSING');

const empty=Bridge.scopedPlayer(cay,options,'');
assert.strictEqual(empty.player,null,'empty participation timestamps must fail closed');
assert.strictEqual(empty.reason,'CLUB_PARTICIPATION_TIME_MISSING');

const missing=Bridge.scopedPlayer(cay,options,null);
assert.strictEqual(missing.player,null,'missing participation timestamps must fail closed');
assert.strictEqual(missing.reason,'CLUB_PARTICIPATION_TIME_MISSING');

const zero=Bridge.scopedPlayer(cay,options,0);
assert.ok(zero.player,'a real numeric zero timestamp remains valid at the start of participation');
assert.strictEqual(zero.player.playerId,'p9');

const opponent=Bridge.scopedPlayer({team:'OPP',trackId:'opp-1'},options,'');
assert.ok(opponent.player,'opponent detections are not roster-bound and remain untouched');
assert.strictEqual(opponent.reason,null);

console.log('ball_roster_blank_participation_time_nonregression: ok');
