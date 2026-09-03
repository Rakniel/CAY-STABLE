'use strict';
const assert=require('assert');
const Session=require('../player_identity_binding_session_v1.js');

const team={
  id:'team_cay',name:'C.A. Yenne Senior',category:'SENIOR',
  roster:[
    {id:'p9',displayName:'Avant Centre',number:9,primaryPosition:'ST'},
    {id:'p1',displayName:'Gardien',number:1,primaryPosition:'GK'},
    {id:'p5',displayName:'Milieu',number:5,primaryPosition:'CM'}
  ]
};

assert.deepStrictEqual(Session.normalizeTrackIds([{id:7},{trackId:'7'},8,8,null]),[7,8], 'numeric string track IDs normalize to the same stable numeric ID and duplicates are removed');

const s=Session.createSession({team,tracks:[{id:7},{id:8},{id:9}],bindings:[{trackId:7,playerId:'p1',validated:true,confidence:1,source:'seed'}]});
assert.deepStrictEqual(s.candidates(8).map(x=>x.number),[5,9], 'claimed roster player is not offered to another track; remaining players sorted by shirt number');
assert.strictEqual(s.assign(8,'p5').reason,'EXPLICIT_CONFIRMATION_REQUIRED');
assert.strictEqual(s.assign(99,'p5',{confirmed:true}).reason,'UNKNOWN_TRACK');
assert.strictEqual(s.assign(8,'missing',{confirmed:true}).reason,'UNKNOWN_ROSTER_PLAYER');

const linked=s.assign(8,'p5',{confirmed:true,source:'coach_click'});
assert.strictEqual(linked.accepted,true);
assert.strictEqual(linked.binding.validated,true);
assert.strictEqual(linked.binding.confidence,1);
assert.strictEqual(linked.binding.source,'coach_click');
assert.strictEqual(s.summary().linked,2);
assert.strictEqual(s.summary().unlinked,1);

const conflict=s.assign(9,'p5',{confirmed:true});
assert.strictEqual(conflict.accepted,false);
assert.strictEqual(conflict.reason,'PLAYER_ALREADY_BOUND');
assert.strictEqual(conflict.conflictTrackId,8);
assert(s.exportBindings().some(b=>b.trackId===8&&b.playerId==='p5'),'conflict must not steal an existing identity');

const replaced=s.assign(9,'p5',{confirmed:true,replaceExisting:true,source:'coach_reassign'});
assert.strictEqual(replaced.accepted,true);
assert.strictEqual(replaced.replacedTrackId,8);
assert(!s.exportBindings().some(b=>b.trackId===8),'explicit replacement removes old track binding');
assert(s.exportBindings().some(b=>b.trackId===9&&b.playerId==='p5'));

assert.strictEqual(s.unassign(9).removed,true);
assert.strictEqual(s.unassign(9).reason,'NOT_BOUND');
assert.strictEqual(s.summary().requiresExplicitConfirmation,true);
assert(s.summary().policy.includes('AUCUNE_IDENTITÉ_AUTOMATIQUE'));
assert.strictEqual(s.summary().version,1);

console.log('player identity binding session non-regression: PASS');
