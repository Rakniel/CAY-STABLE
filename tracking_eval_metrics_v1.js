(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingEval=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const finite=v=>Number.isFinite(Number(v));
  const round=(v,n=4)=>Number(Number(v).toFixed(n));
  function boxOf(o){
    if(!o)return null;
    const b=o.bbox||o.box||o;
    const x1=finite(b.x1)?Number(b.x1):(finite(b.x)?Number(b.x):null);
    const y1=finite(b.y1)?Number(b.y1):(finite(b.y)?Number(b.y):null);
    const x2=finite(b.x2)?Number(b.x2):(x1!==null&&finite(b.width)?x1+Number(b.width):null);
    const y2=finite(b.y2)?Number(b.y2):(y1!==null&&finite(b.height)?y1+Number(b.height):null);
    if([x1,y1,x2,y2].some(v=>v===null)||x2<=x1||y2<=y1)return null;
    return {x1,y1,x2,y2};
  }
  function iou(a,b){
    const A=boxOf(a),B=boxOf(b); if(!A||!B)return 0;
    const ix=Math.max(0,Math.min(A.x2,B.x2)-Math.max(A.x1,B.x1));
    const iy=Math.max(0,Math.min(A.y2,B.y2)-Math.max(A.y1,B.y1));
    const inter=ix*iy;
    const ua=(A.x2-A.x1)*(A.y2-A.y1)+(B.x2-B.x1)*(B.y2-B.y1)-inter;
    return ua>0?inter/ua:0;
  }
  function idOf(o){return o?(o.id??o.trackId??o.playerId??null):null;}
  function greedyMatch(truth,predictions,minIou){
    const pairs=[];
    for(let ti=0;ti<truth.length;ti++)for(let pi=0;pi<predictions.length;pi++){
      const score=iou(truth[ti],predictions[pi]);
      if(score>=minIou)pairs.push({ti,pi,iou:score});
    }
    pairs.sort((a,b)=>b.iou-a.iou);
    const usedT=new Set(),usedP=new Set(),matches=[];
    for(const p of pairs){
      if(usedT.has(p.ti)||usedP.has(p.pi))continue;
      usedT.add(p.ti); usedP.add(p.pi); matches.push(p);
    }
    return {matches,usedT,usedP};
  }
  function evaluateTracking(frames,options){
    const cfg={minIou:.5,...(options||{})};
    const rows=(frames||[]).slice().sort((a,b)=>Number(a.time??a.frame??0)-Number(b.time??b.frame??0));
    let gt=0,tp=0,fp=0,fn=0,idSwitches=0,fragments=0,iouSum=0,transitions=0;
    const states=new Map();
    for(const row of rows){
      const truth=(row.truth||row.groundTruth||[]).filter(x=>idOf(x)!==null&&boxOf(x));
      const preds=(row.predictions||row.predicted||[]).filter(x=>idOf(x)!==null&&boxOf(x));
      gt+=truth.length;
      const {matches,usedT,usedP}=greedyMatch(truth,preds,cfg.minIou);
      tp+=matches.length; fn+=truth.length-usedT.size; fp+=preds.length-usedP.size;
      const matchedTruthIds=new Set();
      for(const m of matches){
        iouSum+=m.iou;
        const tid=idOf(truth[m.ti]),pid=idOf(preds[m.pi]);
        matchedTruthIds.add(tid);
        const s=states.get(tid)||{lastPred:null,seenMatched:false,wasMatched:false,hadGap:false};
        if(s.seenMatched){
          transitions++;
          if(s.lastPred!==pid)idSwitches++;
          if(s.hadGap)fragments++;
        }
        s.lastPred=pid; s.seenMatched=true; s.wasMatched=true; s.hadGap=false;
        states.set(tid,s);
      }
      for(const t of truth){
        const tid=idOf(t),s=states.get(tid)||{lastPred:null,seenMatched:false,wasMatched:false,hadGap:false};
        if(!matchedTruthIds.has(tid)&&s.seenMatched)s.hadGap=true;
        if(!matchedTruthIds.has(tid))s.wasMatched=false;
        states.set(tid,s);
      }
    }
    const precision=tp+fp?tp/(tp+fp):0;
    const recall=gt?tp/gt:0;
    const detectionF1=precision+recall?2*precision*recall/(precision+recall):0;
    const mota=gt?1-(fn+fp+idSwitches)/gt:0;
    const motp=tp?iouSum/tp:0;
    const continuity=transitions?1-idSwitches/transitions:(tp?1:0);
    return {
      quality:gt?'EVALUABLE':'INDISPONIBLE',groundTruth:gt,truePositives:tp,falsePositives:fp,falseNegatives:fn,
      precision:round(precision),recall:round(recall),detectionF1:round(detectionF1),mota:round(mota),motpIou:round(motp),
      idSwitches,fragments,identityContinuity:round(Math.max(0,continuity)),matchedTransitions:transitions,
      thresholds:{minIou:cfg.minIou},
      provenance:'TRACKING_EVAL_CONTRACT_ADAPTED_FROM_TRACKEVAL_IDEAS_NO_UPSTREAM_CODE_COPIED',
      rule:'USE_REPRESENTATIVE_ANNOTATED_CLIPS_TO_COMPARE_BEFORE_AFTER_TRACKER_CHANGES'
    };
  }
  function compareTracking(beforeFrames,afterFrames,options){
    const before=evaluateTracking(beforeFrames,options),after=evaluateTracking(afterFrames,options);
    const delta=k=>round(Number(after[k]||0)-Number(before[k]||0));
    return {before,after,delta:{mota:delta('mota'),motpIou:delta('motpIou'),recall:delta('recall'),precision:delta('precision'),detectionF1:delta('detectionF1'),identityContinuity:delta('identityContinuity'),idSwitches:after.idSwitches-before.idSwitches,falsePositives:after.falsePositives-before.falsePositives,fragments:after.fragments-before.fragments}};
  }
  return {iou,greedyMatch,evaluateTracking,compareTracking};
});
