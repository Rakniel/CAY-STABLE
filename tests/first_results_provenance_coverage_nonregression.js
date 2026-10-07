'use strict';
const assert=require('assert');
const gate=require('../first_results_readiness_v1.js');
const artifact=(coverage=1)=>({available:true,coverage,analysisId:'analysis-1',inputFingerprint:'stage-input'});
const all=()=>Object.fromEntries(gate.REQUIRED.map(name=>[name,artifact()]));
const unavailableReason=(input,name)=>gate.evaluateFirstResults(input).unavailable.find(x=>x.name===name)?.reason;
for(const bad of [null,undefined,'','  ',NaN,Infinity,false,[],{}]){
  const input=all();input.heatmaps.coverage=bad;
  assert.strictEqual(unavailableReason(input,'heatmaps'),'COVERAGE_NOT_DEFENDABLE',`invalid coverage ${String(bad)}`);
}
{
  const input=all();input.heatmaps.coverage=0;
  assert.strictEqual(unavailableReason(input,'heatmaps'),'COVERAGE_EMPTY','zero heatmap coverage must not publish ready');
}
for(const bad of ['', '   ', null, undefined]){
  const input=all();input.tracking.analysisId=bad;
  assert.strictEqual(unavailableReason(input,'tracking'),'PROVENANCE_INCOMPLETE');
  input.tracking.analysisId='analysis-1';input.tracking.inputFingerprint=bad;
  assert.strictEqual(unavailableReason(input,'tracking'),'PROVENANCE_INCOMPLETE');
}
{
  const input=all();input.heatmaps.analysisId='another-match';
  assert.strictEqual(unavailableReason(input,'heatmaps'),'ANALYSIS_ID_MISMATCH','do not mix heatmaps from another match');
}
{
  const input=all();input.heatmaps.inputFingerprint='heatmap-stage-v2';
  assert.strictEqual(gate.evaluateFirstResults(input).ready,true,'different stage fingerprints are legitimate');
}
for(const invalid of [null,'',false])assert.throws(()=>gate.evaluateFirstResults(all(),{minCoverage:invalid}),/minCoverage/);
assert.strictEqual(gate.evaluateFirstResults(all()).ready,true);
console.log('first results provenance and coverage non-regression: PASS');
