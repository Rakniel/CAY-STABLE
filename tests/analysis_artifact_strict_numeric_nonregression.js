'use strict';
const assert=require('node:assert/strict');
const Artifact=require('../analysis_artifact_contract_v1.js');
const raw={stage:'tracking_v1',schemaVersion:'1',analysisId:'cay-match-1',inputFingerprint:'detector-v1'};
const invalid=[true,false,[],[0.8],{},new Number(0.8),{valueOf:()=>0.8}];
for(const value of invalid){
  const result=Artifact.createArtifactDescriptor({...raw,coverage:value,confidence:value});
  assert.strictEqual(result.coverage,null,'coerced coverage must not become evidence');
  assert.strictEqual(result.confidence,null,'coerced confidence must not become evidence');
}
for(const value of [0,0.8,1,'0.8',1.2,-0.2]){
  const result=Artifact.createArtifactDescriptor({...raw,coverage:value,confidence:value});
  assert.strictEqual(result.coverage,Math.max(0,Math.min(1,Number(value))));
  assert.strictEqual(result.confidence,Math.max(0,Math.min(1,Number(value))));
}
for(const value of [true,false,[],[105],{},NaN,Infinity,new Number(105)]){
  assert.throws(
    ()=>Artifact.normalizeSpatialReference({coordinateSystem:'PITCH_METERS',pitchLengthM:value,pitchWidthM:68}),
    /pitch dimensions must be finite numbers/,
    'invalid explicit pitch dimension must not silently disappear'
  );
}
for(const value of [true,false,[],[68],{},NaN,Infinity]){
  assert.throws(
    ()=>Artifact.normalizeSpatialReference({coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:value}),
    /pitch dimensions must be finite numbers/
  );
}
const valid=Artifact.normalizeSpatialReference({coordinateSystem:'PITCH_METERS',pitchLengthM:'105',pitchWidthM:68});
assert.strictEqual(valid.pitchLengthM,105);
assert.strictEqual(valid.pitchWidthM,68);
console.log('analysis artifact strict numeric evidence non-regression: PASS');
