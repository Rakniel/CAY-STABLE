(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallEventBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>Number.isFinite(Number(v));
  const round=(v,n=4)=>Number(Number(v).toFixed(n));
  const normType=v=>String(v||'').trim().toUpperCase();

  function normalizeEvent(raw){
    if(!raw)return null;
    const type=normType(raw.type??raw.eventType??raw.event_type);
    const time=finite(raw.time)?Number(raw.time):(finite(raw.timestamp)?Number(raw.timestamp):null);
    if(!type||time===null)return null;
    return {type,time,playerId:raw.playerId??raw.fromPlayerId??null,team:raw.team??raw.fromTeam??null,raw};
  }

  function matchEvents(truthEvents,predictedEvents,options){
    const cfg={timeToleranceSec:.75,eventTypes:['PASS','TURNOVER'],...(options||{})};
    const allowed=new Set((cfg.eventTypes||[]).map(normType));
    const truth=(truthEvents||[]).map(normalizeEvent).filter(Boolean).filter(e=>allowed.has(e.type)).sort((a,b)=>a.time-b.time);
    const pred=(predictedEvents||[]).map(normalizeEvent).filter(Boolean).filter(e=>allowed.has(e.type)).sort((a,b)=>a.time-b.time);
    const candidates=[];
    for(let ti=0;ti<truth.length;ti++)for(let pi=0;pi<pred.length;pi++){
      if(truth[ti].type!==pred[pi].type)continue;
      const dt=Math.abs(truth[ti].time-pred[pi].time);
      if(dt<=cfg.timeToleranceSec)candidates.push({ti,pi,dt});
    }
    candidates.sort((a,b)=>a.dt-b.dt);
    const usedT=new Set(),usedP=new Set(),matches=[];
    for(const c of candidates){if(usedT.has(c.ti)||usedP.has(c.pi))continue;usedT.add(c.ti);usedP.add(c.pi);matches.push(c);}
    return {truth,pred,matches,usedT,usedP,cfg};
  }

  function evaluateBallEvents(truthEvents,predictedEvents,options){
    const {truth,pred,matches,usedT,usedP,cfg}=matchEvents(truthEvents,predictedEvents,options);
    const tp=matches.length,fp=pred.length-usedP.size,fn=truth.length-usedT.size;
    const precision=tp+fp?tp/(tp+fp):0,recall=tp+fn?tp/(tp+fn):0,f1=precision+recall?2*precision*recall/(precision+recall):0;
    const byType={};
    for(const type of cfg.eventTypes){
      const T=truth.filter(e=>e.type===normType(type)),P=pred.filter(e=>e.type===normType(type));
      const M=matches.filter(m=>truth[m.ti].type===normType(type));
      const ttp=M.length,tfn=T.length-ttp,tfp=P.length-ttp;
      const p=ttp+tfp?ttp/(ttp+tfp):0,r=ttp+tfn?ttp/(ttp+tfn):0;
      byType[normType(type)]={truth:T.length,predicted:P.length,truePositives:ttp,falsePositives:tfp,falseNegatives:tfn,precision:round(p),recall:round(r),f1:round(p+r?2*p*r/(p+r):0)};
    }
    const meanTimingErrorSec=matches.length?matches.reduce((s,m)=>s+m.dt,0)/matches.length:null;
    return {
      quality:truth.length?'EVALUABLE':'INDISPONIBLE',reason:truth.length?null:'NO_REFERENCE_EVENTS',
      truthEvents:truth.length,predictedEvents:pred.length,truePositives:tp,falsePositives:fp,falseNegatives:fn,
      precision:round(precision),recall:round(recall),f1:round(f1),meanTimingErrorSec:meanTimingErrorSec===null?null:round(meanTimingErrorSec),
      byType,thresholds:{timeToleranceSec:cfg.timeToleranceSec,eventTypes:[...cfg.eventTypes]},
      provenance:'CAY_CLEAN_ROOM_EVENT_BENCHMARK_INSPIRED_BY_KLOPPY_STANDARDIZED_FOOTBALL_EVENT_MODELS_AND_IDSSE_SYNCHRONIZED_TRACKING_EVENT_DATA_NO_UPSTREAM_CODE_COPIED',
      rule:'COMPARE_BALL_EVENT_CHANGES_ON_SYNCHRONIZED_REFERENCE_DATA_BEFORE_PROMOTION'
    };
  }

  function compareBallEvents(truthEvents,beforePredicted,afterPredicted,options){
    const before=evaluateBallEvents(truthEvents,beforePredicted,options),after=evaluateBallEvents(truthEvents,afterPredicted,options);
    const d=k=>round(Number(after[k]||0)-Number(before[k]||0));
    return {before,after,delta:{precision:d('precision'),recall:d('recall'),f1:d('f1'),falsePositives:after.falsePositives-before.falsePositives,falseNegatives:after.falseNegatives-before.falseNegatives,meanTimingErrorSec:(before.meanTimingErrorSec===null||after.meanTimingErrorSec===null)?null:round(after.meanTimingErrorSec-before.meanTimingErrorSec)}};
  }

  return {normalizeEvent,matchEvents,evaluateBallEvents,compareBallEvents};
});
