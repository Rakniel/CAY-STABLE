const assert=require('assert');
const {analyzeBallEvents}=require('../ball_event_state_v1.js');

function row(time,ballX,cayX,oppX){
  return {
    time,
    segment:'A',
    ball:{pitchX:ballX,pitchY:10,confidence:.98},
    players:[
      // Deliberately identical logical player IDs across opposing teams.
      {id:'8',team:'CAY',pitchX:cayX,pitchY:10,confidence:.97,onField:true},
      {id:'8',team:'ADV',pitchX:oppX,pitchY:10,confidence:.97,onField:true}
    ]
  };
}

// Regression: playerId alone is not a globally unique football identity. A
// transition CAY #8 -> ADV #8 must be detected as a change of owner, while
// individual possession must remain separated by team.
{
  const samples=[
    row(0,10,10.1,16),row(.2,10,10.1,16),row(.4,10,10.1,16),row(.6,10,10.1,16),
    row(.8,11,16,11.1),row(1.0,11.5,16,11.6),row(1.2,12,16,12.1),
    row(1.4,12,16,12.1),row(1.6,12,16,12.1)
  ];
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5,minTurnoverTravelM:.75,maxTurnoverTransitionSec:1.5});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.turnovers,1);
  assert.equal(r.events[0].type,'TURNOVER');
  assert.equal(r.events[0].fromPlayerId,'8');
  assert.equal(r.events[0].toPlayerId,'8');
  assert.equal(r.events[0].fromTeam,'CAY');
  assert.equal(r.events[0].toTeam,'ADV');
  assert(r.playerPossessionByTeam.CAY['8']>0);
  assert(r.playerPossessionByTeam.ADV['8']>0);
  assert.equal(r.playerPossession['8'],undefined);
  assert.deepEqual(r.playerPossessionIdCollisions,[{playerId:'8',teams:['ADV','CAY']}]);
}

// Backward compatibility: a player ID that is unique across observed teams is
// still exposed through the historical flat playerPossession view.
{
  const samples=[0,.2,.4,.6,.8,1.0].map(time=>({
    time,segment:'A',ball:{pitchX:10,pitchY:10,confidence:.98},
    players:[{id:'cay-9',team:'CAY',pitchX:10.1,pitchY:10,confidence:.97,onField:true}]
  }));
  const r=analyzeBallEvents(samples,{minStableOwnershipSec:.3,minCoverage:.5});
  assert.equal(r.quality,'FIABLE');
  assert(r.playerPossession['cay-9']>0);
  assert.equal(r.playerPossession['cay-9'],r.playerPossessionByTeam.CAY['cay-9']);
  assert.deepEqual(r.playerPossessionIdCollisions,[]);
}

console.log('ball owner team scope non-regression: PASS');
