const assert=require('assert');
const {validatePassKick,filterPassEvents}=require('../ball_kick_evidence_v1.js');
const player=(id,x)=>({id,team:'CAY',pitchX:x,pitchY:20,confidence:.95,onField:true});
const row=(time,bx,px,segment)=>({time,...(segment?{segment}:{}),ball:{pitchX:bx,pitchY:20,confidence:.95,valid:true,visible:true},players:[player('P1',px),player('P2',20)]});
const event={type:'PASS',time:1.0,transitionSec:.5,fromPlayerId:'P1',toPlayerId:'P2'};
const good=[row(.2,10,10),row(.4,10.2,10.1),row(.5,10.3,10.2),row(.6,11.3,10.3),row(.7,12.4,10.4),row(.9,16,10.6),row(1.0,20,20)];
const e=validatePassKick(good,event,{windowSec:.45,minReleaseSpeedMps:3,minSpeedGainMps:1.2,minSeparationGainM:.7});
assert.strictEqual(e.status,'CONFIRMED');
assert.ok(e.releaseSpeedMps>=3);
assert.ok(e.speedGainMps>=1.2);
assert.ok(e.separationGainM>=.7);
assert.strictEqual(e.continuityRejectedPairs,0);
const weak=[row(.2,10,10),row(.4,10.1,10.05),row(.5,10.2,10.1),row(.6,10.3,10.15),row(.7,10.4,10.2),row(.9,10.6,10.3),row(1.0,10.7,10.4)];
assert.strictEqual(validatePassKick(weak,event,{windowSec:.45}).status,'REJECTED');
assert.strictEqual(validatePassKick(good,{type:'PASS',time:1},{}).status,'INDISPONIBLE');
const cutSpike=[
  row(.2,10,10,'PLAN_A'),row(.4,10.1,10.05,'PLAN_A'),row(.5,10.2,10.1,'PLAN_A'),
  row(.6,14.0,10.2,'PLAN_B'),row(.7,14.1,10.25,'PLAN_B'),row(.8,14.2,10.3,'PLAN_B'),row(.9,14.3,10.35,'PLAN_B')
];
const cutEvidence=validatePassKick(cutSpike,event,{windowSec:.45,minReleaseSpeedMps:3,minSpeedGainMps:1.2,minSeparationGainM:.7});
assert.notStrictEqual(cutEvidence.status,'CONFIRMED','camera-cut displacement must never confirm a kick');
assert.ok(cutEvidence.continuityRejectedPairs>=1,'camera-cut pair must be audited as rejected');
const longGap=[row(.2,10,10,'PLAN_A'),row(.3,10.1,10.05,'PLAN_A'),row(.4,10.2,10.1,'PLAN_A'),row(1.3,15,10.2,'PLAN_A'),row(1.4,15.1,10.25,'PLAN_A')];
const longGapEvent={...event,time:1.3,transitionSec:.9};
const gapEvidence=validatePassKick(longGap,longGapEvent,{windowSec:1,minReleaseSpeedMps:3,minSpeedGainMps:1.2,minSeparationGainM:.7,maxObservationGapSec:.75});
assert.notStrictEqual(gapEvidence.status,'CONFIRMED','long tracking gap must never confirm a kick');
assert.ok(gapEvidence.continuityRejectedPairs>=1,'long-gap pair must be audited as rejected');
const analysis={quality:'FIABLE',passes:1,events:[event,{type:'TURNOVER',time:2}]};
const filtered=filterPassEvents(good,analysis,{windowSec:.45,minSeparationGainM:.7});
assert.strictEqual(filtered.passes,1);
assert.strictEqual(filtered.kickEvidenceRejectedPasses,0);
assert.strictEqual(filtered.events.filter(x=>x.type==='PASS')[0].kickEvidence.status,'CONFIRMED');
const filteredWeak=filterPassEvents(weak,analysis,{});
assert.strictEqual(filteredWeak.passes,0);
assert.strictEqual(filteredWeak.kickEvidenceRejectedPasses,1);
assert.strictEqual(filteredWeak.events.length,1);
const unavailable=filterPassEvents(good,{quality:'INDISPONIBLE',passes:'INDISPONIBLE',events:[]},{});
assert.strictEqual(unavailable.kickEvidenceQuality,'INDISPONIBLE');
console.log('ball_kick_evidence_nonregression: PASS');
