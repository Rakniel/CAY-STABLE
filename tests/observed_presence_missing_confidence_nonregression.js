const assert=require('assert');
const Presence=require('../observed_presence_v1.js');
const Report=require('../observed_presence_report_v1.js');

const cards=[{id:1,identityQuality:'FIABLE'}];

{
  const state=Presence.createState();
  Presence.observeFrame(state,[{trackId:1}],0,{segment:1});
  const report=Report.buildPresenceReport(state,cards,{});
  assert.strictEqual(state.frames[0].confidence,null,'fixture must expose missing confidence');
  assert.strictEqual(report.frames[0].observationConfidence,null,'missing frame confidence must remain unavailable');
  assert.strictEqual(report.observationConfidence,null,'missing confidence must not become an artificial 0 average');
}

{
  const state=Presence.createState();
  Presence.observeFrame(state,[{trackId:1,score:0}],0,{segment:1});
  const report=Report.buildPresenceReport(state,cards,{});
  assert.strictEqual(report.frames[0].observationConfidence,0,'explicit numeric zero remains valid evidence');
  assert.strictEqual(report.observationConfidence,0,'explicit numeric zero remains in the average');
}

{
  const state=Presence.createState();
  Presence.observeFrame(state,[{trackId:1,score:.8}],0,{segment:1});
  state.frames[0].confidence='   ';
  const report=Report.buildPresenceReport(state,cards,{});
  assert.strictEqual(report.frames[0].observationConfidence,null,'blank confidence metadata must remain unavailable');
  assert.strictEqual(report.observationConfidence,null,'blank confidence must not lower the average to zero');
}

console.log('observed presence missing-confidence non-regression OK');
