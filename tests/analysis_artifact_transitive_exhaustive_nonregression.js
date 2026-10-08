'use strict';
const assert=require('node:assert/strict');
const A=require('../analysis_artifact_contract_v1.js');
const artifacts={},expected={};
for(const stage of A.STAGES){
  artifacts[stage]=A.createArtifactDescriptor({stage,schemaVersion:'1',analysisId:'game-1',inputFingerprint:'fp-'+stage});
  expected[stage]={schemaVersion:'1',analysisId:'game-1',inputFingerprint:'fp-'+stage};
}
let cases=0;
for(let mask=0;mask<(1<<A.STAGES.length);mask++){
  for(let changedMask=0;changedMask<(1<<A.STAGES.length);changedMask++){
    const mutated={...artifacts};
    const explicit=[],stale=[];
    for(let i=0;i<A.STAGES.length;i++){
      const stage=A.STAGES[i];
      if(mask&(1<<i)){mutated[stage]={...mutated[stage],inputFingerprint:'old'};stale.push(stage);}
      if(changedMask&(1<<i))explicit.push(stage);
    }
    const wanted=new Set([...stale,...explicit].flatMap(stage=>A.invalidatedStages(stage)));
    const plan=A.planReuse(mutated,expected,explicit);
    assert.deepEqual(plan.recompute,A.STAGES.filter(stage=>wanted.has(stage)));
    assert.deepEqual(plan.reusable,A.STAGES.filter(stage=>!wanted.has(stage)));
    assert.deepEqual(new Set(plan.changed),wanted);
    cases++;
  }
}
console.log('exhaustive transitive invalidation PASS ('+cases+' combinations)');
