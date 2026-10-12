'use strict';
const assert=require('node:assert/strict');
const A=require('../analysis_artifact_contract_v1.js');
const artifacts={},expected={};
for(const stage of A.STAGES){
  artifacts[stage]=A.createArtifactDescriptor({stage,schemaVersion:'1',analysisId:'match-1',inputFingerprint:stage+'-input'});
  expected[stage]={schemaVersion:'1',analysisId:'match-1',inputFingerprint:stage+'-input'};
}
assert.deepStrictEqual(A.planReuse(artifacts,expected,[]).recompute,[]);
for(const stage of A.STAGES){
  const required=A.invalidatedStages(stage);
  const stale={...artifacts,[stage]:{...artifacts[stage],inputFingerprint:'stale'}};
  const result=A.planReuse(stale,expected,[]);
  assert.deepStrictEqual(result.recompute,required,'stale '+stage+' must invalidate all dependent artifacts');
  assert.deepStrictEqual(result.reusable,A.STAGES.filter(name=>!required.includes(name)));
  assert.deepStrictEqual(result.changed,[],'inferred invalidation is not an explicit change');
  const missing={...artifacts};delete missing[stage];
  assert.deepStrictEqual(A.planReuse(missing,expected,[]).recompute,required,'missing '+stage+' must invalidate downstream');
  assert.deepStrictEqual(A.planReuse(artifacts,expected,[stage]).recompute,required,'explicit change must still invalidate downstream');
}
const crossAnalysis={...artifacts,tracking_v1:{...artifacts.tracking_v1,analysisId:'another-match'}};
assert.deepStrictEqual(A.planReuse(crossAnalysis,expected,[]).recompute,A.invalidatedStages('tracking_v1'));
console.log('analysis artifact downstream staleness non-regression: PASS');
