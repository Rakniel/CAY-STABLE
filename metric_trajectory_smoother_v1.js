(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricTrajectorySmoother=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const COEFF=[-3/35,12/35,17/35,12/35,-3/35];

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
    const cfg={maxGapSec:1,maxSpacingRatio:1.35,maxSpeedRatio:2.5,speedRatioFloorMps:2,...(options||{})};
    const src=Array.isArray(points)?points:[];
    let smoothedSamples=0;
    const out=src.map((p,i)=>{
      if(!p||!finite(p.x)||!finite(p.y)||!finite(p.time))return p?{...p}:null;
      const w=usableWindow(src,i,cfg.maxGapSec,cfg.maxSpacingRatio,cfg.maxSpeedRatio,cfg.speedRatioFloorMps);
      if(!w)return {...p,smoothing:'RAW'};
      let x=0,y=0;
      for(let k=0;k<5;k++){x+=Number(w[k].x)*COEFF[k];y+=Number(w[k].y)*COEFF[k];}
      if(!Number.isFinite(x)||!Number.isFinite(y))return {...p,smoothing:'RAW'};
      smoothedSamples++;
      return {...p,x,y,smoothing:'SAVGOL_5_QUADRATIC'};
    });
    return {
      points:out,
      inputSamples:src.filter(Boolean).length,
      smoothedSamples,
      smoothingCoverage:src.length?+(smoothedSamples/src.length).toFixed(4):0,
      method:'SAVITZKY_GOLAY_5_POINT_QUADRATIC_FIXED_COEFFICIENTS',
      policy:'AUCUN_LISSAGE_A_TRAVERS_COUPE_PLAN_GAP_SUPERIEUR_A_1S_ECHANTILLONNAGE_IRREGULIER_OU_CHANGEMENT_BRUTAL_ALLURE'
    };
  }

  function pathDistance(points){
    let distance=0,seconds=0,pairs=0;
    for(let i=1;i<(points||[]).length;i++){
      const a=points[i-1],b=points[i];
      if(!a||!b||a.segment!==b.segment||![a.x,a.y,b.x,b.y,a.time,b.time].every(finite))continue;
      const dt=Number(b.time)-Number(a.time);if(!(dt>0))continue;
      distance+=Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y));seconds+=dt;pairs++;
    }
    return {distanceM:+distance.toFixed(4),seconds:+seconds.toFixed(4),pairs};
  }

  return {smoothSeries,pathDistance,coefficients:COEFF.slice()};
});
