(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports ? require('./metric_motion_plausibility_v1.js') : root.CAYMetricMotionPlausibility);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricPlayerKinematics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Motion){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const round=(v,n=4)=>+Number(v).toFixed(n);
  const unavailable=reason=>({status:'INDISPONIBLE',reason,distanceM:null,avgSpeedKmh:null,maxSpeedKmh:null,sprintDistanceM:null,sprintCount:null,metricCoverage:0,quality:'INDISPONIBLE'});

  function build(trajectory,options){
    const defaults={minMetricCoverage:.35,minCalibrationConfidence:.5,maxGapSec:1,maxRawSpeedKmh:Number(Motion&&Motion.RAW_SPIKE_THRESHOLD_KMH)||55,sprintThresholdKmh:25,minSprintDurationSec:1};
    const opts=Object.assign({},defaults,options||{});
    if(!trajectory||trajectory.status!=='DISPONIBLE'||!Array.isArray(trajectory.runs))return unavailable('trajectoire terrain métrique indisponible');
    const metricCoverage=finite(trajectory.metricCoverage)?clamp(Number(trajectory.metricCoverage),0,1):0;
    const avgCalibrationConfidence=finite(trajectory.avgCalibrationConfidence)?clamp(Number(trajectory.avgCalibrationConfidence),0,1):null;
    if(metricCoverage<clamp(Number(opts.minMetricCoverage)||0,0,1))return unavailable('couverture métrique insuffisante pour des métriques physiques défendables');
    if(avgCalibrationConfidence===null||avgCalibrationConfidence<clamp(Number(opts.minCalibrationConfidence)||0,0,1))return unavailable('confiance calibration insuffisante pour des métriques physiques défendables');

    let distanceM=0,validSeconds=0,maxSpeedKmh=0,rejectedPairs=0;
    const intervals=[];
    for(const run of trajectory.runs){
      const points=Array.isArray(run)?run:[];
      for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i];
        if(!finite(a&&a.time)||!finite(b&&b.time))continue;
        const dt=Number(b.time)-Number(a.time);
        if(!(dt>0)||(Number(opts.maxGapSec)>0&&dt>Number(opts.maxGapSec))continue;
        const evidence=Motion&&typeof Motion.transitionEvidence==='function'?Motion.transitionEvidence(a,b,opts.maxRawSpeedKmh):{plausible:false,speedKmh:null};
        if(!evidence.plausible||!finite(evidence.speedKmh)){rejectedPairs++;continue;}
        const d=Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y));
        if(!finite(d))continue;
        const speedKmh=Number(evidence.speedKmh);
        distanceM+=d;validSeconds+=dt;maxSpeedKmh=Math.max(maxSpeedKmh,speedKmh);
        intervals.push({start:Number(a.time),end:Number(b.time),dt,distanceM:d,speedKmh});
      }
    }
    if(!(validSeconds>0)||!intervals.length)return unavailable('aucun intervalle métrique temporel physiquement plausible');

    let sprintDistanceM=0,sprintCount=0,sprintSeconds=0,current=null;
    const threshold=Math.max(0,Number(opts.sprintThresholdKmh)||25),minDuration=Math.max(0,Number(opts.minSprintDurationSec)||1);
    const flush=()=>{if(current&&current.seconds>=minDuration){sprintCount++;sprintDistanceM+=current.distance;sprintSeconds+=current.seconds;}current=null;};
    for(const item of intervals){
      if(item.speedKmh<threshold){flush();continue;}
      if(!current||Math.abs(item.start-current.end)>1e-6){flush();current={end:item.end,seconds:item.dt,distance:item.distanceM};}
      else{current.end=item.end;current.seconds+=item.dt;current.distance+=item.distanceM;}
    }
    flush();
    const score=metricCoverage*avgCalibrationConfidence;
    return {
      status:'DISPONIBLE',reason:null,coordinateSystem:'PITCH_METERS',distanceM:round(distanceM,3),validSeconds:round(validSeconds,3),avgSpeedKmh:round((distanceM/validSeconds)*3.6,3),maxSpeedKmh:round(maxSpeedKmh,3),sprintThresholdKmh:threshold,minSprintDurationSec:minDuration,sprintDistanceM:round(sprintDistanceM,3),sprintSeconds:round(sprintSeconds,3),sprintCount,rejectedPairs,metricCoverage:round(metricCoverage),avgCalibrationConfidence:round(avgCalibrationConfidence),defendableScore:round(score),quality:score>=.8?'FIABLE':'PARTIEL',interpolation:'NONE',policy:'DISTANCE_ET_VITESSE_UNIQUEMENT_SUR_TRAJECTOIRE_METRIQUE_VALIDEE; COUPURE_GAPS_ET_SPIKES; SPRINTS_CONTIGUS_SANS_INTERPOLATION'
    };
  }
  return {build};
});
