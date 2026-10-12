'use strict';
const assert=require('assert');
const Gate=require('../first_results_readiness_v1.js');
const valid=(analysisId='match-1',inputFingerprint='video-1',coverage=0.85)=>({available:true,analysisId,inputFingerprint,coverage});
const all=()=>Object.fromEntries(Gate.REQUIRED.map(name=>[name,valid()]));

for(const coverage of [null,undefined,'','   ',false,true,[],{},-0.01,1.01,Infinity,NaN]){
  const input=all();input.heatmaps={...valid(),coverage};
  const result=Gate.evaluateFirstResults(input);
  assert.strictEqual(result.ready,false,`invalid coverage ${String(coverage)} must not publish first results`);
  assert.strictEqual(result.unavailable.find(x=>x.name==='heatmaps')?.reason,'COVERAGE_NOT_DEFENDABLE');
}
for(const provenance of [null,undefined,'','   ',{},[],false]){
  for(const key of ['analysisId','inputFingerprint']){
    const input=all();input.trajectories[key]=provenance;
    const result=Gate.evaluateFirstResults(input);
    assert.strictEqual(result.ready,false,`invalid ${key} must not publish`);
    assert.strictEqual(result.unavailable.find(x=>x.name==='trajectories')?.reason,'PROVENANCE_INCOMPLETE');
  }
}
{
  const input=all();input.heatmaps.analysisId='match-OTHER';
  const result=Gate.evaluateFirstResults(input);
  assert.strictEqual(result.ready,false,'mixed analyses cannot publish combined first results');
  assert.strictEqual(result.unavailable.find(x=>x.name==='heatmaps')?.reason,'ANALYSIS_ID_MISMATCH');
}
{
  const input=all();input.heatmaps.inputFingerprint='heatmap-stage-v2';
  assert.strictEqual(Gate.evaluateFirstResults(input).ready,true,'stage-specific fingerprints need not match');
}
for(const threshold of [null,'', '  ',false,[],{}]){
  assert.throws(()=>Gate.evaluateFirstResults(all(),{minCoverage:threshold}),/minCoverage/);
}
assert.strictEqual(Gate.evaluateFirstResults(all(),{minCoverage:'0.8'}).ready,true,'numeric-string threshold remains compatible');
assert.strictEqual(Gate.evaluateFirstResults(all()).ready,true);
console.log('first results provenance integrity non-regression: PASS');
