(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./tracking_eval_metrics_v1.js'):root.CAYTrackingEval
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingIdentityEpisodeEval=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(TrackingEval){
  'use strict';
  const finite=v=>Number.isFinite(Number(v));
  const round=(v,n=4)=>Number(Number(v).toFixed(n));
  const idOf=o=>o?(o.id??o.trackId??o.playerId??null):null;

  function evaluateIdentityEpisodes(frames,options){
    const cfg={minIou:.5,minLongGapFrames:8,...(options||{})};
    const rows=(frames||[]).slice().sort((a,b)=>Number(a.frame??a.time??0)-Number(b.frame??b.time??0));
    if(!TrackingEval||typeof TrackingEval.greedyMatch!=='function'){
      return {quality:'INDISPONIBLE',reason:'tracking_eval_unavailable'};
    }

    const state=new Map();
    let attempts=0,recovered=0,longGapAttempts=0,longGapRecovered=0,crossSegmentAttempts=0,crossSegmentRecovered=0;
    const episodes=[];

    for(let ri=0;ri<rows.length;ri++){
      const row=rows[ri]||{};
      const frame=finite(row.frame)?Number(row.frame):(finite(row.time)?Number(row.time):ri);
      const segment=String(row.segmentId??row.segment??'default');
      const truth=(row.truth||row.groundTruth||[]).filter(x=>idOf(x)!==null);
      const preds=(row.predictions||row.predicted||[]).filter(x=>idOf(x)!==null);
      const matched=TrackingEval.greedyMatch(truth,preds,cfg.minIou).matches;
      const matchedTruth=new Set();

      for(const m of matched){
        const tid=idOf(truth[m.ti]),pid=idOf(preds[m.pi]);
        matchedTruth.add(tid);
        const s=state.get(tid)||{lastPred:null,lastMatchedFrame:null,lastSeenFrame:null,lastSegment:null,missingFrames:0,everMatched:false};
        const gap=s.everMatched&&s.lastMatchedFrame!==null?Math.max(0,frame-s.lastMatchedFrame-1):0;
        const crossedSegment=s.everMatched&&s.lastSegment!==null&&s.lastSegment!==segment;
        const isAttempt=s.everMatched&&(gap>0||crossedSegment);
        if(isAttempt){
          const same=s.lastPred===pid;
          attempts++; if(same)recovered++;
          if(gap>=cfg.minLongGapFrames){longGapAttempts++;if(same)longGapRecovered++;}
          if(crossedSegment){crossSegmentAttempts++;if(same)crossSegmentRecovered++;}
          episodes.push({truthId:tid,fromPredictionId:s.lastPred,toPredictionId:pid,gapFrames:gap,crossedSegment,recovered:same,frame,segment});
        }
        s.lastPred=pid;s.lastMatchedFrame=frame;s.lastSeenFrame=frame;s.lastSegment=segment;s.missingFrames=0;s.everMatched=true;
        state.set(tid,s);
      }

      for(const t of truth){
        const tid=idOf(t);if(matchedTruth.has(tid))continue;
        const s=state.get(tid)||{lastPred:null,lastMatchedFrame:null,lastSeenFrame:null,lastSegment:null,missingFrames:0,everMatched:false};
        s.lastSeenFrame=frame;s.missingFrames=(s.missingFrames||0)+1;
        state.set(tid,s);
      }
    }

    const rate=(n,d)=>d?round(n/d):null;
    return {
      quality:attempts?'EVALUABLE':'INDISPONIBLE',
      reason:attempts?null:'no_reidentification_opportunity',
      reidAttempts:attempts,reidRecoveredSameId:recovered,reidRecoveryRate:rate(recovered,attempts),
      longGapThresholdFrames:cfg.minLongGapFrames,longGapAttempts,longGapRecovered,longGapRecoveryRate:rate(longGapRecovered,longGapAttempts),
      crossSegmentAttempts,crossSegmentRecovered,crossSegmentRecoveryRate:rate(crossSegmentRecovered,crossSegmentAttempts),
      failedReidentifications:attempts-recovered,
      episodes,
      provenance:'CAY_CLEAN_ROOM_IDENTITY_EPISODE_METRIC_INSPIRED_BY_TRACKLAB_TRACKEVAL_LTPI_EVALUATION_GOALS_NO_UPSTREAM_CODE_COPIED',
      rule:'COMPARE_PERSISTENT_PLAYER_ID_RECOVERY_AFTER_OCCLUSIONS_AND_CAMERA_SEGMENT_CHANGES'
    };
  }

  function compareIdentityEpisodes(beforeFrames,afterFrames,options){
    const before=evaluateIdentityEpisodes(beforeFrames,options),after=evaluateIdentityEpisodes(afterFrames,options);
    const delta=(a,b)=>a===null||b===null?null:round(Number(b)-Number(a));
    return {before,after,delta:{
      reidRecoveryRate:delta(before.reidRecoveryRate,after.reidRecoveryRate),
      longGapRecoveryRate:delta(before.longGapRecoveryRate,after.longGapRecoveryRate),
      crossSegmentRecoveryRate:delta(before.crossSegmentRecoveryRate,after.crossSegmentRecoveryRate),
      failedReidentifications:after.failedReidentifications-before.failedReidentifications
    }};
  }

  return {evaluateIdentityEpisodes,compareIdentityEpisodes};
});
