const assert=require('assert');
const Core=require('../ball_event_state_v1.js');
const Bridge=require('../ball_roster_ownership_bridge_v1.js');
const Binding=require('../track_roster_binding_v1.js');

let bindingState=Binding.createState();
bindingState=Binding.bind(bindingState,{trackId:'track-9',playerId:'cay-9',source:'MANUAL',confidence:.99,confirmed:true});
bindingState=Binding.bind(bindingState,{trackId:'track-10',playerId:'cay-10',source:'MANUAL',confidence:.99,confirmed:true});

const players=[
  {id:'ghost-cay',team:'CAY',pitchX:10.05,pitchY:10,confidence:.99,onField:true},
  {id:'track-9',team:'CAY',pitchX:11.2,pitchY:10,confidence:.95,onField:true},
  {id:'opp-4',team:'ADV',pitchX:30,pitchY:10,confidence:.95,onField:true}
];

// Avant le bridge, le faux CAY le plus proche peut devenir propriétaire.
{
  const before=Core.inferOwner({ball:{pitchX:10,pitchY:10,confidence:.95},players});
  assert.equal(before.status,'OWNED');
  assert.equal(before.playerId,'ghost-cay');

  const after=Bridge.inferOwner({ball:{pitchX:10,pitchY:10,confidence:.95},players},{clubTeam:'CAY',bindingState});
  assert.equal(after.status,'OWNED');
  assert.equal(after.playerId,'cay-9');
  assert.equal(after.team,'CAY');
  assert.equal(after.rosterGuard.rejectedClubPlayers,1);
  assert.equal(after.rosterGuard.mappedClubPlayers,1);
}

// L'adversaire reste éligible même si son roster n'est pas configuré.
{
  const r=Bridge.inferOwner({ball:{pitchX:30.1,pitchY:10,confidence:.95},players},{clubTeam:'CAY',bindingState});
  assert.equal(r.status,'OWNED');
  assert.equal(r.playerId,'opp-4');
  assert.equal(r.team,'ADV');
}

function frame(time,ballX,extraPlayers=[]){
  return {
    time,
    ball:{pitchX:ballX,pitchY:10,confidence:.95},
    players:[
      {id:'track-9',team:'CAY',pitchX:10,pitchY:10,confidence:.95,onField:true},
      {id:'track-10',team:'CAY',pitchX:20,pitchY:10,confidence:.95,onField:true},
      {id:'opp-4',team:'ADV',pitchX:30,pitchY:10,confidence:.95,onField:true},
      ...extraPlayers
    ]
  };
}

// Une fausse identité CAY proche du ballon ne doit ni recevoir la possession
// individuelle ni casser une passe entre deux joueurs du roster confirmés.
{
  const ghost={id:'ghost-cay',team:'CAY',pitchX:15,pitchY:10,confidence:.99,onField:true};
  const samples=[
    frame(0,10.1),frame(.2,10.1),frame(.4,10.1),frame(.6,10.1),
    frame(.8,14,[ghost]),frame(1.0,16,[ghost]),
    frame(1.2,20.1),frame(1.4,20.1),frame(1.6,20.1),frame(1.8,20.1)
  ];
  const r=Bridge.analyzeBallEvents(samples,{clubTeam:'CAY',bindingState,ballOptions:{minStableOwnershipSec:.3,minCoverage:.5}});
  assert.equal(r.quality,'FIABLE');
  assert.equal(r.passes,1);
  assert.equal(r.events.length,1);
  assert.equal(r.events[0].fromPlayerId,'cay-9');
  assert.equal(r.events[0].toPlayerId,'cay-10');
  assert(!Object.prototype.hasOwnProperty.call(r.playerPossession,'ghost-cay'));
  assert(r.rosterGuard.rejectedClubPlayers>=2);
}

// Sans association fiable, un track CAY est exclu plutôt que publié sous une
// identité technique temporaire.
{
  const r=Bridge.inferOwner({ball:{pitchX:10,pitchY:10,confidence:.95},players:[{id:'unbound',team:'CAY',pitchX:10.1,pitchY:10,confidence:.99,onField:true}]},{clubTeam:'CAY',bindingState});
  assert.equal(r.status,'UNAVAILABLE');
  assert.equal(r.reason,'NO_VALID_ON_FIELD_PLAYER');
  assert.equal(r.rosterGuard.rejectedClubPlayers,1);
}

// Dès qu'une chronologie de participation est disponible, le bridge ne doit
// jamais retomber sur le binding statique : sans temps observationnel on ne
// peut pas savoir si le joueur est encore sur le terrain.
{
  const participation={
    byPlayerId:{
      'cay-9':[{startMs:0,endMs:1000}],
      'cay-10':[{startMs:1000,endMs:null}]
    },
    boundaryPolicy:'HALF_OPEN_SUBSTITUTION_WINDOWS_[START,END)'
  };
  const noTime=Bridge.inferOwner({ball:{pitchX:10,pitchY:10,confidence:.95},players:[{id:'track-9',team:'CAY',pitchX:10.1,pitchY:10,confidence:.99,onField:true}]},{clubTeam:'CAY',bindingState,participation});
  assert.equal(noTime.status,'UNAVAILABLE');
  assert.equal(noTime.reason,'NO_VALID_ON_FIELD_PLAYER');
  assert.equal(noTime.rosterGuard.rejectedReasons.CLUB_PARTICIPATION_TIME_MISSING,1);

  const beforeSub=Bridge.inferOwner({time:.9,ball:{pitchX:10,pitchY:10,confidence:.95},players:[{id:'track-9',team:'CAY',pitchX:10.1,pitchY:10,confidence:.99,onField:true}]},{clubTeam:'CAY',bindingState,participation});
  assert.equal(beforeSub.status,'OWNED');
  assert.equal(beforeSub.playerId,'cay-9');

  const afterSub=Bridge.inferOwner({time:1.1,ball:{pitchX:10,pitchY:10,confidence:.95},players:[{id:'track-9',team:'CAY',pitchX:10.1,pitchY:10,confidence:.99,onField:true}]},{clubTeam:'CAY',bindingState,participation});
  assert.equal(afterSub.status,'UNAVAILABLE');
  assert.equal(afterSub.reason,'NO_VALID_ON_FIELD_PLAYER');
  assert.equal(afterSub.rosterGuard.rejectedReasons.CLUB_TRACK_OUTSIDE_CONFIRMED_PARTICIPATION,1);
}

console.log('ball roster ownership bridge non-regression: PASS');
