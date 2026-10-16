'use strict';
const assert=require('node:assert/strict');
const Presence=require('../observed_presence_v1.js');
const Report=require('../observed_presence_report_v1.js');
let checks=0;
for(let repeat=0;repeat<3;repeat++){
 const state=Presence.createState();
 const rejected=Presence.observeFrame(state,[{trackId:77,score:.99},{trackId:true,score:.88}],1,{segment:2});
 assert.deepEqual(rejected.observedIds,[]);checks++;
 assert.equal(rejected.observedCount,0);checks++;
 assert.equal(rejected.quality,'INDISPONIBLE');checks++;
 assert.equal(rejected.rejectedInvalidIds,1);checks++;
 assert.equal(state.players.size,0);checks++;
 assert.equal(state.maxObserved,0);checks++;
 const r=Report.buildPresenceReport(state,[{id:77,identityQuality:'FIABLE'}],{});
 assert.equal(r.invalidObservedInstants,1);checks++;
 assert.equal(r.rosterSize,0);checks++;
 assert.equal(r.observedPlayerSlots,0);checks++;
 Presence.observeFrame(state,[{trackId:77,score:.95}],2,{segment:2});
 assert.equal(state.players.get(77).firstObserved,2);checks++;
 assert.equal(Presence.summarize(state).rosterSize,1);checks++;
 const good=Report.buildPresenceReport(state,[{id:77,identityQuality:'FIABLE'}],{});
 assert.equal(good.validObservedInstants,1);checks++;
 assert.equal(good.possiblePlayerSlots,11);checks++;
}
console.log(`atomic invalid-frame presence: PASS (${checks} assertions)`);
