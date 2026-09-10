(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricTrajectorySmoother=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const positiveOptionOr=(value,fallback)=>finite(value)&&Number(value)>0?Number(value):fallback;
  const nonNegativeOptionOr=(value,fallback)=>finite(value)&&Number(value)>=0?Number(value):fallback;
  const COEFF=[-3/35,12/35,17/35,12/35,-3/35];
  const DEFAULT_PITCH_LENGTH_M=105;
  const DEFAULT_PITCH_WIDTH_M=68;

  function insidePitch(p,pitchLengthM=DEFAULT_PITCH_LENGTH_M,pitchWidthM=DEFAULT_PITCH_WIDTH_M){
    if(!p||!finite(p.x)||!finite(p.y))return false;
    const x=Number(p.x),y=Number(p.y);
    return x>=0&&x<=pitchLengthM&&y>=0&&y<=pitchWidthM;
  }

  function usableWindow(points,index,maxGapSec,maxSpacingRatio,maxSpeedRatio,speedRatioFloorMps){
    if(index<2||index>points.length-3)return null;
    const w=points.slice(index-2,index+3);
    if(w.some(p=>!p||!finite(p.x)||!finite(p.y)||!finite(p.time)||p.segment===undefined||p.segment===null))return null;
    const segment=w[0].segment;if(w.some(p=>p.segment!==segment))return null;
    const dts=[],speeds=[];
    for(let i=1;i<w.length;i++){
      const dt=Number(w[i].time)-Number(w[i-1].time);
      if(!(dt>0)||dt>maxGapSec)return null;
      dts.push(dt);
      speeds.push(Math.hypot(Number(w[i].x)-Number(w[i-1].x),Number(w[i].y)-Number(w[i-1].y))/dt);
    }
    const minDt=Math.min(...dts),maxDt=Math.max(...dts);
    if(!(minDt>0)||maxDt/minDt>maxSpacingRatio)return null;
    const minSpeed=Math.min(...speeds),maxSpeed=Math.max(...speeds);
    if(maxSpeed>=speedRatioFloorMps&&maxSpeed/Math.max(.05,minSpeed)>maxSpeedRatio)return null;
    return w;
  }

  function smoothSeries(points,options){
    const cfg={maxGapSec:1,maxSpacingRatio:1.35,maxSpeedRatio:2.5,speedRatioFloorMps:2,pitchLengthM:DEFAULT_PITCH_LENGTH_M,pitchWidthM:DEFAULT_PITCH_WIDTH_M,rejectOutsidePitch:true,...(options||{})};
    const maxGapSec=positiveOptionOr(cfg.maxGapSec,1);
    const maxSpacingRatio=positiveOptionOr(cfg.maxSpacingRatio,1.35);
    const maxSpeedRatio=positiveOptionOr(cfg.maxSpeedRatio,2.5);
    const speedRatioFloorMps=nonNegativeOptionOr(cfg.speedRatioFloorMps,2);
    const pitchLengthM=positiveOptionOr(cfg.pitchLengthM,DEFAULT_PITCH_LENGTH_M);
    const pitchWidthM=positiveOptionOr(cfg.pitchWidthM,DEFAULT_PITCH_WIDTH_M);
    const rejectOutsidePitch=cfg.rejectOutsidePitch!==false;
    const raw=Array.isArray(points)?points:[];
    let rejectedOutsidePitchSamples=0;
    const src=raw.map(p=>{
      if(!p||!finite(p.x)||!finite(p.y)||!finite(p.time))return p?{...p}:null;
      if(rejectOutsidePitch&&!insidePitch(p,pitchLengthM,pitchWidthM)){rejectedOutsidePitchSamples++;return null;}
      return p;
    });
    let smoothedSamples=0;
    const out=src.map((p,i)=>{
      if(!p||!finite(p.x)||!finite(p.y)||!finite(p.time))return p?{...p}:null;
      const w=usableWindow(src,i,maxGapSec,maxSpacingRatio,maxSpeedRatio,speedRatioFloorMps);
      if(!w)return {...p,smoothing:'RAW'};
      let x=0,y=0;
      for(let k=0;k<5;k++){x+=Number(w[k].x)*COEFF[k];y+=Number(w[k].y)*COEFF[k];}
      if(!Number.isFinite(x)||!Number.isFinite(y)||rejectOutsidePitch&&!insidePitch({x,y},pitchLengthM,pitchWidthM))return {...p,smoothing:'RAW'};
      smoothedSamples++;
      return {...p,x,y,smoothing:'SAVGOL_5_QUADRATIC'};
    });
    return {
      points:out,
      inputSamples:raw.filter(Boolean).length,
      usableSamples:src.filter(Boolean).length,
      rejectedOutsidePitchSamples,
      smoothedSamples,
      smoothingCoverage:src.length?+(smoothedSamples/src.length).toFixed(4):0,
      pitchLengthM,
      pitchWidthM,
      rejectOutsidePitch,
      method:'SAVITZKY_GOLAY_5_POINT_QUADRATIC_FIXED_COEFFICIENTS',
      policy:'REJET_COORDONNEES_HORS_TERRAIN_AVANT_LISSAGE; AUCUN_LISSAGE_A_TRAVERS_COUPE_PLAN_GAP_SUPERIEUR_A_1S_ECHANTILLONNAGE_IRREGULIER_OU_CHANGEMENT_BRUTAL_ALLURE'
    };
  }

  function pathDistance(points,options){
    const cfg={maxGapSec:1,pitchLengthM:DEFAULT_PITCH_LENGTH_M,pitchWidthM:DEFAULT_PITCH_WIDTH_M,rejectOutsidePitch:true,...(options||{})};
    const maxGapSec=positiveOptionOr(cfg.maxGapSec,1);
    const pitchLengthM=positiveOptionOr(cfg.pitchLengthM,DEFAULT_PITCH_LENGTH_M);
    const pitchWidthM=positiveOptionOr(cfg.pitchWidthM,DEFAULT_PITCH_WIDTH_M);
    const rejectOutsidePitch=cfg.rejectOutsidePitch!==false;
    let distance=0,seconds=0,pairs=0,gapRejectedPairs=0,gapRejectedSeconds=0,outsidePitchRejectedPairs=0;
    for(let i=1;i<(points||[]).length;i++){
      const a=points[i-1],b=points[i];
      if(!a||!b||a.segment!==b.segment||![a.x,a.y,b.x,b.y,a.time,b.time].every(finite))continue;
      if(rejectOutsidePitch&&(!insidePitch(a,pitchLengthM,pitchWidthM)||!insidePitch(b,pitchLengthM,pitchWidthM))){outsidePitchRejectedPairs++;continue;}
      const dt=Number(b.time)-Number(a.time);if(!(dt>0))continue;
      if(dt>maxGapSec){gapRejectedPairs++;gapRejectedSeconds+=dt;continue;}
      distance+=Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y));seconds+=dt;pairs++;
    }
    return {
      distanceM:+distance.toFixed(4),
      seconds:+seconds.toFixed(4),
      pairs,
      gapRejectedPairs,
      gapRejectedSeconds:+gapRejectedSeconds.toFixed(4),
      outsidePitchRejectedPairs,
      maxGapSec,
      pitchLengthM,
      pitchWidthM,
      rejectOutsidePitch,
      policy:'AUCUNE_DISTANCE_A_TRAVERS_COORDONNEE_HORS_TERRAIN_CHANGEMENT_SEGMENT_OU_GAP_TEMPOREL_SUPERIEUR_AU_SEUIL'
    };
  }

  return {smoothSeries,pathDistance,insidePitch,coefficients:COEFF.slice(),DEFAULT_PITCH_LENGTH_M,DEFAULT_PITCH_WIDTH_M};
});
