(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingTrackEvalExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='CAY_TRACKEVAL_MOT_EXPORT_V1';
  const TRACKEVAL_REFERENCE={
    project:'JonathonLuiten/TrackEval',
    revision:'12c8791b303e0a0b50f753af204249e622d0281a',
    license:'MIT',
    adaptation:'MOTChallenge interchange only; TrackEval source and metrics are not copied'
  };
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const personCategory=v=>['team','goalkeeper'].includes(String(v||'').trim().toLowerCase());
  const validTrackId=v=>((typeof v==='number'&&Number.isSafeInteger(v))||(typeof v==='string'&&/^[1-9][0-9]*$/.test(v.trim())&&Number.isSafeInteger(Number(v))))&&Number(v)>0;
  const coordinate=v=>(typeof v==='number'||(typeof v==='string'&&v.trim()!==''))&&Number.isFinite(Number(v));

  function normalizeBBox(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||![value.left,value.top,value.width,value.height].every(coordinate))return null;
    const left=Number(value.left),top=Number(value.top),width=Number(value.width),height=Number(value.height);
    if(![left,top,width,height].every(Number.isFinite)||width<=0||height<=0)return null;
    return {left,top,width,height};
  }

  function normalizeAssignment(value){
    if(!value||!validTrackId(value.trackId)||!personCategory(value.cat))return null;
    const bbox=normalizeBBox(value.bboxPx);
    return {
      trackId:Number(value.trackId),cat:String(value.cat).trim().toLowerCase(),bbox,
      confidence:finite(value.score)?clamp01(value.score):1,
      sourceTrackId:value.sourceTrackId??null
    };
  }

  function frameRows(frameRecord,options={}){
    const frame=Number(frameRecord?.frame);
    if(!validTrackId(frameRecord?.frame))return {status:'INDISPONIBLE',reason:'MOT_FRAME_INVALID',rows:[],summary:{}};
    if(!Array.isArray(frameRecord?.assignments))return {status:'INDISPONIBLE',reason:'TRACKING_ASSIGNMENTS_REQUIRED',rows:[],summary:{frame}};
    const assignments=frameRecord.assignments;
    const invalidIds=assignments.filter(item=>item&&personCategory(item.cat)&&!validTrackId(item.trackId));
    if(invalidIds.length)return {status:'INDISPONIBLE',reason:'TRACKING_ID_INVALID',rows:[],summary:{frame,invalidTrackIds:invalidIds.length}};
    const normalized=assignments.map(normalizeAssignment).filter(Boolean);
    if(normalized.length>11)return {status:'INDISPONIBLE',reason:'CAY_ACTIVE_CAP_EXCEEDED',rows:[],summary:{frame,eligibleAssignments:normalized.length}};
    if(new Set(normalized.map(row=>row.trackId)).size!==normalized.length)return {status:'INDISPONIBLE',reason:'TRACKING_DUPLICATE_ID',rows:[],summary:{frame,eligibleAssignments:normalized.length}};
    const missingBox=normalized.filter(row=>!row.bbox).length;
    const requireCompleteBoxEvidence=options.requireCompleteBoxEvidence!==false;
    if(requireCompleteBoxEvidence&&missingBox){
      return {status:'INDISPONIBLE',reason:'TRACKING_BBOX_EVIDENCE_INCOMPLETE',rows:[],summary:{frame,eligibleAssignments:normalized.length,missingBoxEvidence:missingBox,bboxEvidenceCoverage:normalized.length?(normalized.length-missingBox)/normalized.length:0}};
    }
    const rows=normalized.filter(row=>row.bbox).map(row=>{
      const b=row.bbox;
      return [frame,row.trackId,b.left,b.top,b.width,b.height,row.confidence,-1,-1,-1];
    });
    return {status:'DISPONIBLE',reason:null,rows,summary:{frame,eligibleAssignments:normalized.length,exportedRows:rows.length,missingBoxEvidence:missingBox,bboxEvidenceCoverage:normalized.length?rows.length/normalized.length:1}};
  }

  function exportMOT(frameRecords,options={}){
    const frames=Array.isArray(frameRecords)?[...frameRecords]:[];
    if(!frames.length)return {version:VERSION,status:'INDISPONIBLE',reason:'TRACKING_FRAMES_REQUIRED',text:'',rows:[],reference:TRACKEVAL_REFERENCE};
    frames.sort((a,b)=>Number(a?.frame)-Number(b?.frame));
    const rows=[];let eligibleAssignments=0,missingBoxEvidence=0;
    const seenFrames=new Set();
    for(const frameRecord of frames){
      const part=frameRows(frameRecord,options);
      if(part.status==='DISPONIBLE'){
        const frame=part.summary.frame;
        if(seenFrames.has(frame))return {version:VERSION,status:'INDISPONIBLE',reason:'MOT_DUPLICATE_FRAME',text:'',rows:[],failedFrame:frame,summary:{inputFrames:frames.length,eligibleAssignments,missingBoxEvidence},reference:TRACKEVAL_REFERENCE};
        seenFrames.add(frame);
      }
      eligibleAssignments+=Number(part.summary?.eligibleAssignments)||0;
      missingBoxEvidence+=Number(part.summary?.missingBoxEvidence)||0;
      if(part.status!=='DISPONIBLE')return {version:VERSION,status:'INDISPONIBLE',reason:part.reason,text:'',rows:[],failedFrame:part.summary?.frame??null,summary:{inputFrames:frames.length,eligibleAssignments,missingBoxEvidence},reference:TRACKEVAL_REFERENCE};
      rows.push(...part.rows);
    }
    const bboxEvidenceCoverage=eligibleAssignments?rows.length/eligibleAssignments:1;
    const text=rows.map(row=>row.join(',')).join('\n');
    return {
      version:VERSION,status:'DISPONIBLE',reason:null,format:'MOTCHALLENGE_10_COLUMN',text,rows,
      summary:{inputFrames:frames.length,exportedRows:rows.length,eligibleAssignments,missingBoxEvidence,bboxEvidenceCoverage:+bboxEvidenceCoverage.toFixed(4)},
      evaluationPolicy:'EXPORT_ONLY_WHEN_CAY_GLOBAL_IDS_HAVE_EXPLICIT_DETECTION_BBOX_EVIDENCE; HOTA_IDF1_ARE_COMPUTED_EXTERNALLY_BY_TRACKEVAL',
      reference:TRACKEVAL_REFERENCE
    };
  }

  return {VERSION,TRACKEVAL_REFERENCE,normalizeBBox,normalizeAssignment,frameRows,exportMOT};
});
