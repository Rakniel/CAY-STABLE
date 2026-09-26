(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./tracking_eval_metrics_v1.js'):root.CAYTrackingEval
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingIdentityEpisodeEval=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(TrackingEval){
  'use strict';
  const VERSION='CAY_TRACKING_IDENTITY_EPISODE_EVAL_V1_3';
  const finite=v=>Number.isFinite(Number(v));
  const round=(v,n=4)=>Number(Number(v).toFixed(n));
  const idOf=o=>o?(o.id??o.trackId??o.playerId??null):null;
  const continuityValidated=row=>row&&(row.segmentContinuityValidated===true||row.continuityValidated===true||row.boundaryContinuityValidated===true);

  function evaluateIdentityEpisodes(frames,options){
    const cfg={minIou:.5,minLongGapFrames:8,...(options||{})};
    const rows=(frames||[]).slice().sort((a,b)=>Number(a.frame??a.time??0)-Number(b.frame??b.time??0));
    if(!TrackingEval||typeof TrackingEval.greedyMatch!=='function'){
      return {version:VERSION,quality:'INDISPONIBLE',reason:'tracking_eval_unavailable'};
    }

    const state=new Map();
    let attempts=0,recovered=0,longGapAttempts=0,longGapRecovered=0,crossSegmentAttempts=0,crossSegmentRecovered=0;
    let unsafeCrossSegmentSameId=0,validatedCrossSegmentSameId=0;
    let gtAttempts=0,gtRecovered=0,gtLongGapAttempts=0,gtLongGapRecovered=0,gtCrossSegmentAttempts=0,gtCrossSegmentRecovered=0;
    const episodes=[],groundTruthReentryEpisodes=[];

    for(let ri=0;ri<rows.length;ri++){
      const row=rows[ri]||{};
      const frame=finite(row.frame)?Number(row.frame):(finite(row.time)?Number(row.time):ri);
      const segment=String(row.segmentId??row.segment??'default');
      const boundaryValidated=continuityValidated(row);
      const truth=(row.truth||row.groundTruth||[]).filter(x=>idOf(x)!==null);
      const preds=(row.predictions||row.predicted||[]).filter(x=>idOf(x)!==null);
      const matched=TrackingEval.greedyMatch(truth,preds,cfg.minIou).matches;
      const matchedByTruth=new Map();
      for(const m of matched)matchedByTruth.set(idOf(truth[m.ti]),idOf(preds[m.pi]));

      for(const t of truth){
        const tid=idOf(t),pid=matchedByTruth.has(tid)?matchedByTruth.get(tid):null;
        const s=state.get(tid)||{lastPred:null,lastMatchedFrame:null,lastTruthFrame:null,lastTruthSegment:null,everMatched:false,everTruthSeen:false};

        const gtGap=s.lastTruthFrame!==null?Math.max(0,frame-s.lastTruthFrame-1):0;
        const gtCrossedSegment=s.lastTruthSegment!==null&&s.lastTruthSegment!==segment;
        const gtOpportunity=s.everTruthSeen&&(gtGap>0||gtCrossedSegment);
        if(gtOpportunity){
          const same=s.lastPred!==null&&pid!==null&&s.lastPred===pid;
          gtAttempts++; if(same)gtRecovered++;
          if(gtGap>=cfg.minLongGapFrames){gtLongGapAttempts++;if(same)gtLongGapRecovered++;}
          if(gtCrossedSegment){gtCrossSegmentAttempts++;if(same)gtCrossSegmentRecovered++;}
          groundTruthReentryEpisodes.push({truthId:tid,fromPredictionId:s.lastPred,toPredictionId:pid,gapFrames:gtGap,crossedSegment:gtCrossedSegment,boundaryContinuityValidated:boundaryValidated,recovered:same,frame,segment});
        }

        if(pid!==null){
          const gap=s.everMatched&&s.lastMatchedFrame!==null?Math.max(0,frame-s.lastMatchedFrame-1):0;
          const crossedSegment=s.everMatched&&s.lastTruthSegment!==null&&s.lastTruthSegment!==segment;
          const isAttempt=s.everMatched&&(gap>0||crossedSegment);
          if(isAttempt){
            const same=s.lastPred===pid;
            attempts++; if(same)recovered++;
            if(gap>=cfg.minLongGapFrames){longGapAttempts++;if(same)longGapRecovered++;}
            if(crossedSegment){
              crossSegmentAttempts++;if(same)crossSegmentRecovered++;
              if(same&&boundaryValidated)validatedCrossSegmentSameId++;
              if(same&&!boundaryValidated)unsafeCrossSegmentSameId++;
            }
            episodes.push({truthId:tid,fromPredictionId:s.lastPred,toPredictionId:pid,gapFrames:gap,crossedSegment,boundaryContinuityValidated:boundaryValidated,recovered:same,unsafeCrossSegmentCarryover:crossedSegment&&same&&!boundaryValidated,frame,segment});
          }
          s.lastPred=pid;s.lastMatchedFrame=frame;s.everMatched=true;
        }
        s.lastTruthFrame=frame;s.lastTruthSegment=segment;s.everTruthSeen=true;
        state.set(tid,s);
      }
    }

    const rate=(n,d)=>d?round(n/d):null;
    return {
      version:VERSION,
      quality:attempts?'EVALUABLE':'INDISPONIBLE',
      reason:attempts?null:'no_reidentification_opportunity',
      reidAttempts:attempts,reidRecoveredSameId:recovered,reidRecoveryRate:rate(recovered,attempts),
      longGapThresholdFrames:cfg.minLongGapFrames,longGapAttempts,longGapRecovered,longGapRecoveryRate:rate(longGapRecovered,longGapAttempts),
      crossSegmentAttempts,crossSegmentRecovered,crossSegmentRecoveryRate:rate(crossSegmentRecovered,crossSegmentAttempts),
      unsafeCrossSegmentSameId,validatedCrossSegmentSameId,
      crossSegmentSafetyQuality:crossSegmentAttempts?'EVALUABLE':'INDISPONIBLE',
      crossSegmentUnsafeCarryoverRate:rate(unsafeCrossSegmentSameId,crossSegmentAttempts),
      failedReidentifications:attempts-recovered,
      episodes,
      groundTruthReentryQuality:gtAttempts?'EVALUABLE':'INDISPONIBLE',
      groundTruthReentryAttempts:gtAttempts,groundTruthReentryRecoveredSameId:gtRecovered,groundTruthReentryRecoveryRate:rate(gtRecovered,gtAttempts),
      groundTruthLongGapAttempts:gtLongGapAttempts,groundTruthLongGapRecovered:gtLongGapRecovered,groundTruthLongGapRecoveryRate:rate(gtLongGapRecovered,gtLongGapAttempts),
      groundTruthCrossSegmentAttempts:gtCrossSegmentAttempts,groundTruthCrossSegmentRecovered:gtCrossSegmentRecovered,groundTruthCrossSegmentRecoveryRate:rate(gtCrossSegmentRecovered,gtCrossSegmentAttempts),
      groundTruthFailedReidentifications:gtAttempts-gtRecovered,
      groundTruthReentryEpisodes,
      provenance:'CAY_CLEAN_ROOM_IDENTITY_EPISODE_METRIC_INSPIRED_BY_TRACKLAB_TRACKEVAL_SOCCERNET_AND_SPORT_REENTRY_EVALUATION_GOALS_NO_UPSTREAM_CODE_COPIED',
      rule:'COMPARE_PERSISTENT_PLAYER_ID_RECOVERY_AFTER_GROUND_TRUTH_REENTRY; NEVER_TREAT_UNVALIDATED_CROSS_SEGMENT_SAME_ID_AS_SAFE_CONTINUITY'
    };
  }

  function compareIdentityEpisodes(beforeFrames,afterFrames,options){
    const before=evaluateIdentityEpisodes(beforeFrames,options),after=evaluateIdentityEpisodes(afterFrames,options);
    const delta=(a,b)=>a===null||b===null?null:round(Number(b)-Number(a));
    return {before,after,delta:{
      reidRecoveryRate:delta(before.reidRecoveryRate,after.reidRecoveryRate),
      longGapRecoveryRate:delta(before.longGapRecoveryRate,after.longGapRecoveryRate),
      crossSegmentRecoveryRate:delta(before.crossSegmentRecoveryRate,after.crossSegmentRecoveryRate),
      crossSegmentUnsafeCarryoverRate:delta(before.crossSegmentUnsafeCarryoverRate,after.crossSegmentUnsafeCarryoverRate),
      unsafeCrossSegmentSameId:after.unsafeCrossSegmentSameId-before.unsafeCrossSegmentSameId,
      failedReidentifications:after.failedReidentifications-before.failedReidentifications,
      groundTruthReentryRecoveryRate:delta(before.groundTruthReentryRecoveryRate,after.groundTruthReentryRecoveryRate),
      groundTruthLongGapRecoveryRate:delta(before.groundTruthLongGapRecoveryRate,after.groundTruthLongGapRecoveryRate),
      groundTruthCrossSegmentRecoveryRate:delta(before.groundTruthCrossSegmentRecoveryRate,after.groundTruthCrossSegmentRecoveryRate),
      groundTruthFailedReidentifications:after.groundTruthFailedReidentifications-before.groundTruthFailedReidentifications
    }};
  }

  return {VERSION,evaluateIdentityEpisodes,compareIdentityEpisodes};
});
