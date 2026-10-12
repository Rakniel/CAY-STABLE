'use strict';
const assert=require('node:assert/strict');
const Heat=require('../metric_pitch_heatmap_v1.js');
const standard=[{time:0,segment:1,x:.2,y:.2},{time:.5,segment:1,x:.2,y:.2}];
const projectors={1:{validated:true,confidence:1,project:p=>({x:Number(p.x)*105,y:Number(p.y)*68})}};
const build=(fullPath,p=projectors)=>Heat.build({fullPath},p);
function check(label,points,projector,status,eligible,seconds){
  const r=build(points,projector);
  assert.equal(r.status,status,label+': status');
  assert.equal(r.eligibleObservations,eligible,label+': eligible observations');
  assert.equal(r.projectedIntervalSeconds,seconds,label+': defensible interval');
}
check('valid numeric',standard,projectors,'DISPONIBLE',2,.5);
check('boolean timestamps',[{time:false,segment:1,x:.2,y:.2},{time:true,segment:1,x:.2,y:.2}],projectors,'INDISPONIBLE',2,0);
check('boolean source x',[{time:0,segment:1,x:true,y:.2},{time:.5,segment:1,x:true,y:.2}],projectors,'INDISPONIBLE',0,0);
check('boolean projected coordinates',standard,{1:{validated:true,confidence:1,project:()=>({x:true,y:false})}},'INDISPONIBLE',2,0);
check('boolean calibration confidence',standard,{1:{validated:true,confidence:true,project:p=>({x:p.x*105,y:p.y*68})}},'INDISPONIBLE',2,.5);
check('boolean camera segment',[{time:0,segment:true,x:.2,y:.2},{time:.5,segment:true,x:.2,y:.2}],{true:{validated:true,confidence:1,project:p=>({x:p.x*105,y:p.y*68})}},'INDISPONIBLE',0,0);
check('numeric strings remain accepted',[{time:'0',segment:'1',x:'.2',y:'.2'},{time:'.5',segment:'1',x:'.2',y:'.2'}],projectors,'DISPONIBLE',2,.5);
console.log('metric_pitch_heatmap_strict_evidence_nonregression: PASS');
