(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYDetectorCocoInterchange=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='CAY_DETECTOR_COCO_INTERCHANGE_V1';
const DEFAULT_CATEGORIES=Object.freeze({person:1,ball:2});
const clean=v=>String(v==null?'':v).trim();
const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));

function normalizeCategories(raw){
  const source=raw&&typeof raw==='object'?raw:DEFAULT_CATEGORIES;
  const out={},ids=new Set();
  for(const [name,idRaw] of Object.entries(source)){
    const nameClean=clean(name),id=Number(idRaw);
    if(!nameClean||!Number.isInteger(id)||id<=0)throw new Error('COCO_CATEGORY_INVALID');
    if(ids.has(id))throw new Error('COCO_CATEGORY_ID_DUPLICATE');
    ids.add(id);out[nameClean]=id;
  }
  if(!Object.keys(out).length)throw new Error('COCO_CATEGORIES_REQUIRED');
  return out;
}

function normalizeBbox(raw,width,height){
  if(!Array.isArray(raw)||raw.length!==4||raw.some(v=>!finite(v)))throw new Error('COCO_BBOX_REQUIRED');
  const [x,y,w,h]=raw.map(Number);
  if(x<0||y<0||w<=0||h<=0)throw new Error('COCO_BBOX_INVALID');
  if(finite(width)&&finite(height)&&(x+w>Number(width)+1e-6||y+h>Number(height)+1e-6))throw new Error('COCO_BBOX_OUTSIDE_IMAGE');
  return [x,y,w,h];
}

function categoryIdFor(raw,categories){
  if(Number.isInteger(Number(raw))&&Object.values(categories).includes(Number(raw)))return Number(raw);
  const key=clean(raw);
  if(Object.prototype.hasOwnProperty.call(categories,key))return categories[key];
  throw new Error('COCO_CATEGORY_UNKNOWN:'+key);
}

function buildGroundTruth(spec={}){
  const evaluationSet=clean(spec.evaluationSet||spec.datasetId);
  if(!evaluationSet)throw new Error('COCO_EVALUATION_SET_REQUIRED');
  const categories=normalizeCategories(spec.categories),frames=Array.isArray(spec.frames)?spec.frames:[];
  if(!frames.length)throw new Error('COCO_FRAMES_REQUIRED');
  const images=[],annotations=[],seenFrames=new Set();let annotationId=1,eligibleAnnotations=0;
  for(let index=0;index<frames.length;index++){
    const frame=frames[index]||{},externalId=clean(frame.id);
    const width=Number(frame.width),height=Number(frame.height);
    if(!externalId||seenFrames.has(externalId))throw new Error('COCO_FRAME_ID_INVALID');
    if(!Number.isInteger(width)||width<=0||!Number.isInteger(height)||height<=0)throw new Error('COCO_FRAME_SIZE_INVALID');
    seenFrames.add(externalId);const imageId=index+1;
    images.push({id:imageId,width,height,file_name:clean(frame.fileName)||externalId,cay_frame_id:externalId});
    for(const annRaw of Array.isArray(frame.annotations)?frame.annotations:[]){
      const bbox=normalizeBbox(annRaw?.bboxPx??annRaw?.bbox,width,height);
      const categoryId=categoryIdFor(annRaw?.categoryId??annRaw?.category,categories);
      const ignore=annRaw?.ignore===true;
      annotations.push({id:annotationId++,image_id:imageId,category_id:categoryId,bbox,area:bbox[2]*bbox[3],iscrowd:annRaw?.isCrowd===true?1:0,ignore:ignore?1:0});
      if(!ignore)eligibleAnnotations++;
    }
  }
  return {
    version:VERSION,evaluationSet,
    coco:{info:{description:'CAY-STABLE detector benchmark',cay_evaluation_set:evaluationSet},images,annotations,categories:Object.entries(categories).map(([name,id])=>({id,name,supercategory:name==='ball'?'sports':'person'}))},
    summary:{frameCount:images.length,annotationCount:annotations.length,eligibleAnnotationCount:eligibleAnnotations,annotationCoverage:1}
  };
}

function buildDetections(spec={},observations=[]){
  const gt=buildGroundTruth(spec),categories=normalizeCategories(spec.categories),imageByFrame=new Map(gt.coco.images.map(img=>[img.cay_frame_id,img]));
  const rows=[];let rejected=0;
  for(const raw of Array.isArray(observations)?observations:[]){
    try{
      const frameId=clean(raw?.frameId??raw?.id),image=imageByFrame.get(frameId);
      if(!image)throw new Error('COCO_DETECTION_FRAME_UNKNOWN');
      const bbox=normalizeBbox(raw?.bboxPx??raw?.bbox,image.width,image.height);
      const categoryId=categoryIdFor(raw?.categoryId??raw?.category,categories);
      const score=Number(raw?.score??raw?.confidence);
      if(!Number.isFinite(score)||score<0||score>1)throw new Error('COCO_DETECTION_SCORE_INVALID');
      rows.push({image_id:image.id,category_id:categoryId,bbox,score,cay_frame_id:frameId,source_track_id:raw?.sourceTrackId??null});
    }catch(_){rejected++;}
  }
  return {version:VERSION,evaluationSet:gt.evaluationSet,detections:rows,summary:{detectionCount:rows.length,rejectedDetectionCount:rejected,frameCount:gt.summary.frameCount}};
}

return {VERSION,DEFAULT_CATEGORIES,normalizeCategories,normalizeBbox,buildGroundTruth,buildDetections};
});
