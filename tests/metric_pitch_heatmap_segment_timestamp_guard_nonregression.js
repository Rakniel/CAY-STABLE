'use strict';
const assert=require('node:assert/strict');
const Heat=require('../metric_pitch_heatmap_v1.js');
const projector={validated:true,confidence:1,project:p=>({x:Number(p.x)*105,y:Number(p.y)*68})};
const projectors={1:projector,'-1':projector,'0.5':projector};
const build=points=>Heat.build({fullPath:points},projectors);
for(let repeat=0;repeat<5;repeat++){
  for(const [time,segment] of [[-1,1],[-2,1],[0,-1],[0,.5],[0,'-1'],[0,'0.5'],[0,9007199254740992]]){
    const result=build([{time,segment,x:.2,y:.2},{time:time+.5,segment,x:.2,y:.2}]);
    assert.equal(result.status,'INDISPONIBLE');
    assert.equal(result.projectedIntervalSeconds,0);
  }
  const valid=build([{time:0,segment:1,x:.2,y:.2},{time:.5,segment:1,x:.2,y:.2}]);
  assert.equal(valid.status,'DISPONIBLE');
  assert.equal(valid.projectedIntervalSeconds,.5);
  const legacy=build([{time:'0',segment:'1',x:'.2',y:'.2'},{time:'.5',segment:'1',x:'.2',y:'.2'}]);
  assert.equal(legacy.status,'DISPONIBLE');
}
console.log('metric_pitch_heatmap_segment_timestamp_guard_nonregression: PASS');
