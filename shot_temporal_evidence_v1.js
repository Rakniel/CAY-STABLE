(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYShotTemporalEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const configured=(v,f)=>finite(v)?Number(v):f;
  const pointOf=row=>{
    const b=row&&row.ball;
    if(!b||b.valid===false||b.visible===false)return null;
    const x=finite(b.pitchX)?Number(b.pitchX):(finite(b.xM)?Number(b.xM):null);
    const y=finite(b.pitchY)?Number(b.pitchY):(finite(b.yM)?Number(b.yM):null);
    if(x===null||y===null)return null;
    return {x,y,confidence:finite(b.confidence)?clamp01(b.confidence):0};
  };
  const continuityKey=row=>row?.segment??row?.segmentId??row?.planId??row?.shotId??null;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  function analyze(samples,options){
    const raw=options||{};
    const cfg={
      minBallConfidence:configured(raw.minBallConfidence,.65),
      minKickEvidence:configured(raw.minKickEvidence,.70),
      minBallSpeedMps:configured(raw.minBallSpeedMps,12),
      minBallAccelerationMps2:configured(raw.minBallAccelerationMps2,6),
      evidenceWindowSec:configured(raw.evidenceWindowSec,.30),
      minEvidenceFrames:Math.max(2,Math.round(configured(raw.minEvidenceFrames,2))),
      maxObservationGapSec:configured(raw.maxObservationGapSec,.20),
      cooldownSec:configured(raw.cooldownSec,.80)
    };
    const rows=(samples||[]).filter(r=>finite(r?.time)).slice().sort((a,b)=>Number(a.time)-Number(b.time));
    if(rows.length<3)return {quality:'INDISPONIBLE',reason:'INSUFFICIENT_TIMELINE',candidates:[],candidateCount:0};
    let prevBall=null,prevTime=null,prevSpeed=null,prevKey=null,lastCandidateAt=-Infinity;
    const evidence=[],candidates=[];
    for(const row of rows){
      const t=Number(row.time),ball=pointOf(row),key=continuityKey(row);
      if(!ball||ball.confidence<cfg.minBallConfidence){prevBall=null;prevTime=null;prevSpeed=null;prevKey=key;continue;}
      let speed=null,accel=null;
      if(prevBall&&prevTime!==null&&key===prevKey){
        const dt=t-prevTime;
        if(dt>0&&dt<=cfg.maxObservationGapSec){
          speed=distance(ball,prevBall)/dt;
          if(prevSpeed!==null)accel=(speed-prevSpeed)/dt;
        }
      }
      const kickEvidence=finite(row.kickEvidenceScore)?clamp01(row.kickEvidenceScore):(finite(row.kickScore)?clamp01(row.kickScore):0);
      const strong=kickEvidence>=cfg.minKickEvidence&&speed!==null&&speed>=cfg.minBallSpeedMps&&accel!==null&&accel>=cfg.minBallAccelerationMps2;
      if(strong){
        evidence.push({time:t,key,kickEvidence,speed,accel,ball:{x:ball.x,y:ball.y}});
        while(evidence.length&&t-evidence[0].time>cfg.evidenceWindowSec)evidence.shift();
        const sameKey=evidence.filter(e=>e.key===key);
        if(sameKey.length>=cfg.minEvidenceFrames&&t-lastCandidateAt>=cfg.cooldownSec){
          const e=sameKey[sameKey.length-1];
          candidates.push({type:'SHOT_CANDIDATE',time:Number(t.toFixed(3)),quality:'A_VERIFIER',publishable:false,reason:'TEMPORAL_MULTI_SIGNAL_EVIDENCE',kickEvidence:Number(e.kickEvidence.toFixed(3)),ballSpeedMps:Number(e.speed.toFixed(3)),ballAccelerationMps2:Number(e.accel.toFixed(3)),evidenceFrames:sameKey.length,continuityKey:key});
          lastCandidateAt=t;
          evidence.length=0;
        }
      }else if(evidence.length){
        while(evidence.length&&t-evidence[0].time>cfg.evidenceWindowSec)evidence.shift();
      }
      if(speed!==null)prevSpeed=speed;
      prevBall=ball;prevTime=t;prevKey=key;
    }
    return {quality:'A_VERIFIER',reason:null,candidates,candidateCount:candidates.length,publicationPolicy:'NEVER_AUTO_PUBLISH'};
  }
  return {analyze};
});
