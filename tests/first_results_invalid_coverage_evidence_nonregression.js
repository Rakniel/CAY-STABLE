'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');
const coverageFields=['trackingPct','pitchSpatialPct','physicalMetricPct'];
const durationFields=['participationSeconds','renderedSeconds'];
const card=(value)=>({firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true},presence:{trackingCoverage:value},pitchVisuals:{spatialCoverage:value,physicalMetricCoverage:value,participationSeconds:value,renderedSeconds:value}});
for(const value of [null,undefined,'',' ',NaN,Infinity,-Infinity,-.01,100.01,true,false,{},[]]){
  const evidence=Gate.coverageEvidence(card(value));
  for(const key of coverageFields)assert.strictEqual(evidence[key],null,'invalid coverage must remain unknown: '+key);
}
for(const value of [null,undefined,'',' ',NaN,Infinity,-Infinity,-.01,true,false,{},[]]){
  const evidence=Gate.coverageEvidence(card(value));
  for(const key of durationFields)assert.strictEqual(evidence[key],null,'invalid duration must remain unknown: '+key);
}
for(const value of [0,1,50.5,100,'50']){
  const evidence=Gate.coverageEvidence(card(value));
  for(const key of [...coverageFields,...durationFields])assert.strictEqual(evidence[key],Number(value),'valid evidence must remain unchanged: '+key);
}
const summary=Gate.summarizeCoverage([
  {tracking:true,coverage:{trackingPct:101,participationSeconds:10}},
  {tracking:true,coverage:{trackingPct:80,participationSeconds:10}}
],'trackingPct','tracking');
assert.strictEqual(summary.knownPlayers,1);
assert.strictEqual(summary.unknownPlayers,1);
assert.strictEqual(summary.avgPct,80);
const evaluation=Gate.evaluate({players:[card(125)]});
assert.strictEqual(evaluation.status,'PHYSICAL_TESTABLE','coverage audit must not promote or demote independently validated readiness');
assert.strictEqual(evaluation.coverageSummary.tracking.knownPlayers,0);
console.log('first-results invalid coverage evidence non-regression: PASS');
