'use strict';
const assert=require('assert');
const gate=require('../first_results_readiness_v1.js');

const artifact=(coverage=1)=>({available:true,coverage,analysisId:'analysis-1',inputFingerprint:'video-1'});
const all=()=>Object.fromEntries(gate.REQUIRED.map(name=>[name,artifact()]));

{
  const result=gate.evaluateFirstResults(all(),{minCoverage:0.8});
  assert.strictEqual(result.ready,true);
  assert.strictEqual(result.status,'PREMIERS_RESULTATS_PRETS');
}
{
  const input=all(); delete input.tracking;
  const result=gate.evaluateFirstResults(input,{minCoverage:0.8});
  assert.strictEqual(result.ready,false);
  assert.deepStrictEqual(result.unavailable,[{name:'tracking',reason:'MISSING'}]);
}
{
  const input=all(); input.heatmaps=artifact(0.5);
  const result=gate.evaluateFirstResults(input,{minCoverage:0.8});
  assert.strictEqual(result.ready,false);
  assert.strictEqual(result.unavailable[0].reason,'COVERAGE_BELOW_THRESHOLD');
}
{
  const input=all(); input.trajectories={available:true,coverage:1,analysisId:'analysis-1'};
  const result=gate.evaluateFirstResults(input);
  assert.strictEqual(result.ready,false);
  assert.strictEqual(result.unavailable[0].reason,'PROVENANCE_INCOMPLETE');
}
{
  const input=all(); input.coverage={available:false,reason:'CALIBRATION_INSUFFISANTE'};
  const result=gate.evaluateFirstResults(input);
  assert.strictEqual(result.ready,false);
  assert.strictEqual(result.unavailable[0].reason,'CALIBRATION_INSUFFISANTE');
}
assert.throws(()=>gate.evaluateFirstResults(all(),{minCoverage:1.2}),/minCoverage/);
console.log('first results readiness non-regression: PASS');
