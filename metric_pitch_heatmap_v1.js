(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricPitchHeatmap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const qualityFromEvidenceScore=score=>score>=.8?'FIABLE':score>0?'PARTIEL':'INDISPONIBLE';
  function projectorInfo(entry){
    if(!entry||entry.validated!==true||typeof entry.project!=='function')return {validated:false,project:null,confidence:0};
    const confidence=Number.isFinite(Number(entry.confidence))?clamp(Number(entry.confidence),0,1):1;
    return {validated:true,project:entry.project,confidence};
  }
  function createGrid(cols,rows){
    return Array.from({length:rows},()=>Array(cols).fill(0));
  }
  function normalizeGrid(cells,total){
    if(!(total>0))return cells.map(r=>r.map(()=>0));
    return cells.map(r=>r.map(v=>+(v/total).toFixed(6)));
  }
  function build(track,projectors,options){
    const opts={pitchLengthM:105,pitchWidthM:68,cols:6,rows:4,minMetricCoverage:.35,minCalibrationConfidence:.5,...(options||{})};
    const path=Array.isArray(track?.fullPath)?track.fullPath:[];
    const cols=Math.max(1,Math.floor(Number(opts.cols)||6));
    const rows=Math.max(1,Math.floor(Number(opts.rows)||4));
    const pitchLengthM=Math.max(1,Number(opts.pitchLengthM)||105);
    const pitchWidthM=Math.max(1,Number(opts.pitchWidthM)||68);
    const minCalibrationConfidence=clamp(Number(opts.minCalibrationConfidence)||0,0,1);
    const cells=createGrid(cols,rows);
    let eligible=0,projected=0,rejected=0,confidenceSum=0;
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
      projected++;confidenceSum+=info.confidence;
      projectedPoints.push({time:Number.isFinite(Number(p.time))?Number(p.time):null,segment:Number(p.segment),x:+x.toFixed(3),y:+y.toFixed(3),calibrationConfidence:+info.confidence.toFixed(3)});
    }
    const coverage=eligible>0?projected/eligible:0;
    const avgCalibrationConfidence=projected>0?confidenceSum/projected:0;
    const defendableScore=coverage*avgCalibrationConfidence;
    const coverageOk=coverage>=clamp(Number(opts.minMetricCoverage)||0,0,1);
    const confidenceOk=avgCalibrationConfidence>=minCalibrationConfidence;
    const available=projected>0&&coverageOk&&confidenceOk;
    const max=cells.reduce((m,r)=>Math.max(m,...r),0);
    let reason=null;
    if(!available){
      reason=eligible===0?'aucune position joueur exploitable':projected===0?'aucune position projetée sur un terrain calibré':!coverageOk?'couverture métrique insuffisante pour une heatmap terrain':'confiance calibration insuffisante pour une heatmap terrain défendable';
    }
    return {
      status:available?'DISPONIBLE':'INDISPONIBLE',
      reason,
      coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,cols,rows,cells,
      normalizedCells:normalizeGrid(cells,projected),max,observations:projected,
      eligibleObservations:eligible,rejectedObservations:rejected,metricCoverage:+coverage.toFixed(4),
      avgCalibrationConfidence:+avgCalibrationConfidence.toFixed(4),defendableScore:+defendableScore.toFixed(4),
      projectedPoints:available?projectedPoints:[],
      quality:available?qualityFromEvidenceScore(defendableScore):'INDISPONIBLE',
      qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',
      policy:'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN'
    };
  }
  return {build,projectorInfo,qualityFromEvidenceScore};
});
