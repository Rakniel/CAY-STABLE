'use strict';
const assert=require('node:assert/strict');
const Heat=require('../metric_pitch_heatmap_v1.js');
const track={fullPath:[
  {time:0,segment:1,x:.100,y:.100},
  {time:.5,segment:1,x:.101,y:.101},
  {time:1,segment:1,x:.102,y:.102}
]};
const projectors={1:{validated:true,confidence:1,project:p=>({x:p.x*105,y:p.y*68})}};
const scenarios=[
  [{cols:Infinity,rows:2},6,2],
  [{cols:6,rows:Infinity},6,4],
  [{cols:1e12,rows:1e12},128,128],
  [{cols:NaN,rows:NaN},6,4],
  [{cols:true,rows:'  '},6,4],
  [{cols:64,rows:32},64,32],
  [{cols:-3,rows:2},1,2],
  [{cols:'128',rows:'128'},128,128],
  [{cols:'',rows:null},6,4]
];
for(const [options,cols,rows] of scenarios){
  const result=Heat.build(track,projectors,options);
  assert.equal(result.cols,cols);
  assert.equal(result.rows,rows);
  assert.equal(result.cells.length,rows);
  assert.equal(result.cells[0].length,cols);
  assert.equal(result.status,'DISPONIBLE');
  assert.equal(result.trajectory.status,'DISPONIBLE');
}
console.log('metric_pitch_heatmap_grid_bounds_nonregression: PASS');
