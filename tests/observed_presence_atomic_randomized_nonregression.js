'use strict';
const assert=require('node:assert/strict');
const Presence=require('../observed_presence_v1.js');
const Report=require('../observed_presence_report_v1.js');
let seed=0xC0FFEE,checks=0;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const state=Presence.createState();
let expectedValid=0,expectedInvalid=0,expectedSlots=0;
for(let frameNo=0;frameNo<1500;frameNo++){
  const n=Math.floor(random()*15),assignments=[];
  for(let j=0;j<n;j++){
    const r=random();
    let id=r<.05?null:r<.1?'':r<.15?0:1+Math.floor(random()*25);
    if(r>.15&&r<.22&&assignments.length)id=assignments[0].trackId;
    assignments.push({trackId:id,score:random()});
  }
  const ids=assignments.map(a=>Presence.normalizeTrackId(a.trackId));
  const valid=ids.every(id=>id!==null)&&new Set(ids).size===ids.length&&ids.length<=11;
  const previousSize=state.players.size,previousMax=state.maxObserved;
  const frame=Presence.observeFrame(state,assignments,frameNo,{segment:1+(frameNo%4)});
  assert.equal(frame.observedCount,valid?n:0);checks++;
  assert.equal(frame.observedIds.length,valid?n:0);checks++;
  if(valid){expectedValid++;expectedSlots+=n;assert.equal(new Set(frame.observedIds).size,n);checks++;}
  else{expectedInvalid++;assert.equal(frame.quality,'INDISPONIBLE');assert.equal(state.players.size,previousSize);assert.equal(state.maxObserved,previousMax);checks+=3;}
}
const report=Report.buildPresenceReport(state,[],{});
assert.equal(report.observedInstants,1500);checks++;
assert.equal(report.validObservedInstants,expectedValid);checks++;
assert.equal(report.invalidObservedInstants,expectedInvalid);checks++;
assert.equal(report.observedPlayerSlots,expectedSlots);checks++;
assert.equal(report.possiblePlayerSlots,expectedValid*11);checks++;
assert.equal(report.frames.filter(f=>!f.frameEvidenceValid).length,expectedInvalid);checks++;
assert.ok(state.maxObserved<=11);checks++;
console.log(`RUN33 atomic property: PASS (${checks} assertions; valid=${expectedValid}, invalid=${expectedInvalid})`);
