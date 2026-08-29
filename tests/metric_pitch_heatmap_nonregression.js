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
assert.equal(onlyFirst.heatmapBasis,'TIME_SECONDS');
assert.equal(onlyFirst.projectedIntervalSeconds,1);
assert.equal(onlyFirst.temporalCoverage,.5);

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

const irregular=Heat.build({fullPath:[
  {time:0,segment:1,x:.05,y:.05},
  {time:.1,segment:1,x:.05,y:.05},
  {time:.2,segment:1,x:.05,y:.05},
  {time:1.2,segment:1,x:.75,y:.75},
  {time:2.2,segment:1,x:.75,y:.75}
]},{1:projector(1)},{cols:2,rows:2,maxDwellGapSec:2});
assert.equal(irregular.heatmapBasis,'TIME_SECONDS');
assert.equal(irregular.projectedIntervalSeconds,2.2);
assert(Math.abs(irregular.normalizedCells[0][0]-(1.2/2.2))<1e-5);
assert(Math.abs(irregular.normalizedCells[1][1]-(1/2.2))<1e-5);
assert.notDeepEqual(irregular.normalizedCells,irregular.normalizedObservationCells);

const cutGap=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.1},
  {time:5,segment:1,x:.9,y:.9}
]},{1:projector(1)},{maxDwellGapSec:1});
assert.equal(cutGap.heatmapBasis,'OBSERVATIONS');
assert.equal(cutGap.projectedIntervalSeconds,0);
assert.equal(cutGap.eligibleIntervalSeconds,5);
assert.equal(cutGap.temporalCoverage,0);
assert.equal(cutGap.unobservedGapSeconds,5);
assert.equal(cutGap.gapBreaks,1);

const mixedGap=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.1},
  {time:.5,segment:1,x:.2,y:.2},
  {time:3,segment:1,x:.7,y:.7},
  {time:3.5,segment:1,x:.8,y:.8}
]},{1:projector(1)},{maxDwellGapSec:1});
assert.equal(mixedGap.projectedIntervalSeconds,1);
assert.equal(mixedGap.eligibleIntervalSeconds,3.5);
assert.equal(mixedGap.unobservedGapSeconds,2.5);
assert.equal(mixedGap.gapBreaks,1);
assert.equal(mixedGap.temporalCoverage,.2857);
assert(mixedGap.temporalCoverage<1,'a long tracking gap must reduce temporal coverage instead of disappearing from its denominator');

const segmentCut=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.1},
  {time:.5,segment:2,x:.9,y:.9}
]},{1:projector(1),2:projector(2)},{maxDwellGapSec:1});
assert.equal(segmentCut.heatmapBasis,'OBSERVATIONS');
assert.equal(segmentCut.projectedIntervalSeconds,0);

console.log('metric_pitch_heatmap_nonregression: OK');
