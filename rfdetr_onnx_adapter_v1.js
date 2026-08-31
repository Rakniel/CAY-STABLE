(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sigmoid=v=>1/(1+Math.exp(-clamp(Number(v)||0,-88,88)));
  function tensorData(t){return t&&ArrayBuffer.isView(t.data)?t.data:(ArrayBuffer.isView(t)?t:null);}
  function tensorDims(t){return t&&Array.isArray(t.dims)?t.dims:(t&&Array.isArray(t.shape)?t.shape:null);}
  function pickOutputs(outputs){
    if(!outputs||typeof outputs!=='object')throw new Error('RFDETR_OUTPUTS_MISSING');
    const entries=Object.entries(outputs);
    let boxes=outputs.dets||outputs.pred_boxes||null,logits=outputs.labels||outputs.pred_logits||null;
    if(!boxes||!logits){
      const boxCandidates=entries.filter(([,t])=>{const d=tensorDims(t);return d&&d.length===3&&d[d.length-1]===4;});
      const logitCandidates=entries.filter(([,t])=>{const d=tensorDims(t);return d&&d.length===3&&d[d.length-1]!==4;});
      if(!boxes&&boxCandidates.length===1)boxes=boxCandidates[0][1];
      if(!logits&&logitCandidates.length===1)logits=logitCandidates[0][1];
      if((!boxes||!logits)&&entries.length===2){boxes=boxes||entries[0][1];logits=logits||entries[1][1];}
    }
    const bd=tensorDims(boxes),ld=tensorDims(logits),b=tensorData(boxes),l=tensorData(logits);
    if(!bd||!ld||!b||!l||bd.length!==3||ld.length!==3||bd[0]!==1||ld[0]!==1||bd[2]!==4||bd[1]!==ld[1])throw new Error('RFDETR_OUTPUT_CONTRACT_UNSUPPORTED');
    return {boxes,logits,boxData:b,logitData:l,queries:bd[1],classes:ld[2]};
  }
  function selectedClassIds(opts,classes){
    const src=Array.isArray(opts.personClassIds)&&opts.personClassIds.length
      ? opts.personClassIds
      : [Number.isInteger(opts.personClassId)?opts.personClassId:0];
    const ids=[...new Set(src.map(Number).filter(Number.isInteger))];
    if(!ids.length||ids.some(id=>id<0||id>=classes))throw new Error('RFDETR_PERSON_CLASS_OUT_OF_RANGE');
    return ids;
  }
  function decode(outputs,opts={}){
    const {boxData,logitData,queries,classes}=pickOutputs(outputs);
    const W=Number(opts.width),H=Number(opts.height);
    if(!(W>0&&H>0))throw new Error('RFDETR_FRAME_SIZE_REQUIRED');
    const threshold=Number.isFinite(Number(opts.threshold))?Number(opts.threshold):.30;
    const personClassIds=selectedClassIds(opts,classes);
    const backgroundClassId=Number.isInteger(opts.backgroundClassId)?opts.backgroundClassId:null;
    const maxBoxes=Math.max(1,Number(opts.maxBoxes)||120),out=[];
    for(let q=0;q<queries;q++){
      let bestClass=-1,bestScore=-1;
      for(const classId of personClassIds){
        if(backgroundClassId===classId)continue;
        const score=sigmoid(logitData[q*classes+classId]);
        if(score>bestScore){bestScore=score;bestClass=classId;}
      }
      if(bestClass<0||bestScore<threshold)continue;
      const o=q*4,cx=Number(boxData[o]),cy=Number(boxData[o+1]),bw=Number(boxData[o+2]),bh=Number(boxData[o+3]);
      if(![cx,cy,bw,bh].every(Number.isFinite)||!(bw>0&&bh>0))continue;
      const x1=clamp((cx-bw/2)*W,0,W),y1=clamp((cy-bh/2)*H,0,H),x2=clamp((cx+bw/2)*W,0,W),y2=clamp((cy+bh/2)*H,0,H);
      if(x2-x1<2||y2-y1<4)continue;
      out.push({x:x1,y:y1,w:x2-x1,h:y2-y1,score:bestScore,class:'person',classId:bestClass,footballClass:bestClass,source:'rfdetr_onnx'});
    }
    out.sort((a,b)=>b.score-a.score);
    return out.slice(0,maxBoxes);
  }
  root.CAYRFDETRONNXAdapter={decode,pickOutputs,selectedClassIds,sigmoid,license:'Apache-2.0-adaptation'};
})(typeof globalThis!=='undefined'?globalThis:this);
