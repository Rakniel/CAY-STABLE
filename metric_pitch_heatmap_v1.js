(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricPitchHeatmap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function projectorInfo(entry){
    if(!entry||entry.validated!==true||typeof entry.project!=='function')return {validated:false,project:null};
    return {validated:true,project:entry.project};
  }
  function createGrid(cols,rows){
    return Array.from({length:rows},()=>Array(cols).fill(0));
  }
  function normalizeGrid(cells,total){
    if(!(total>0))return cells.map(r=>r.map(()=>0));
    return cells.map(r=>r.map(v=>+(v/total).toFixed(6)));
  }
  function build(track,projectors,options){
    const opts={pitchLengthM:105,pitchWidthM:68,cols:6,rows:4,minMetricCoverage:.35,...(options||{})};
    const path=Array.isArray(track?.fullPath)?track.fullPath:[];
    const cols=Math.max(1,Math.floor(Number(opts.cols)||6));
    const rows=Math.max(1,Math.floor(Number(opts.rows)||4));
    const pitchLengthM=Math.max(1,Number(opts.pitchLengthM)||105);
    const pitchWidthM=Math.max(1,Number(opts.pitchWidthM)||68);
    const cells=createGrid(cols,rows);
    let eligible=0,projected=0,rejected=0;
    const projectedPoints=[];
    for(const p of path){
      if(!p||!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y))||!Number.isFinite(Number(p.segment)))continue;
      eligible++;
      const info=projectorInfo(projectors&&projectors[p.segment]);
      if(!info.validated){rejected++;continue;}
      let q=null;
      try{q=info.project(p);}catch(e){q=null;}
      if(!q||!Number.isFinite(Number(q.x))||!Number.isFinite(Number(q.y))){rejected++;continue;}
      const x=Number(q.x),y=Number(q.y);
      if(x<0||x>pitchLengthM||y<0||y>pitchWidthM){rejected++;continue;}
      const cx=Math.min(cols-1,Math.floor(clamp(x/pitchLengthM,0,.999999)*cols));
      const cy=Math.min(rows-1,Math.floor(clamp(y/pitchWidthM,0,.999999)*rows));
      cells[cy][cx]++;
      projected++;
      projectedPoints.push({time:Number.isFinite(Number(p.time))?Number(p.time):null,segment:Number(p.segment),x:+x.toFixed(3),y:+y.toFixed(3)});
    }
    const coverage=eligible>0?projected/eligible:0;
    const available=projected>0&&coverage>=Math.max(0,Math.min(1,Number(opts.minMetricCoverage)||0));
    const max=cells.reduce((m,r)=>Math.max(m,...r),0);
    return {
      status:available?'DISPONIBLE':'INDISPONIBLE',
      reason:available?null:(eligible===0?'aucune position joueur exploitable':projected===0?'aucune position projetée sur un terrain calibré':'couverture métrique insuffisante pour une heatmap terrain'),
      coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,cols,rows,cells,
      normalizedCells:normalizeGrid(cells,projected),max,observations:projected,
      eligibleObservations:eligible,rejectedObservations:rejected,metricCoverage:+coverage.toFixed(4),
      projectedPoints:available?projectedPoints:[],
      quality:available?(coverage>=.8?'FIABLE':'PARTIEL'):'INDISPONIBLE',
      policy:'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN'
    };
  }
  return {build,projectorInfo};
});
