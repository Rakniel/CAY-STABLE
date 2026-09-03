'use strict';
const assert=require('assert');
const V=require('../observed_image_visuals_v1.js');
const track={fullPath:[
 {x:.10,y:.20,time:0,segment:1},{x:.20,y:.30,time:.5,segment:1},{x:.30,y:.40,time:1,segment:1},
 {x:.70,y:.50,time:2,segment:2},{x:.80,y:.60,time:2.5,segment:2},
 {x:1.2,y:.5,time:3,segment:2}
]};
const r=V.build(track,{cols:4,rows:2,maxGapSec:1});
assert.equal(r.status,'DISPONIBLE');
assert.equal(r.coordinateSystem,'IMAGE_NORMALIZED');
assert.equal(r.physicalMetricsAllowed,false);
assert.equal(r.observations,5);
assert.equal(r.rejectedObservations,1);
assert.equal(r.trajectory.runs.length,2,'camera cut must split trajectory');
assert.equal(r.trajectory.runs[0].length,3);
assert.equal(r.trajectory.runs[1].length,2);
const sum=r.heatmap.normalizedCells.flat().reduce((a,b)=>a+b,0);
assert(Math.abs(sum-1)<1e-5,'normalized camera heatmap must sum to 1');
assert(r.policy.includes('AUCUNE_METRIQUE_TERRAIN_DERIVEE'));
const empty=V.build({fullPath:[]});
assert.equal(empty.status,'INDISPONIBLE');
console.log('observed image visuals non-regression: PASS');
