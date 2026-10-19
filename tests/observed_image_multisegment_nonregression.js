'use strict';
const assert=require('node:assert/strict');
const V=require('../observed_image_visuals_v1.js');
let checks=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
const near=(a,b,msg)=>{assert(Math.abs(a-b)<1e-12,msg);checks++;};
for(let pass=0;pass<3;pass++){
  const track={fullPath:[
    {x:0,y:0,time:0,segment:0},{x:.2,y:.2,time:1,segment:0},
    {x:.8,y:.8,time:2,segment:1},{x:1,y:1,time:3,segment:1},
    {x:null,y:.3,time:4,segment:1}
  ]};
  const r=V.build(track,{cols:2,rows:2});
  eq(r.status,'DISPONIBLE','trajectory remains available');
  eq(r.heatmap.status,'INDISPONIBLE','aggregate heatmap blocked');
  eq(r.heatmap.normalizedCells,[],'never mix unrelated camera frames');
  eq(r.heatmap.reason,'PLANS_CAMERA_MULTIPLES_AGREGATION_INTERDITE');
  eq(r.heatmap.segmentCount,2);
  eq(r.heatmap.segmentHeatmaps.map(x=>x.segment),[0,1]);
  eq(r.heatmap.segmentHeatmaps.map(x=>x.status),['DISPONIBLE','DISPONIBLE']);
  eq(r.heatmap.segmentHeatmaps.map(x=>x.observations),[2,2]);
  near(r.heatmap.segmentHeatmaps[0].normalizedCells.flat().reduce((a,b)=>a+b,0),1,'segment 0 mass');
  near(r.heatmap.segmentHeatmaps[1].normalizedCells.flat().reduce((a,b)=>a+b,0),1,'segment 1 mass');
  eq(r.trajectory.runs.length,2);
  eq(r.physicalMetricsAllowed,false);
  const one=V.build({fullPath:track.fullPath.slice(0,2)},{cols:2,rows:2});
  eq(one.heatmap.status,'DISPONIBLE');
  near(one.heatmap.normalizedCells.flat().reduce((a,b)=>a+b,0),1,'single segment mass');
  const low=V.build({fullPath:track.fullPath.slice(0,3)},{cols:2,rows:2});
  eq(low.heatmap.segmentHeatmaps[1].status,'INDISPONIBLE');
  eq(low.heatmap.segmentHeatmaps[1].normalizedCells,[]);
  const excessive=V.build({fullPath:Array.from({length:34},(_,i)=>({x:.2,y:.2,time:i,segment:Math.floor(i/2)}))});
  eq(excessive.heatmap.reason,'TROP_DE_PLANS_CAMERA_POUR_HEATMAPS');
  eq(excessive.heatmap.segmentHeatmaps,[]);
  eq(excessive.heatmap.normalizedCells,[]);
  eq(excessive.trajectory.runs.length,17);
}
console.log(`RUN83 multisegment heatmap isolation: PASS ${checks} assertions`);
