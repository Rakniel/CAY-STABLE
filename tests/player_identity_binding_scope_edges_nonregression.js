'use strict';
const assert=require('assert');
const Session=require('../player_identity_binding_session_v1.js');
const team={id:'cay',roster:[{id:'p1',displayName:'A',number:1,primaryPosition:'GK'},{id:'p2',displayName:'B',number:2,primaryPosition:'CB'},{id:'p3',displayName:'C',number:3,primaryPosition:'ST'}]};
const b=(trackId,playerId,confidence=1)=>({trackId,playerId,validated:true,confidence,source:'coach_click'});
for(const invalid of [null,{},'invalid',42,false]){
 const s=Session.createSession({team,tracks:[{id:4}],bindings:invalid});
 assert.strictEqual(s.summary().linked,0);
 assert.strictEqual(s.summary().unlinked,1);
 assert.deepStrictEqual(s.exportBindings(),[]);
}
const s=Session.createSession({team,tracks:[{id:'04'},{id:5},{id:'opponent-A'}],bindings:[
 b(100,'p1'),b(4,'p2'),b('5','p3'),b('opponent-A','p1'),b(999,'p3')
]});
assert.deepStrictEqual(s.trackIds,[4,5,'opponent-A']);
assert.strictEqual(s.summary().linked,3);
assert.strictEqual(s.summary().unlinked,0);
assert.strictEqual(s.summary().complete,true);
assert.deepStrictEqual(s.exportBindings().map(x=>x.trackId),[4,5,'opponent-A']);
assert.deepStrictEqual(s.candidates(4).map(x=>x.id),['p2']);
assert.strictEqual(s.assign(999,'p2',{confirmed:true}).reason,'UNKNOWN_TRACK');
const noTracks=Session.createSession({team,tracks:[],bindings:[b(100,'p1')]});
assert.strictEqual(noTracks.summary().complete,false);
assert.strictEqual(noTracks.summary().linked,0);
assert.deepStrictEqual(noTracks.exportBindings(),[]);
console.log('player identity scope edge non-regression: PASS');
