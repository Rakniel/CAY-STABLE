'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');

function projector(segment){
  return {validated:true,segment,confidence:1,project:p=>({x:p.x*105,y:p.y*68})};
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
assert.equal(onlyFirst.timeAllocation,'LINEAR_PITCH_SEGMENT');
assert.equal(onlyFirst.projectedIntervalSeconds,1);
assert.equal(onlyFirst.temporalCoverage,.5);
assert.equal(onlyFirst.observationDefendableScore,.5);
assert.equal(onlyFirst.defendableScore,.25);
assert.equal(onlyFirst.quality,'PARTIEL');

const strict=Heat.build(track,{1:projector(1)},{minMetricCoverage:.8});
assert.equal(strict.status,'INDISPONIBLE');
assert.equal(strict.projectedPoints.length,0);
assert(/couverture métrique insuffisante/.test(strict.reason));

const none=Heat.build(track,{},{});
assert.equal(none.status,'INDISPONIBLE');
assert.equal(none.observations,0);
assert.equal(none.metricCoverage,0);

const outside=Heat.build({fullPath:[{time:0,segment:1,x:.5,y:.5}]},{1:{validated:true,confidence:1,project:()=>({x:999,y:999})}},{});
assert.equal(outside.status,'INDISPONIBLE');
assert.equal(outside.rejectedObservations,1);

const missingInput=Heat.build({fullPath:[
  {time:0,segment:1,x:null,y:.2},
  {time:1,segment:1,x:'',y:.2},
  {time:2,segment:1,x:'   ',y:.2},
  {time:3,segment:1,x:.2,y:null},
  {time:4,segment:'',x:.2,y:.2}
]},{1:projector(1)},{});
assert.equal(missingInput.status,'INDISPONIBLE');
assert.equal(missingInput.eligibleObservations,0);
assert.equal(missingInput.observations,0);
assert.equal(missingInput.metricCoverage,0);
assert.equal(missingInput.reason,'aucune position joueur exploitable');

const missingProjected=Heat.build({fullPath:[
  {time:0,segment:1,x:.2,y:.2},
  {time:1,segment:1,x:.3,y:.3},
  {time:2,segment:1,x:.4,y:.4}
]},{1:{validated:true,confidence:1,project:p=>p.time===0?{x:null,y:10}:p.time===1?{x:'',y:10}:{x:'   ',y:10}}},{});
assert.equal(missingProjected.status,'INDISPONIBLE');
assert.equal(missingProjected.eligibleObservations,3);
assert.equal(missingProjected.observations,0);
assert.equal(missingProjected.rejectedObservations,3);
assert.equal(missingProjected.metricCoverage,0);
assert.equal(missingProjected.reason,'aucune position projetée sur un terrain calibré');

const irregular=Heat.build({fullPath:[
  {time:0,segment:1,x:.05,y:.05},
  {time:.1,segment:1,x:.05,y:.05},
  {time:.2,segment:1,x:.05,y:.05},
  {time:1.2,segment:1,x:.75,y:.75},
  {time:2.2,segment:1,x:.75,y:.75}
]},{1:projector(1)},{cols:2,rows:2,maxDwellGapSec:2});
assert.equal(irregular.heatmapBasis,'TIME_SECONDS');
assert.equal(irregular.timeAllocation,'LINEAR_PITCH_SEGMENT');
assert.equal(irregular.projectedIntervalSeconds,2.2);
assert(Math.abs(irregular.timeCells[0][0]-(.2+9/14))<1e-5);
assert(Math.abs(irregular.timeCells[1][1]-(1+5/14))<1e-5);
assert(Math.abs(irregular.normalizedCells.flat().reduce((a,b)=>a+b,0)-1)<1e-5);
assert.notDeepEqual(irregular.normalizedCells,irregular.normalizedObservationCells);

const crossing=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.5},
  {time:1,segment:1,x:.9,y:.5}
]},{1:projector(1)},{cols:4,rows:1,maxDwellGapSec:2});
assert.equal(crossing.projectedIntervalSeconds,1);
assert.deepStrictEqual(crossing.timeCells[0],[.1875,.3125,.3125,.1875]);
assert.deepStrictEqual(crossing.normalizedTimeCells[0],[.1875,.3125,.3125,.1875]);
assert.equal(crossing.timeAllocation,'LINEAR_PITCH_SEGMENT');

const cutGap=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.1},
  {time:5,segment:1,x:.9,y:.9}
]},{1:projector(1)},{maxDwellGapSec:1});
assert.equal(cutGap.heatmapBasis,'OBSERVATIONS');
assert.equal(cutGap.timeAllocation,'NONE');
assert.equal(cutGap.projectedIntervalSeconds,0);
assert.equal(cutGap.eligibleIntervalSeconds,5);
assert.equal(cutGap.temporalCoverage,0);
assert.equal(cutGap.unobservedGapSeconds,5);
assert.equal(cutGap.gapBreaks,1);
assert.equal(cutGap.observationDefendableScore,1);
assert.equal(cutGap.defendableScore,1);
assert.equal(cutGap.quality,'FIABLE');
assert.equal(cutGap.qualityPolicy,'QUALITE_OBSERVATIONS = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE');

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
assert.equal(mixedGap.observationDefendableScore,1);
assert.equal(mixedGap.defendableScore,.2857);
assert.equal(mixedGap.quality,'PARTIEL');
assert.equal(mixedGap.qualityPolicy,'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE × COUVERTURE_TEMPORELLE');

const segmentCut=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.1},
  {time:.5,segment:2,x:.9,y:.9}
]},{1:projector(1),2:projector(2)},{maxDwellGapSec:1});
assert.equal(segmentCut.heatmapBasis,'OBSERVATIONS');
assert.equal(segmentCut.timeAllocation,'NONE');
assert.equal(segmentCut.projectedIntervalSeconds,0);

console.log('metric_pitch_heatmap_nonregression: OK');
