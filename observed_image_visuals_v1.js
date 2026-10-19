(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CAYObservedImageVisuals=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));const finite=v=>(typeof v==='number'&&Number.isFinite(v))||(typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v)));function validPoint(p){return !!p&&finite(p.x)&&finite(p.y)&&finite(p.time)&&finite(p.segment)&&Number.isInteger(Number(p.segment))&&Number(p.segment)>=0&&Number(p.time)>=0&&Number(p.x)>=0&&Number(p.x)<=1&&Number(p.y)>=0&&Number(p.y)<=1;}function grid(c,r){return Array.from({length:r},()=>Array(c).fill(0));}function gridDimension(value,fallback){const n=Number(value);return !Number.isFinite(n)||n===0?fallback:Math.max(1,Math.min(256,Math.floor(n)));}function runs(path,maxGapSec){const out=[];let cur=[];const flush=()=>{if(cur.length)out.push(cur);cur=[];};for(const p of path){if(!validPoint(p)){flush();continue;}const q={x:+clamp(p.x).toFixed(6),y:+clamp(p.y).toFixed(6),time:+Number(p.time).toFixed(3),segment:Number(p.segment)};if(cur.length){const prev=cur[cur.length-1],dt=q.time-prev.time;if(q.segment!==prev.segment||!(dt>0)||(maxGapSec>0&&dt>maxGapSec))flush();}cur.push(q);}flush();return out;}function build(track,options){
  const o={cols:12,rows:8,maxGapSec:1,minObservations:2,...(options||{})};
  const cols=gridDimension(o.cols,12),rows=gridDimension(o.rows,8);
  const path=Array.isArray(track&&track.fullPath)?track.fullPath:[];
  const segmentCounts=new Map(),segmentCells=new Map();
  const MAX_SEGMENT_HEATMAPS=16;
  let n=0,bad=0,segmentLimitExceeded=false;
  for(const p of path){
    if(!validPoint(p)){bad++;continue;}
    const segment=Number(p.segment);
    segmentCounts.set(segment,(segmentCounts.get(segment)||0)+1);
    if(!segmentLimitExceeded){
      if(!segmentCells.has(segment)){
        if(segmentCells.size>=MAX_SEGMENT_HEATMAPS){
          segmentLimitExceeded=true;
          segmentCells.clear();
        }else segmentCells.set(segment,grid(cols,rows));
      }
      if(!segmentLimitExceeded){
        const x=clamp(p.x),y=clamp(p.y);
        const cx=Math.min(cols-1,Math.floor(Math.min(.999999,x)*cols));
        const cy=Math.min(rows-1,Math.floor(Math.min(.999999,y)*rows));
        segmentCells.get(segment)[cy][cx]++;
      }
    }
    n++;
  }
  const minObservations=Math.max(1,Math.floor(Number(o.minObservations)||2));
  const ok=n>=minObservations;
  const rr=runs(path,Math.max(0,Number(o.maxGapSec)||0));
  const segmentCount=segmentCounts.size;
  const segmentHeatmaps=segmentLimitExceeded?[]:[...segmentCounts].map(([segment,count])=>{
    const available=count>=minObservations;
    return {segment,status:available?'DISPONIBLE':'INDISPONIBLE',
      reason:available?null:'observations image valides insuffisantes pour ce plan',
      coordinateSystem:'IMAGE_NORMALIZED',observations:count,
      normalizedCells:available?segmentCells.get(segment).map(row=>row.map(v=>v/count)):[],
      basis:'OBSERVATIONS'};
  });
  const singleSegment=segmentCount===1;
  const safeHeatmap=ok&&singleSegment&&!segmentLimitExceeded;
  const heatmapReason=!ok?'observations image valides insuffisantes'
    :segmentLimitExceeded?'TROP_DE_PLANS_CAMERA_POUR_HEATMAPS'
    :!singleSegment?'PLANS_CAMERA_MULTIPLES_AGREGATION_INTERDITE':null;
  return {
    status:ok?'DISPONIBLE':'INDISPONIBLE',
    reason:ok?null:'observations image valides insuffisantes',
    coordinateSystem:'IMAGE_NORMALIZED',semantic:'PRESENCE_DANS_LE_CADRE_CAMERA',
    observations:n,rejectedObservations:bad,totalPathPoints:path.length,
    observationCoverage:path.length?+(n/path.length).toFixed(4):0,
    trajectory:{status:ok?'DISPONIBLE':'INDISPONIBLE',coordinateSystem:'IMAGE_NORMALIZED',
      runs:ok?rr:[],points:ok?rr.flat():[],interpolation:'NONE'},
    heatmap:{status:safeHeatmap?'DISPONIBLE':'INDISPONIBLE',reason:heatmapReason,
      coordinateSystem:'IMAGE_NORMALIZED',cols,rows,
      normalizedCells:safeHeatmap?segmentHeatmaps[0].normalizedCells:[],
      basis:'OBSERVATIONS',segmentCount,segmentHeatmaps,
      scope:singleSegment?'SINGLE_CAMERA_SEGMENT':'SEGMENT_ONLY'},
    physicalMetricsAllowed:false,
    policy:'VISUEL_OBSERVE_SANS_CALIBRATION; AUCUNE_METRIQUE_TERRAIN_DERIVEE; AUCUNE_FUSION_HEATMAP_ENTRE_PLANS_CAMERA'
  };
}
return {build,runs,validPoint};});