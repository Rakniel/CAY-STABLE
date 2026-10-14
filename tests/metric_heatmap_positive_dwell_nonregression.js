'use strict';
const assert=require('node:assert/strict');
const Heat=require('../metric_pitch_heatmap_v1.js');
const projector={validated:true,confidence:1,project:p=>({x:p.x*105,y:p.y*68})};
const projectors={1:projector,2:projector};
const p=(time,segment,x,y)=>({time,segment,x,y});
const rejected=[
  ['gap',[p(0,1,.1,.1),p(5,1,.1,.1)],{maxDwellGapSec:1,minTemporalCoverage:0}],
  ['camera cut',[p(0,1,.1,.1),p(.5,2,.1,.1)],{minTemporalCoverage:0}],
  ['teleport',[p(0,1,.1,.1),p(.1,1,.9,.9)],{minTemporalCoverage:0}]
];
for(let repeat=0;repeat<5;repeat++){
  for(const [label,path,options] of rejected){
    const result=Heat.build({fullPath:path},projectors,options);
    assert.equal(result.projectedIntervalSeconds,0,label);
    assert.equal(result.status,'INDISPONIBLE',label);
    assert.equal(result.reason,'aucun intervalle temporel métrique continu et plausible',label);
    assert.equal(result.projectedPoints.length,0,label);
    assert.equal(result.quality,'INDISPONIBLE',label);
  }
  const valid=Heat.build({fullPath:[p(0,1,.1,.1),p(.5,1,.105,.105)]},projectors,{minTemporalCoverage:0});
  assert.equal(valid.status,'DISPONIBLE');
  assert.equal(valid.projectedIntervalSeconds,.5);
  assert.equal(valid.heatmapBasis,'TIME_SECONDS');
  const defaultGap=Heat.build({fullPath:[p(0,1,.1,.1),p(5,1,.1,.1)]},projectors,{maxDwellGapSec:1});
  assert.equal(defaultGap.status,'INDISPONIBLE');
  assert.match(defaultGap.reason,/couverture temporelle insuffisante/);
}
console.log('metric_heatmap_positive_dwell_nonregression: PASS');
