(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallPlayerDriftGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const idOf=p=>p?(p.id??p.trackId??p.playerId??p.globalId??null):null;

  function keyOf(ctx){const v=ctx?.segmentId??ctx?.segment??ctx?.shotId??ctx?.planId;return v===undefined||v===null?null:String(v);}
  function ballPoint(ball){
    if(!ball)return null;
    if(finite(ball.pitchX)&&finite(ball.pitchY))return {x:Number(ball.pitchX),y:Number(ball.pitchY),space:'pitch'};
    if(finite(ball.xM)&&finite(ball.yM))return {x:Number(ball.xM),y:Number(ball.yM),space:'pitch'};
    if(finite(ball.x)&&finite(ball.y))return {x:Number(ball.x),y:Number(ball.y),space:'image'};
    return null;
  }
  function playerPoint(player,space){
    if(!player)return null;
    if(space==='pitch'){
      if(finite(player.pitchX)&&finite(player.pitchY))return {x:Number(player.pitchX),y:Number(player.pitchY)};
      if(finite(player.xM)&&finite(player.yM))return {x:Number(player.xM),y:Number(player.yM)};
      return null;
    }
    if(finite(player.x)&&finite(player.y))return {x:Number(player.x),y:Number(player.y)};
    const b=player.bbox||player.box||player.b;
    if(b&&[b.x,b.y,b.w,b.h].every(finite))return {x:Number(b.x)+Number(b.w)*.5,y:Number(b.y)+Number(b.h)*.82};
    return null;
  }
  function candidateArea(ball){
    if(finite(ball?.area))return Math.max(0,Number(ball.area));
    const b=ball?.bbox||ball?.box||ball?.b;
    if(b&&finite(b.w)&&finite(b.h))return Math.max(0,Number(b.w)*Number(b.h));
    if(b&&[b.x1,b.y1,b.x2,b.y2].every(finite))return Math.max(0,(Number(b.x2)-Number(b.x1))*(Number(b.y2)-Number(b.y1)));
    return null;
  }
  function nearestPlayer(ball,players,cfg){
    const bp=ballPoint(ball);if(!bp)return null;
    let best=null;
    for(const player of players||[]){
      if(player?.bench===true||player?.spectator===true||player?.onField===false)continue;
      const pp=playerPoint(player,bp.space);if(!pp)continue;
      const d=Math.hypot(bp.x-pp.x,bp.y-pp.y),limit=bp.space==='pitch'?cfg.playerNearPitchM:cfg.playerNearImage;
      if(d<=limit&&(!best||d<best.distance))best={player,playerId:idOf(player),distance:d,limit,point:pp,ballPoint:bp};
    }
    return best;
  }
  function create(options){
    const raw=options||{};
    const cfg={
      minAttachedSec:finite(raw.minAttachedSec)?Math.max(.1,Number(raw.minAttachedSec)):.32,
      maxGapSec:finite(raw.maxGapSec)?Math.max(.05,Number(raw.maxGapSec)):.25,
      playerNearPitchM:finite(raw.playerNearPitchM)?Math.max(.2,Number(raw.playerNearPitchM)):1.25,
      playerNearImage:finite(raw.playerNearImage)?Math.max(.005,Number(raw.playerNearImage)):.055,
      stableRelativePitchM:finite(raw.stableRelativePitchM)?Math.max(.05,Number(raw.stableRelativePitchM)):.42,
      stableRelativeImage:finite(raw.stableRelativeImage)?Math.max(.002,Number(raw.stableRelativeImage)):.018,
      lowConfidence:finite(raw.lowConfidence)?clamp01(raw.lowConfidence):.30,
      areaGrowthRatio:finite(raw.areaGrowthRatio)?Math.max(1.2,Number(raw.areaGrowthRatio)):3.5,
      minEvidence:finite(raw.minEvidence)?Math.max(2,Math.round(Number(raw.minEvidence))):2
    };
    const state={lastTime:null,lastKey:null,attachment:null,baselineAreas:[],driftRejects:0,resets:0};
    function reset(reason){state.lastTime=null;state.lastKey=null;state.attachment=null;state.baselineAreas=[];state.resets++;return reason||'manual';}
    function median(values){const a=(values||[]).filter(finite).map(Number).sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
    function evaluate(ball,players,time,context){
      const t=finite(time)?Number(time):null,key=keyOf(context);
      if(state.lastTime!==null&&t!==null&&t-state.lastTime>cfg.maxGapSec)reset('gap');
      if(state.lastKey!==null&&key!==null&&state.lastKey!==key)reset('segment');
      const near=nearestPlayer(ball,players,cfg),area=candidateArea(ball),confidence=finite(ball?.confidence)?clamp01(ball.confidence):null;
      if(!near){
        if(area!==null){state.baselineAreas.push(area);if(state.baselineAreas.length>12)state.baselineAreas.shift();}
        state.attachment=null;if(t!==null)state.lastTime=t;if(key!==null)state.lastKey=key;
        return {status:'CLEAR',reason:'NOT_ATTACHED_TO_PLAYER',drifted:false};
      }
      const pid=near.playerId===null?'__UNKNOWN__':String(near.playerId),bp=near.ballPoint,pp=near.point;
      if(!state.attachment||state.attachment.playerId!==pid||state.attachment.space!==bp.space){
        state.attachment={playerId:pid,space:bp.space,startTime:t,lastTime:t,samples:[]};
      }
      const rel={x:bp.x-pp.x,y:bp.y-pp.y,time:t};state.attachment.samples.push(rel);if(state.attachment.samples.length>20)state.attachment.samples.shift();state.attachment.lastTime=t;
      const duration=t!==null&&state.attachment.startTime!==null?Math.max(0,t-state.attachment.startTime):0;
      const first=state.attachment.samples[0],relativeTravel=first?Math.hypot(rel.x-first.x,rel.y-first.y):Infinity;
      const relativeLimit=bp.space==='pitch'?cfg.stableRelativePitchM:cfg.stableRelativeImage;
      const stableRelative=duration>=cfg.minAttachedSec&&relativeTravel<=relativeLimit;
      const lowConfidence=confidence!==null&&confidence<=cfg.lowConfidence;
      const propagated=ball?.propagated===true||ball?.interpolated===true||ball?.driftRisk===true;
      const baselineArea=median(state.baselineAreas),areaRatio=area!==null&&baselineArea!==null&&baselineArea>0?area/baselineArea:null;
      const areaGrowth=areaRatio!==null&&areaRatio>=cfg.areaGrowthRatio;
      const evidence=[stableRelative,lowConfidence,propagated,areaGrowth].filter(Boolean).length;
      const drifted=duration>=cfg.minAttachedSec&&evidence>=cfg.minEvidence;
      if(drifted)state.driftRejects++;
      if(t!==null)state.lastTime=t;if(key!==null)state.lastKey=key;
      return {
        status:drifted?'DRIFTED':'WATCH',drifted,reason:drifted?'SUSTAINED_PLAYER_ATTACHMENT_WITH_DRIFT_EVIDENCE':'PLAYER_OVERLAP_NOT_YET_DEFENDABLE_AS_DRIFT',
        playerId:near.playerId,durationSec:+duration.toFixed(3),distanceToPlayer:+near.distance.toFixed(4),space:bp.space,
        evidence:{stableRelative,lowConfidence,propagated,areaGrowth,count:evidence,required:cfg.minEvidence,areaRatio:areaRatio===null?null:+areaRatio.toFixed(3)},
        policy:'REJECT_ONLY_AFTER_SUSTAINED_PLAYER_ATTACHMENT_PLUS_MULTIPLE_DRIFT_SIGNALS'
      };
    }
    function snapshot(){return {config:{...cfg},lastTime:state.lastTime,lastKey:state.lastKey,driftRejects:state.driftRejects,resets:state.resets,attachment:state.attachment?{...state.attachment,samples:state.attachment.samples.map(x=>({...x}))}:null};}
    return {evaluate,reset,snapshot};
  }
  return {create,nearestPlayer};
});
