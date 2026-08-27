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
  function createGrid(cols,rows){ return Array.from({length:rows},()=>Array(cols).fill(0)); }
  function normalizeGrid(cells,total){
    if(!(total>0))return cells.map(r=>r.map(()=>0));
    return cells.map(r=>r.map(v=>+(v/total).toFixed(6)));
  }
  function projectPoint(p,projectors,pitchLengthM,pitchWidthM,cols,rows){
    if(!p||!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y))||!Number.isFinite(Number(p.segment)))return null;
    const info=projectorInfo(projectors&&projectors[p.segment]);
    if(!info.validated)return null;
    let q=null;
    try{q=info.project(p);}catch(e){q=null;}
    if(!q||!Number.isFinite(Number(q.x))||!Number.isFinite(Number(q.y)))return null;
    const x=Number(q.x),y=Number(q.y);
    if(x<0||x>pitchLengthM||y<0||y>pitchWidthM)return null;
    const cx=Math.min(cols-1,Math.floor(clamp(x/pitchLengthM,0,.999999)*cols));
    const cy=Math.min(rows-1,Math.floor(clamp(y/pitchWidthM,0,.999999)*rows));
    return {x,y,cx,cy,confidence:info.confidence};
  }
  function build(track,projectors,options){
    const opts={pitchLengthM:105,pitchWidthM:68,cols:6,rows:4,minMetricCoverage:.35,minCalibrationConfidence:.5,maxDwellGapSec:1,...(options||{})};
    const path=Array.isArray(track?.fullPath)?track.fullPath:[];
    const cols=Math.max(1,Math.floor(Number(opts.cols)||6));
    const rows=Math.max(1,Math.floor(Number(opts.rows)||4));
    const pitchLengthM=Math.max(1,Number(opts.pitchLengthM)||105);
    const pitchWidthM=Math.max(1,Number(opts.pitchWidthM)||68);
    const minCalibrationConfidence=clamp(Number(opts.minCalibrationConfidence)||0,0,1);
    const maxDwellGapSec=Math.max(0,Number(opts.maxDwellGapSec)||0);
    const cells=createGrid(cols,rows);
    const timeCells=createGrid(cols,rows);
    let eligible=0,projected=0,rejected=0,confidenceSum=0;
    let eligibleIntervalSeconds=0,projectedIntervalSeconds=0;
    const projectedPoints=[];
    const prepared=[];
    for(const p of path){
      const structurallyEligible=!!p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.y))&&Number.isFinite(Number(p.segment));
      if(!structurallyEligible){prepared.push({p,projected:null});continue;}
      eligible++;
      const projectedPoint=projectPoint(p,projectors,pitchLengthM,pitchWidthM,cols,rows);
      if(!projectedPoint){rejected++;prepared.push({p,projected:null});continue;}
      cells[projectedPoint.cy][projectedPoint.cx]++;
      projected++;confidenceSum+=projectedPoint.confidence;
      projectedPoints.push({time:Number.isFinite(Number(p.time))?Number(p.time):null,segment:Number(p.segment),x:+projectedPoint.x.toFixed(3),y:+projectedPoint.y.toFixed(3),calibrationConfidence:+projectedPoint.confidence.toFixed(3)});
      prepared.push({p,projected:projectedPoint});
    }
    for(let i=0;i+1<prepared.length;i++){
      const a=prepared[i],b=prepared[i+1];
      if(!a?.p||!b?.p)continue;
      const ta=Number(a.p.time),tb=Number(b.p.time);
      if(!Number.isFinite(ta)||!Number.isFinite(tb)||tb<=ta)continue;
      if(Number(a.p.segment)!==Number(b.p.segment))continue;
      const dt=tb-ta;
      if(maxDwellGapSec>0&&dt>maxDwellGapSec)continue;
      eligibleIntervalSeconds+=dt;
      if(!a.projected||!b.projected)continue;
      timeCells[a.projected.cy][a.projected.cx]+=dt;
      projectedIntervalSeconds+=dt;
    }
    const coverage=eligible>0?projected/eligible:0;
    const avgCalibrationConfidence=projected>0?confidenceSum/projected:0;
    const defendableScore=coverage*avgCalibrationConfidence;
    const coverageOk=coverage>=clamp(Number(opts.minMetricCoverage)||0,0,1);
    const confidenceOk=avgCalibrationConfidence>=minCalibrationConfidence;
    const available=projected>0&&coverageOk&&confidenceOk;
    const max=cells.reduce((m,r)=>Math.max(m,...r),0);
    const maxTimeSeconds=timeCells.reduce((m,r)=>Math.max(m,...r),0);
    const useTimeWeighting=projectedIntervalSeconds>0;
    const normalizedObservationCells=normalizeGrid(cells,projected);
    const normalizedTimeCells=normalizeGrid(timeCells,projectedIntervalSeconds);
    let reason=null;
    if(!available){
      reason=eligible===0?'aucune position joueur exploitable':projected===0?'aucune position projetée sur un terrain calibré':!coverageOk?'couverture métrique insuffisante pour une heatmap terrain':'confiance calibration insuffisante pour une heatmap terrain défendable';
    }
    return {
      status:available?'DISPONIBLE':'INDISPONIBLE',
      reason,
      coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,cols,rows,cells,
      timeCells:timeCells.map(r=>r.map(v=>+v.toFixed(6))),
      normalizedCells:useTimeWeighting?normalizedTimeCells:normalizedObservationCells,
      normalizedObservationCells,normalizedTimeCells,
      heatmapBasis:useTimeWeighting?'TIME_SECONDS':'OBSERVATIONS',
      max,maxTimeSeconds:+maxTimeSeconds.toFixed(6),observations:projected,
      eligibleObservations:eligible,rejectedObservations:rejected,metricCoverage:+coverage.toFixed(4),
      eligibleIntervalSeconds:+eligibleIntervalSeconds.toFixed(6),projectedIntervalSeconds:+projectedIntervalSeconds.toFixed(6),
      temporalCoverage:eligibleIntervalSeconds>0?+(projectedIntervalSeconds/eligibleIntervalSeconds).toFixed(4):null,
      maxDwellGapSec,
      avgCalibrationConfidence:+avgCalibrationConfidence.toFixed(4),defendableScore:+defendableScore.toFixed(4),
      projectedPoints:available?projectedPoints:[],
      quality:available?qualityFromEvidenceScore(defendableScore):'INDISPONIBLE',
      qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',
      policy:'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN',
      temporalPolicy:'PONDERATION_TEMPS_SEULEMENT_ENTRE_POINTS_CONSECUTIFS_MEME_SEGMENT_CALIBRE_SANS_GAP_EXCESSIF'
    };
  }
  return {build,projectorInfo,qualityFromEvidenceScore};
});
