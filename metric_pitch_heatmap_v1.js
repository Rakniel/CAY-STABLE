(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricPitchHeatmap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const isPresentFinite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const qualityFromEvidenceScore=score=>isPresentFinite(score)?(Number(score)>=.8?'FIABLE':Number(score)>0?'PARTIEL':'INDISPONIBLE'):'INDISPONIBLE';
  function projectorInfo(entry){
    if(!entry||entry.validated!==true||typeof entry.project!=='function')return {validated:false,project:null,confidence:null};
    const rawConfidence=entry.confidence;
    const hasConfidence=rawConfidence!==null&&rawConfidence!==undefined&&!(typeof rawConfidence==='string'&&rawConfidence.trim()==='');
    const numericConfidence=hasConfidence?Number(rawConfidence):NaN;
    const confidence=Number.isFinite(numericConfidence)?clamp(numericConfidence,0,1):null;
    return {validated:true,project:entry.project,confidence};
  }
  function createGrid(cols,rows){ return Array.from({length:rows},()=>Array(cols).fill(0)); }
  function normalizeGrid(cells,total){
    if(!(total>0))return cells.map(r=>r.map(()=>0));
    return cells.map(r=>r.map(v=>+(v/total).toFixed(6)));
  }
  function projectPoint(p,projectors,pitchLengthM,pitchWidthM,cols,rows){
    if(!p||!isPresentFinite(p.x)||!isPresentFinite(p.y)||!isPresentFinite(p.segment))return null;
    const info=projectorInfo(projectors&&projectors[p.segment]);
    if(!info.validated)return null;
    let q=null;
    try{q=info.project(p);}catch(e){q=null;}
    if(!q||!isPresentFinite(q.x)||!isPresentFinite(q.y))return null;
    const x=Number(q.x),y=Number(q.y);
    if(x<0||x>pitchLengthM||y<0||y>pitchWidthM)return null;
    const cx=Math.min(cols-1,Math.floor(clamp(x/pitchLengthM,0,.999999)*cols));
    const cy=Math.min(rows-1,Math.floor(clamp(y/pitchWidthM,0,.999999)*rows));
    return {x,y,cx,cy,confidence:info.confidence};
  }
  function accumulateLinearDwell(grid,a,b,dt,pitchLengthM,pitchWidthM,cols,rows){
    if(!(dt>0)||!a||!b)return 0;
    const ts=[0,1],dx=b.x-a.x,dy=b.y-a.y;
    if(Math.abs(dx)>1e-12){
      for(let i=1;i<cols;i++){
        const t=(pitchLengthM*i/cols-a.x)/dx;
        if(t>0&&t<1)ts.push(t);
      }
    }
    if(Math.abs(dy)>1e-12){
      for(let i=1;i<rows;i++){
        const t=(pitchWidthM*i/rows-a.y)/dy;
        if(t>0&&t<1)ts.push(t);
      }
    }
    ts.sort((x,y)=>x-y);
    const cuts=[];
    for(const t of ts){if(!cuts.length||Math.abs(t-cuts[cuts.length-1])>1e-10)cuts.push(t);}
    let allocated=0;
    for(let i=0;i+1<cuts.length;i++){
      const t0=cuts[i],t1=cuts[i+1],span=t1-t0;if(!(span>0))continue;
      const tm=(t0+t1)/2,x=a.x+dx*tm,y=a.y+dy*tm;
      const cx=Math.min(cols-1,Math.floor(clamp(x/pitchLengthM,0,.999999)*cols));
      const cy=Math.min(rows-1,Math.floor(clamp(y/pitchWidthM,0,.999999)*rows));
      const seconds=dt*span;grid[cy][cx]+=seconds;allocated+=seconds;
    }
    return allocated;
  }
  function buildTrajectory(prepared,eligible,projected,confidenceSum,confidenceKnown,maxGapSec,minCalibrationConfidence){
    const runs=[];let current=[];
    const flush=()=>{if(current.length)runs.push(current);current=[];};
    for(let i=0;i<prepared.length;i++){
      const row=prepared[i],p=row?.p,q=row?.projected;
      if(!p||!q||!Number.isFinite(Number(p.time))){flush();continue;}
      const point={time:+Number(p.time).toFixed(3),segment:Number(p.segment),x:+q.x.toFixed(3),y:+q.y.toFixed(3),calibrationConfidence:isPresentFinite(q.confidence)?+Number(q.confidence).toFixed(3):null};
      if(current.length){
        const prev=current[current.length-1],dt=point.time-prev.time;
        if(point.segment!==prev.segment||!(dt>0)||(maxGapSec>0&&dt>maxGapSec))flush();
      }
      current.push(point);
    }
    flush();
    const continuousRuns=runs.filter(run=>run.length>=2);
    const coverage=eligible>0?projected/eligible:0;
    const confidenceCoverage=projected>0?confidenceKnown/projected:0;
    const confidenceComplete=projected>0&&confidenceKnown===projected;
    const avgConfidence=confidenceComplete?confidenceSum/projected:null;
    const score=confidenceComplete?coverage*avgConfidence:null;
    const minConfidence=clamp(Number(minCalibrationConfidence)||0,0,1);
    const confidenceSufficient=confidenceComplete&&avgConfidence>=minConfidence;
    const hasContinuousMotion=continuousRuns.length>0;
    const evidenceAvailable=projected>0&&confidenceSufficient&&hasContinuousMotion;
    return {
      status:evidenceAvailable?'DISPONIBLE':'INDISPONIBLE',
      reason:projected===0?'aucun point terrain métrique validé':!confidenceComplete?'confiance calibration indisponible pour une trajectoire terrain défendable':!confidenceSufficient?'confiance calibration insuffisante pour une trajectoire terrain défendable':!hasContinuousMotion?'aucun segment temporel continu avec au moins deux positions métriques':null,
      coordinateSystem:'PITCH_METERS',
      runs:evidenceAvailable?continuousRuns:[],
      points:evidenceAvailable?continuousRuns.flat():[],
      observations:projected,
      eligibleObservations:eligible,
      continuousObservations:continuousRuns.reduce((sum,run)=>sum+run.length,0),
      metricCoverage:+coverage.toFixed(4),
      calibrationConfidenceCoverage:+confidenceCoverage.toFixed(4),
      avgCalibrationConfidence:avgConfidence===null?null:+avgConfidence.toFixed(4),
      defendableScore:score===null?null:+score.toFixed(4),
      quality:evidenceAvailable?qualityFromEvidenceScore(score):'INDISPONIBLE',
      interpolation:'NONE',
      continuityPolicy:'COUPE_SUR_POINT_NON_PROJETE_CHANGEMENT_SEGMENT_TIMESTAMP_INVALIDE_OU_GAP_EXCESSIF; RUN_MINIMUM_2_POINTS'
    };
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
    const segmentInfos={};
    for(const p of path){
      if(!p||!isPresentFinite(p.segment))continue;
      const key=String(p.segment);
      if(!(key in segmentInfos))segmentInfos[key]=projectorInfo(projectors&&projectors[p.segment]);
    }
    const hasTrustedSegment=Object.values(segmentInfos).some(info=>info.validated&&isPresentFinite(info.confidence)&&Number(info.confidence)>=minCalibrationConfidence);
    const cells=createGrid(cols,rows),timeCells=createGrid(cols,rows);
    let eligible=0,projected=0,rejected=0,lowConfidenceSegmentRejected=0,confidenceSum=0,confidenceKnown=0,eligibleIntervalSeconds=0,projectedIntervalSeconds=0,unobservedGapSeconds=0,gapBreaks=0;
    const projectedPoints=[],prepared=[];
    for(const p of path){
      const structurallyEligible=!!p&&isPresentFinite(p.x)&&isPresentFinite(p.y)&&isPresentFinite(p.segment);
      if(!structurallyEligible){prepared.push({p,projected:null});continue;}
      eligible++;
      const info=segmentInfos[String(p.segment)]||projectorInfo(projectors&&projectors[p.segment]);
      const weakSegmentInsideTrustedMix=hasTrustedSegment&&info.validated&&isPresentFinite(info.confidence)&&Number(info.confidence)<minCalibrationConfidence;
      if(weakSegmentInsideTrustedMix){rejected++;lowConfidenceSegmentRejected++;prepared.push({p,projected:null});continue;}
      const projectedPoint=projectPoint(p,projectors,pitchLengthM,pitchWidthM,cols,rows);
      if(!projectedPoint){rejected++;prepared.push({p,projected:null});continue;}
      cells[projectedPoint.cy][projectedPoint.cx]++;projected++;
      if(isPresentFinite(projectedPoint.confidence)){confidenceSum+=Number(projectedPoint.confidence);confidenceKnown++;}
      projectedPoints.push({time:Number.isFinite(Number(p.time))?Number(p.time):null,segment:Number(p.segment),x:+projectedPoint.x.toFixed(3),y:+projectedPoint.y.toFixed(3),calibrationConfidence:isPresentFinite(projectedPoint.confidence)?+Number(projectedPoint.confidence).toFixed(3):null});
      prepared.push({p,projected:projectedPoint});
    }
    for(let i=0;i+1<prepared.length;i++){
      const a=prepared[i],b=prepared[i+1];if(!a?.p||!b?.p)continue;
      const ta=Number(a.p.time),tb=Number(b.p.time);if(!Number.isFinite(ta)||!Number.isFinite(tb)||tb<=ta)continue;
      if(Number(a.p.segment)!==Number(b.p.segment))continue;
      const dt=tb-ta;eligibleIntervalSeconds+=dt;
      if(maxDwellGapSec>0&&dt>maxDwellGapSec){unobservedGapSeconds+=dt;gapBreaks++;continue;}
      if(!a.projected||!b.projected)continue;
      const allocated=accumulateLinearDwell(timeCells,a.projected,b.projected,dt,pitchLengthM,pitchWidthM,cols,rows);
      if(Math.abs(allocated-dt)>1e-7)continue;
      projectedIntervalSeconds+=dt;
    }
    const coverage=eligible>0?projected/eligible:0;
    const confidenceCoverage=projected>0?confidenceKnown/projected:0;
    const confidenceComplete=projected>0&&confidenceKnown===projected;
    const avgCalibrationConfidence=confidenceComplete?confidenceSum/projected:null;
    const defendableScore=confidenceComplete?coverage*avgCalibrationConfidence:null;
    const coverageOk=coverage>=clamp(Number(opts.minMetricCoverage)||0,0,1),confidenceOk=confidenceComplete&&avgCalibrationConfidence>=minCalibrationConfidence,available=projected>0&&coverageOk&&confidenceOk;
    const max=cells.reduce((m,r)=>Math.max(m,...r),0),maxTimeSeconds=timeCells.reduce((m,r)=>Math.max(m,...r),0),useTimeWeighting=projectedIntervalSeconds>0;
    const normalizedObservationCells=normalizeGrid(cells,projected),normalizedTimeCells=normalizeGrid(timeCells,projectedIntervalSeconds);
    let reason=null;
    if(!available)reason=eligible===0?'aucune position joueur exploitable':projected===0?'aucune position projetée sur un terrain calibré':!coverageOk?'couverture métrique insuffisante pour une heatmap terrain':!confidenceComplete?'confiance calibration indisponible pour une heatmap terrain défendable':'confiance calibration insuffisante pour une heatmap terrain défendable';
    const trajectory=buildTrajectory(prepared,eligible,projected,confidenceSum,confidenceKnown,maxDwellGapSec,minCalibrationConfidence);
    return {
      status:available?'DISPONIBLE':'INDISPONIBLE',reason,coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,cols,rows,cells,
      timeCells:timeCells.map(r=>r.map(v=>+v.toFixed(6))),normalizedCells:useTimeWeighting?normalizedTimeCells:normalizedObservationCells,normalizedObservationCells,normalizedTimeCells,
      heatmapBasis:useTimeWeighting?'TIME_SECONDS':'OBSERVATIONS',timeAllocation:useTimeWeighting?'LINEAR_PITCH_SEGMENT':'NONE',max,maxTimeSeconds:+maxTimeSeconds.toFixed(6),observations:projected,eligibleObservations:eligible,rejectedObservations:rejected,lowConfidenceSegmentRejected,metricCoverage:+coverage.toFixed(4),
      eligibleIntervalSeconds:+eligibleIntervalSeconds.toFixed(6),projectedIntervalSeconds:+projectedIntervalSeconds.toFixed(6),temporalCoverage:eligibleIntervalSeconds>0?+(projectedIntervalSeconds/eligibleIntervalSeconds).toFixed(4):null,maxDwellGapSec,
      unobservedGapSeconds:+unobservedGapSeconds.toFixed(6),gapBreaks,
      calibrationConfidenceObservations:confidenceKnown,calibrationConfidenceCoverage:+confidenceCoverage.toFixed(4),avgCalibrationConfidence:avgCalibrationConfidence===null?null:+avgCalibrationConfidence.toFixed(4),defendableScore:defendableScore===null?null:+defendableScore.toFixed(4),projectedPoints:available?projectedPoints:[],trajectory,
      quality:available?qualityFromEvidenceScore(defendableScore):'INDISPONIBLE',qualityPolicy:'QUALITE = COUVERTURE_METRIQUE × CONFIANCE_CALIBRATION_MOYENNE',policy:'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN',
      temporalPolicy:'DENOMINATEUR_CONSERVE_TOUT_INTERVALLE_MEME_SEGMENT; TEMPS_REPARTI_LINEAIREMENT_SUR_LES_CELLULES_TRAVERSEES_ENTRE_POINTS_CALIBRES_SANS_GAP_EXCESSIF'
    };
  }
  return {build,buildTrajectory,projectorInfo,qualityFromEvidenceScore,accumulateLinearDwell};
});