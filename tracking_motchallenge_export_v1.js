(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingMOTChallengeExport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const finite=v=>Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function resolveBox(assignment,width,height){
    const raw=assignment?.b||assignment?.box||assignment?.bbox||null;
    if(raw){
      const x=finite(raw.x),y=finite(raw.y),w=finite(raw.w),h=finite(raw.h);
      if(x!==null&&y!==null&&w!==null&&h!==null&&w>0&&h>0)return {x,y,w,h,source:'PIXEL_BOX'};
      const x1=finite(raw.x1),y1=finite(raw.y1),x2=finite(raw.x2),y2=finite(raw.y2);
      if(x1!==null&&y1!==null&&x2!==null&&y2!==null&&x2>x1&&y2>y1)return {x:x1,y:y1,w:x2-x1,h:y2-y1,source:'PIXEL_XYXY'};
    }
    const nx=finite(assignment?.x),ny=finite(assignment?.y),nw=finite(assignment?.normalizedW),nh=finite(assignment?.normalizedH);
    if(nx!==null&&ny!==null&&nw!==null&&nh!==null&&width>0&&height>0&&nw>0&&nh>0){
      return {x:(nx-nw/2)*width,y:(ny-nh)*height,w:nw*width,h:nh*height,source:'NORMALIZED_FOOT_ANCHOR'};
    }
    return null;
  }

  function assignmentToRow(assignment,frameIndex,options={}){
    const width=Math.max(0,finite(options.width)||0),height=Math.max(0,finite(options.height)||0);
    const frame=Math.floor(finite(frameIndex)||0),trackId=Math.floor(finite(assignment?.trackId)||0);
    if(frame<1)return {accepted:false,reason:'invalid_frame_index',row:null};
    if(trackId<1)return {accepted:false,reason:'missing_track_id',row:null};
    if(assignment?.fieldEligible===false||assignment?.onField===false||assignment?.insidePlayableArea===false)return {accepted:false,reason:'outside_playable_field',row:null};
    if(assignment?.isBench===true||assignment?.isSpectator===true||assignment?.yellowDetailOnly===true||assignment?.falseCAYYellowDetail===true)return {accepted:false,reason:'cay_identity_guard_rejected',row:null};
    const box=resolveBox(assignment,width,height);
    if(!box)return {accepted:false,reason:'missing_pixel_box',row:null};
    let {x,y,w,h}=box;
    if(width>0&&height>0){
      const x2=clamp(x+w,0,width),y2=clamp(y+h,0,height);
      x=clamp(x,0,width);y=clamp(y,0,height);w=x2-x;h=y2-y;
      if(!(w>0&&h>0))return {accepted:false,reason:'box_outside_frame',row:null};
    }
    const confidence=clamp(finite(assignment?.score)??1,0,1);
    const row=[frame,trackId,+x.toFixed(3),+y.toFixed(3),+w.toFixed(3),+h.toFixed(3),+confidence.toFixed(6),-1,-1,-1];
    return {accepted:true,reason:null,row,boxSource:box.source};
  }

  function exportFrame(assignments,frameIndex,options={}){
    const rows=[],rejectedByReason={};
    for(const assignment of (Array.isArray(assignments)?assignments:[])){
      const result=assignmentToRow(assignment,frameIndex,options);
      if(result.accepted)rows.push(result.row);
      else rejectedByReason[result.reason]=(rejectedByReason[result.reason]||0)+1;
    }
    rows.sort((a,b)=>a[1]-b[1]);
    return {rows,rejectedByReason,accepted:rows.length,rejected:Object.values(rejectedByReason).reduce((a,b)=>a+b,0)};
  }

  function createRecorder(options={}){
    const rows=[],rejectedByReason={};let frames=0,accepted=0,rejected=0;
    function record(assignments,frameIndex,frameOptions={}){
      const out=exportFrame(assignments,frameIndex,{...options,...frameOptions});
      frames++;
      rows.push(...out.rows);accepted+=out.accepted;rejected+=out.rejected;
      for(const [reason,count] of Object.entries(out.rejectedByReason))rejectedByReason[reason]=(rejectedByReason[reason]||0)+count;
      return out;
    }
    function toText(){return rows.map(row=>row.join(',')).join('\n')+(rows.length?'\n':'');}
    function summary(){return {format:'MOTCHALLENGE_TRACKER_10_COLUMN',frames,rows:rows.length,accepted,rejected,rejectedByReason:{...rejectedByReason},coordinateSystem:'IMAGE_PIXELS',identityPolicy:'CAY_TRACK_ID_PRESERVED',benchmarkOnly:true};}
    return {record,toText,summary,rows};
  }

  return {resolveBox,assignmentToRow,exportFrame,createRecorder};
});
