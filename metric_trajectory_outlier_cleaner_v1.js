(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricTrajectoryOutlierCleaner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const DEFAULT_MAX_SPEED_KMH=55;
  const DEFAULT_MAX_GAP_SEC=1;
  function transitionSpeedKmh(a,b){
    if(!a||!b||![a.x,a.y,b.x,b.y,a.time,b.time].every(finite))return null;
    const dt=Number(b.time)-Number(a.time);if(!(dt>0))return null;
    return Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y))/dt*3.6;
  }
  function clean(points,options){
    const cfg={maxSpeedKmh:DEFAULT_MAX_SPEED_KMH,maxGapSec:DEFAULT_MAX_GAP_SEC,...(options||{})};
    const maxSpeedKmh=finite(cfg.maxSpeedKmh)&&Number(cfg.maxSpeedKmh)>0?Number(cfg.maxSpeedKmh):DEFAULT_MAX_SPEED_KMH;
    const maxGapSec=finite(cfg.maxGapSec)&&Number(cfg.maxGapSec)>0?Number(cfg.maxGapSec):DEFAULT_MAX_GAP_SEC;
    const src=Array.isArray(points)?points:[],accepted=[],runs=[];let run=[],anchor=null,rejected=[];
    const flush=()=>{if(run.length){runs.push(run);run=[];}anchor=null;};
    src.forEach((p,index)=>{
      if(!p||![p.x,p.y,p.time].every(finite)||p.segment===undefined||p.segment===null){flush();return;}
      const current={...p};
      if(!anchor){anchor=current;run.push(current);accepted.push(current);return;}
      const dt=Number(current.time)-Number(anchor.time);
      if(current.segment!==anchor.segment||!(dt>0)||dt>maxGapSec){flush();anchor=current;run.push(current);accepted.push(current);return;}
      const speedKmh=transitionSpeedKmh(anchor,current);
      if(speedKmh===null||speedKmh>maxSpeedKmh){
        rejected.push({index,segment:current.segment,time:Number(current.time),speedKmh:speedKmh===null?null:+speedKmh.toFixed(3),reason:speedKmh===null?'TRANSITION_INVALIDE':'PIC_VITESSE_BRUTE'});
        return;
      }
      anchor=current;run.push(current);accepted.push(current);
    });
    flush();
    const inputSamples=src.filter(Boolean).length;
    return {
      points:accepted,runs,rejected,inputSamples,
      acceptedSamples:accepted.length,
      rejectedSamples:rejected.length,
      acceptanceCoverage:inputSamples?+(accepted.length/inputSamples).toFixed(4):0,
      maxSpeedKmh,maxGapSec,
      method:'SPEED_OUTLIER_SKIP_WITH_LAST_ACCEPTED_ANCHOR',
      policy:'AUCUNE_INTERPOLATION_POINT_REJETE_NON_UTILISE_COMME_NOUVELLE_ANCRE_MEME_PLAN_GAP_COURT_COORDONNEES_TERRAIN_VALIDES'
    };
  }
  function pathDistance(cleaned){
    let distanceM=0,seconds=0,pairs=0;
    for(const run of cleaned?.runs||[]){for(let i=1;i<run.length;i++){
      const a=run[i-1],b=run[i],dt=Number(b.time)-Number(a.time);if(!(dt>0))continue;
      distanceM+=Math.hypot(Number(b.x)-Number(a.x),Number(b.y)-Number(a.y));seconds+=dt;pairs++;
    }}
    return {distanceM:+distanceM.toFixed(4),seconds:+seconds.toFixed(4),pairs};
  }
  return {DEFAULT_MAX_SPEED_KMH,DEFAULT_MAX_GAP_SEC,transitionSpeedKmh,clean,pathDistance};
});
