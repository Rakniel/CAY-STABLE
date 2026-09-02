(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingTrackEvalBundle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clean=v=>String(v==null?'':v).trim();
  const posInt=(v,name)=>{const n=Number(v);if(!Number.isInteger(n)||n<1)throw new Error(`INVALID_${name}`);return n;};
  const safeName=(v,name)=>{const s=clean(v);if(!s||!/^[A-Za-z0-9._-]+$/.test(s))throw new Error(`INVALID_${name}`);return s;};
  const normalizeText=v=>{const s=String(v==null?'':v).replace(/\r\n/g,'\n').replace(/\r/g,'\n');return s&& !s.endsWith('\n')?s+'\n':s;};

  function createSeqInfo({sequenceName,width,height,frameRate,frameCount,imageExtension='.jpg'}={}){
    const name=safeName(sequenceName,'SEQUENCE_NAME');
    const w=posInt(width,'WIDTH'),h=posInt(height,'HEIGHT'),fps=posInt(frameRate,'FRAME_RATE'),len=posInt(frameCount,'FRAME_COUNT');
    const ext=clean(imageExtension)||'.jpg';
    if(!/^\.[A-Za-z0-9]+$/.test(ext))throw new Error('INVALID_IMAGE_EXTENSION');
    return ['[Sequence]',`name=${name}`,'imDir=img1',`frameRate=${fps}`,`seqLength=${len}`,`imWidth=${w}`,`imHeight=${h}`,`imExt=${ext}`,''].join('\n');
  }

  function validateMotRows(text,{requireGroundTruth=false}={}){
    const lines=normalizeText(text).trim().split('\n').filter(Boolean);
    const errors=[];
    lines.forEach((line,index)=>{
      const cols=line.split(',');
      if(cols.length!==10){errors.push({line:index+1,reason:'column_count'});return;}
      const nums=cols.map(Number);
      if(nums.some(v=>!Number.isFinite(v))){errors.push({line:index+1,reason:'non_numeric'});return;}
      if(!Number.isInteger(nums[0])||nums[0]<1||!Number.isInteger(nums[1])||nums[1]<1)errors.push({line:index+1,reason:'invalid_frame_or_id'});
      if(!(nums[4]>0&&nums[5]>0))errors.push({line:index+1,reason:'invalid_box'});
      if(requireGroundTruth&&nums[6]!==1)errors.push({line:index+1,reason:'ground_truth_confidence_must_be_1'});
    });
    return {valid:errors.length===0,rows:lines.length,errors};
  }

  function createBundle({benchmark='CAY',split='validation',sequenceName,trackerName='CAY-STABLE',width,height,frameRate,frameCount,trackerText,groundTruthText,imageExtension='.jpg'}={}){
    const bench=safeName(benchmark,'BENCHMARK'),sp=safeName(split,'SPLIT'),seq=safeName(sequenceName,'SEQUENCE_NAME'),tracker=safeName(trackerName,'TRACKER_NAME');
    const trackerValidation=validateMotRows(trackerText);
    const gtValidation=validateMotRows(groundTruthText,{requireGroundTruth:true});
    if(!trackerValidation.valid)throw new Error('INVALID_TRACKER_MOT_ROWS');
    if(!gtValidation.valid)throw new Error('INVALID_GROUND_TRUTH_MOT_ROWS');
    const dataset=`${bench}-${sp}`;
    const files={};
    files[`data/gt/mot_challenge/${dataset}/${seq}/seqinfo.ini`]=createSeqInfo({sequenceName:seq,width,height,frameRate,frameCount,imageExtension});
    files[`data/gt/mot_challenge/${dataset}/${seq}/gt/gt.txt`]=normalizeText(groundTruthText);
    files[`data/trackers/mot_challenge/${dataset}/${tracker}/data/${seq}.txt`]=normalizeText(trackerText);
    return {
      format:'TRACKEVAL_MOTCHALLENGE_BUNDLE_V1',
      benchmark:bench,split:sp,sequenceName:seq,trackerName:tracker,
      files,
      validation:{tracker:trackerValidation,groundTruth:gtValidation},
      recommendedMetrics:['HOTA','Identity','CLEAR'],
      recommendedArgs:{BENCHMARK:bench,SPLIT_TO_EVAL:sp,TRACKERS_TO_EVAL:[tracker],DO_PREPROC:false},
      benchmarkOnly:true,
      runtimeDependencyAdded:false
    };
  }

  return {createSeqInfo,validateMotRows,createBundle};
});