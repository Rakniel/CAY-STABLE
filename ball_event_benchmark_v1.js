(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYBallEventBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>Number.isFinite(Number(v));
  const round=(v,n=4)=>Number(Number(v).toFixed(n));
  const normType=v=>String(v||'').trim().toUpperCase();
  const present=v=>v!==undefined&&v!==null&&String(v).trim()!=='';
  const sameId=(a,b)=>String(a)===String(b);

  function normalizeEvent(raw){
    if(!raw)return null;
    const type=normType(raw.type??raw.eventType??raw.event_type);
    const time=finite(raw.time)?Number(raw.time):(finite(raw.timestamp)?Number(raw.timestamp):null);
    if(!type||time===null)return null;
    return {
      type,time,
      playerId:raw.playerId??raw.fromPlayerId??raw.player_id??null,
      toPlayerId:raw.toPlayerId??raw.receiverPlayerId??raw.receiver_player_id??null,
      team:raw.team??raw.fromTeam??raw.teamId??raw.team_id??null,
      toTeam:raw.toTeam??raw.receiverTeam??raw.receiver_team_id??null,
      raw
    };
  }

  function identityCompatibility(truth,pred,cfg){
    const requireWhenReferencePresent=cfg.identityMode!=='off';
    if(!requireWhenReferencePresent)return {ok:true,checked:[]};
    const checked=[];
    const compare=(field,label)=>{
      if(!present(truth[field]))return true;
      checked.push(label);
      return present(pred[field])&&sameId(truth[field],pred[field]);
    };
    if(!compare('playerId','actor'))return {ok:false,checked,reason:'ACTOR_ID_MISMATCH'};
    if(!compare('team','team'))return {ok:false,checked,reason:'TEAM_ID_MISMATCH'};
    if(truth.type==='PASS'&&cfg.requirePassReceiverWhenReferencePresent!==false){
      if(!compare('toPlayerId','receiver'))return {ok:false,checked,reason:'RECEIVER_ID_MISMATCH'};
      if(!compare('toTeam','receiverTeam'))return {ok:false,checked,reason:'RECEIVER_TEAM_MISMATCH'};
    }
    return {ok:true,checked};
  }

  // Maximum-cardinality bipartite matching prevents a locally closest event from
  // consuming the only valid prediction available to another reference event.
  // Adjacency is ordered by timing error so ties remain biased toward closer events.
  function maximumCardinalityMatching(candidates,truthCount,predCount){
    const adjacency=Array.from({length:truthCount},()=>[]);
    for(const c of candidates)adjacency[c.ti].push(c);
    for(const row of adjacency)row.sort((a,b)=>a.dt-b.dt||a.pi-b.pi);
    const truthOrder=Array.from({length:truthCount},(_,i)=>i)
      .sort((a,b)=>adjacency[a].length-adjacency[b].length||a-b);
    const matchedTruthByPred=Array(predCount).fill(-1);
    const chosenByTruth=Array(truthCount).fill(null);
    const augment=(ti,seenPred)=>{
      for(const c of adjacency[ti]){
        if(seenPred.has(c.pi))continue;
        seenPred.add(c.pi);
        const previousTruth=matchedTruthByPred[c.pi];
        if(previousTruth===-1||augment(previousTruth,seenPred)){
          matchedTruthByPred[c.pi]=ti;
          chosenByTruth[ti]=c;
          return true;
        }
      }
      return false;
    };
    for(const ti of truthOrder)augment(ti,new Set());
    return chosenByTruth.filter(Boolean);
  }

  function matchEvents(truthEvents,predictedEvents,options){
    const cfg={timeToleranceSec:.75,eventTypes:['PASS','TURNOVER'],identityMode:'when_reference_present',requirePassReceiverWhenReferencePresent:true,...(options||{})};
    const allowed=new Set((cfg.eventTypes||[]).map(normType));
    const truth=(truthEvents||[]).map(normalizeEvent).filter(Boolean).filter(e=>allowed.has(e.type)).sort((a,b)=>a.time-b.time);
    const pred=(predictedEvents||[]).map(normalizeEvent).filter(Boolean).filter(e=>allowed.has(e.type)).sort((a,b)=>a.time-b.time);
    const candidates=[],identityRejected=[];
    for(let ti=0;ti<truth.length;ti++)for(let pi=0;pi<pred.length;pi++){
      if(truth[ti].type!==pred[pi].type)continue;
      const dt=Math.abs(truth[ti].time-pred[pi].time);
      if(dt>cfg.timeToleranceSec)continue;
      const identity=identityCompatibility(truth[ti],pred[pi],cfg);
      if(!identity.ok){identityRejected.push({ti,pi,dt,reason:identity.reason,checked:identity.checked});continue;}
      candidates.push({ti,pi,dt,identityChecked:identity.checked});
    }
    const matches=maximumCardinalityMatching(candidates,truth.length,pred.length);
    const usedT=new Set(matches.map(c=>c.ti)),usedP=new Set(matches.map(c=>c.pi));
    return {truth,pred,matches,usedT,usedP,cfg,identityRejected};
  }

  function evaluateBallEvents(truthEvents,predictedEvents,options){
    const {truth,pred,matches,usedT,usedP,cfg,identityRejected}=matchEvents(truthEvents,predictedEvents,options);
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
    const identityCheckedMatches=matches.filter(m=>Array.isArray(m.identityChecked)&&m.identityChecked.length).length;
    const identityRejectedByReason={};
    for(const row of identityRejected)identityRejectedByReason[row.reason]=(identityRejectedByReason[row.reason]||0)+1;
    return {
      quality:truth.length?'EVALUABLE':'INDISPONIBLE',reason:truth.length?null:'NO_REFERENCE_EVENTS',
      truthEvents:truth.length,predictedEvents:pred.length,truePositives:tp,falsePositives:fp,falseNegatives:fn,
      precision:round(precision),recall:round(recall),f1:round(f1),meanTimingErrorSec:meanTimingErrorSec===null?null:round(meanTimingErrorSec),
      byType,
      identityEvidence:{mode:cfg.identityMode,identityCheckedMatches,identityRejectedCandidates:identityRejected.length,rejectedByReason:identityRejectedByReason},
      thresholds:{timeToleranceSec:cfg.timeToleranceSec,eventTypes:[...cfg.eventTypes],identityMode:cfg.identityMode,requirePassReceiverWhenReferencePresent:cfg.requirePassReceiverWhenReferencePresent!==false},
      provenance:'CAY_CLEAN_ROOM_EVENT_BENCHMARK_INSPIRED_BY_SOCCERACTION_SPADL_ACTION_IDENTITY_FIELDS_KLOPPY_STANDARDIZED_FOOTBALL_EVENT_MODELS_AND_TRACKEVAL_GLOBAL_ASSIGNMENT_PRINCIPLE_NO_UPSTREAM_CODE_COPIED',
      rule:'COMPARE_BALL_EVENT_CHANGES_ON_SYNCHRONIZED_REFERENCE_DATA_REQUIRE_REFERENCE_ATTRIBUTION_WHEN_AVAILABLE_AND_MAXIMIZE_VALID_ONE_TO_ONE_EVENT_MATCHES_BEFORE_PROMOTION'
    };
  }

  function compareBallEvents(truthEvents,beforePredicted,afterPredicted,options){
    const before=evaluateBallEvents(truthEvents,beforePredicted,options),after=evaluateBallEvents(truthEvents,afterPredicted,options);
    const d=k=>round(Number(after[k]||0)-Number(before[k]||0));
    return {before,after,delta:{precision:d('precision'),recall:d('recall'),f1:d('f1'),falsePositives:after.falsePositives-before.falsePositives,falseNegatives:after.falseNegatives-before.falseNegatives,meanTimingErrorSec:(before.meanTimingErrorSec===null||after.meanTimingErrorSec===null)?null:round(after.meanTimingErrorSec-before.meanTimingErrorSec)}};
  }

  return {normalizeEvent,identityCompatibility,maximumCardinalityMatching,matchEvents,evaluateBallEvents,compareBallEvents};
});