'use strict';
const assert=require('node:assert/strict');
const Provider=require('../camera_motion_artifact_provider_v1.js');
const base={contractVersion:Provider.VERSION,provenance:{source:'CAY internal camera motion',license:'CAY-INTERNAL',kind:'internal',revision:'RUN90'},samples:[{segment:0,anchorTime:1,time:1.03,matrix:[1,0,3,0,1,1],confidence:.95,support:40,inlierRatio:.9,residual:.005,forwardBackwardErrorPx:.4}]};
let checks=0;
function check(condition,label){assert.ok(condition,label);checks++;}
for(let round=0;round<3;round++){
  check(Provider.validateArtifact(base).ok,'valid sample');
  const invalid=[['confidence',1.5],['confidence',-.1],['inlierRatio',1.2],['inlierRatio',-.1],['support',-5],['residual',-.2],['forwardBackwardErrorPx',-1],['pitchLineAlignmentErrorPx',-1],['confidence','NaN'],['residual',null],['confidence',true],['support',false],['inlierRatio',[]],['residual',{}],['confidence','  '],['support',Infinity]];
  for(const [field,value] of invalid){
    const result=Provider.validateArtifact({...base,samples:[{...base.samples[0],[field]:value}]});
    check(result.reason==='CAMERA_MOTION_ARTIFACT_EVIDENCE_INVALID'&&result.evidenceField===field,'reject '+field+': '+String(value));
  }
  const dup=Provider.validateArtifact({...base,samples:[base.samples[0],{...base.samples[0],matrix:[1,0,9,0,1,1]}]});
  check(dup.reason==='CAMERA_MOTION_ARTIFACT_DUPLICATE_SAMPLE','reject ambiguous duplicate');
  for(const change of [{segment:1},{anchorTime:.99},{time:1.04}]){
    check(Provider.validateArtifact({...base,samples:[base.samples[0],{...base.samples[0],...change}]}).ok,'allow distinct sample');
  }
  check(Provider.validateArtifact({...base,samples:[{...base.samples[0],confidence:'0.7',support:'10'}]}).ok,'allow numeric strings');
  check(Provider.validateArtifact({...base,samples:[{...base.samples[0],confidence:0,inlierRatio:1,support:0}]}).ok,'allow boundary values');
}
console.log('RUN90 camera-motion evidence: '+checks+' checks PASS');
