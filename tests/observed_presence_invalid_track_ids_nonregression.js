'use strict';
const assert=require('assert');
const Presence=require('../observed_presence_v1.js');
const Report=require('../observed_presence_report_v1.js');
const invalid=[null,'',false,true,0,-1,1.5,' ','x',9007199254740992,{},[],undefined,'-3','2.5','2e2'];
for(const id of invalid){
  const audit=Report.frameIdentityAudit({observedIds:[1,id,2]});
  assert.strictEqual(audit.valid,false,'invalid ID must quarantine entire frame');
  assert.strictEqual(audit.reason,'INVALID_TRACK_ID');
  assert.deepStrictEqual(audit.ids,[]);
  assert.strictEqual(audit.invalidIdCount,1);
}
assert.deepStrictEqual(Report.frameIdentityAudit({observedIds:[1,'2',3]}).ids,[1,2,3]);
assert.strictEqual(Report.frameIdentityAudit({observedIds:[1,'1']}).reason,'DUPLICATE_ID_SAME_FRAME');
assert.strictEqual(Report.frameIdentityAudit({observedIds:Array.from({length:12},(_,i)=>i+1)}).reason,'MORE_THAN_11_CAY_IDS');
const state=Presence.createState();
Presence.observeFrame(state,[{trackId:1,score:0.9}],0,{segment:1});
state.frames.push({time:1,segment:1,observedIds:[null,1],confidence:1});
const result=Report.buildPresenceReport(state,[{id:1,identityQuality:'FIABLE'}],{});
assert.strictEqual(result.invalidObservedInstants,1);
assert.strictEqual(result.observedPlayerSlots,1);
assert.strictEqual(result.possiblePlayerSlots,11);
assert.strictEqual(result.invalidFrameEvidence.invalidTrackIds,1);
assert.strictEqual(result.frames[1].presentCount,0);
assert.strictEqual(result.frames[1].presenceQuality,'INDISPONIBLE');
console.log('observed presence invalid track ids: PASS');
