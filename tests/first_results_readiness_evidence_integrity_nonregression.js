'use strict';
const assert=require('assert');
const gate=require('../first_results_readiness_v1.js');
const artifact=()=>({available:true,coverage:1,analysisId:'analysis-A',inputFingerprint:'stage-fingerprint'});
const all=()=>Object.fromEntries(gate.REQUIRED.map(name=>[name,artifact()]));
for(const invalid of [null,undefined,'',' ',false,true,[],{},NaN,Infinity,-Infinity,-0.1,1.01]){
  const data=all();data.heatmaps.coverage=invalid;
  const check=gate.evaluateFirstResults(data).checks.find(x=>x.name==='heatmaps');
  assert.strictEqual(check.ready,false,'coverage accepted: '+String(invalid));
  assert.strictEqual(check.reason,'COVERAGE_NOT_DEFENDABLE');
}
for(const invalid of [null,undefined,'',' ',[],{},NaN,Infinity]){
  for(const field of ['analysisId','inputFingerprint']){
    const data=all();data.trajectories[field]=invalid;
    const check=gate.evaluateFirstResults(data).checks.find(x=>x.name==='trajectories');
    assert.strictEqual(check.ready,false,field+' accepted: '+String(invalid));
    assert.strictEqual(check.reason,'PROVENANCE_INCOMPLETE');
  }
}
for(const invalid of [null,'',false,[],{},NaN,Infinity,-0.01,1.01]){
  assert.throws(()=>gate.evaluateFirstResults(all(),{minCoverage:invalid}),/minCoverage/);
}
{
  const data=all();data.heatmaps.analysisId='analysis-B';
  const result=gate.evaluateFirstResults(data);
  assert.strictEqual(result.ready,false);
  assert.deepStrictEqual(result.unavailable,[{name:'heatmaps',reason:'ANALYSIS_ID_MISMATCH'}]);
}
{
  const data=all();data.trajectories.inputFingerprint='stage-specific-fingerprint';
  assert.strictEqual(gate.evaluateFirstResults(data,{minCoverage:0.8}).ready,true);
}
{
  const data=all();data.coverage.coverage='0.75';
  assert.strictEqual(gate.evaluateFirstResults(data,{minCoverage:0.75}).ready,true);
  assert.strictEqual(gate.evaluateFirstResults(data,{minCoverage:0.76}).ready,false);
}
{
  const data=all();data.tracking.analysisId=' analysis-A ';
  assert.strictEqual(gate.evaluateFirstResults(data).ready,true);
}
console.log('first results evidence integrity non-regression: PASS');
