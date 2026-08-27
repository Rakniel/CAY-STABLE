'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

function projector(segment){
  return {validated:true,segment,project:p=>({x:p.x*105,y:p.y*68})};
}

const track={fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:1,segment:1,x:.20,y:.20},
  {time:2,segment:2,x:.70,y:.70},
  {time:3,segment:2,x:.90,y:.90}
]};

const onlyFirst=Heat.build(track,{1:projector(1)},{cols:6,rows:4,minMetricCoverage:.35});
assert.equal(onlyFirst.status,'DISPONIBLE');
assert.equal(onlyFirst.metricCoverage,.5);
assert.equal(onlyFirst.observations,2);
assert.equal(onlyFirst.coordinateSystem,'PITCH_METERS');
assert.equal(onlyFirst.policy,'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN');
assert.equal(onlyFirst.projectedPoints.length,2);
assert(Math.abs(onlyFirst.normalizedCells.flat().reduce((a,b)=>a+b,0)-1)<1e-5);

const strict=Heat.build(track,{1:projector(1)},{minMetricCoverage:.8});
assert.equal(strict.status,'INDISPONIBLE');
assert.equal(strict.projectedPoints.length,0);
assert(/couverture métrique insuffisante/.test(strict.reason));

const none=Heat.build(track,{},{});
assert.equal(none.status,'INDISPONIBLE');
assert.equal(none.observations,0);
assert.equal(none.metricCoverage,0);

const outside=Heat.build({fullPath:[{time:0,segment:1,x:.5,y:.5}]},{1:{validated:true,project:()=>({x:999,y:999})}},{});
assert.equal(outside.status,'INDISPONIBLE');
assert.equal(outside.rejectedObservations,1);

console.log('metric_pitch_heatmap_nonregression: OK');
