(function(root,factory){
  const api=factory(root.CAYAnalysisArtifactContract||(typeof require==='function'?require('./analysis_artifact_contract_v1.js'):null));
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMOTTrackingArtifactAdapter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Contract){
  'use strict';

  const VERSION='CAY_MOT_TRACKING_ARTIFACT_V1';
  const PERMISSIVE_LICENSES=new Set(['MIT','APACHE-2.0','BSD-2-CLAUSE','BSD-3-CLAUSE','ISC','CC0-1.0']);
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
  const text=v=>String(v==null?'':v).trim();

  function normalizeLicense(value){return text(value).toUpperCase().replace(/\s+/g,'');}
  function licenseAllowed(value){return PERMISSIVE_LICENSES.has(normalizeLicense(value));}
  function normalizeProvenance(p,{requireWeightProvenance=true}={}){
    if(!p||typeof p!=='object')throw new Error('TRACKING_PROVENANCE_REQUIRED');
    const source=text(p.source),license=text(p.license),revision=text(p.revision||p.sha256||p.version);
    if(!source||!license||!revision)throw new Error('TRACKING_PROVENANCE_INCOMPLETE');
    if(!licenseAllowed(license))throw new Error('TRACKING_LICENSE_REJECTED');
    let weights=null;
    if(requireWeightProvenance){
      const w=p.weights;
      if(!w||typeof w!=='object')throw new Error('TRACKING_WEIGHT_PROVENANCE_REQUIRED');
      const wSource=text(w.source),wLicense=text(w.license),wRevision=text(w.revision||w.sha256||w.weightId||w.version);
      if(!wSource||!wLicense||!wRevision)throw new Error('TRACKING_WEIGHT_PROVENANCE_INCOMPLETE');
      if(!licenseAllowed(wLicense))throw new Error('TRACKING_WEIGHT_LICENSE_REJECTED');
      weights={source:wSource,license:wLicense,revision:wRevision};
    }
    return {source,license,revision,weights};
  }

  function parseMotText(value){
    if(typeof value!=='string')return [];
    const out=[];
    for(const raw of value.split(/\r?\n/)){
      const line=raw.trim();if(!line||line.startsWith('#'))continue;
      const c=line.split(/[\s,;]+/).filter(Boolean);
      if(c.length<7)continue;
      out.push({frame:Number(c[0]),track_id:Number(c[1]),bbox_ltwh:[Number(c[2]),Number(c[3]),Number(c[4]),Number(c[5])],score:Number(c[6]),world:[Number(c[7]),Number(c[8]),Number(c[9])]});
    }
    return out;
  }

  function rowObject(row){
    if(Array.isArray(row)){
      return {frame:Number(row[0]),track_id:Number(row[1]),bbox_ltwh:[Number(row[2]),Number(row[3]),Number(row[4]),Number(row[5])],score:Number(row[6]),world:[Number(row[7]),Number(row[8]),Number(row[9])]};
    }
    if(!row||typeof row!=='object')return null;
    const bbox=Array.isArray(row.bbox_ltwh)?row.bbox_ltwh:(Array.isArray(row.bbox)?row.bbox:null);
    return {
      frame:Number(row.frame??row.frame_id??row.image_id),
      track_id:Number(row.track_id??row.id??row.person_id),
      bbox_ltwh:bbox?bbox.map(Number):null,
      score:Number(row.score??row.bbox_conf??row.confidence??1),
      category_id:row.category_id??row.category??row.class_id??row.label??null,
      person_id:row.person_id??null,
      video_id:row.video_id??null,
      feature:Array.isArray(row.feature)?row.feature.map(Number):(Array.isArray(row.embedding)?row.embedding.map(Number):null)
    };
  }

  function normalizeRows(input){
    const src=typeof input==='string'?parseMotText(input):(Array.isArray(input)?input:[]);
    return src.map(rowObject).filter(Boolean);
  }

  function l2NormalizeFeature(feature){
    if(!Array.isArray(feature)||!feature.length||!feature.every(finite))return null;
    const values=feature.map(Number);
    let norm2=0;for(const v of values)norm2+=v*v;
    const norm=Math.sqrt(norm2);
    if(!(norm>1e-12))return null;
    return values.map(v=>v/norm);
  }

  function categoryFor(row,classMap){
    const key=row.category_id==null?'':String(row.category_id);
    const mapped=classMap&&Object.prototype.hasOwnProperty.call(classMap,key)?classMap[key]:null;
    const cat=text(mapped||'unknown').toLowerCase();
    return ['team','goalkeeper','opponent','referee','ball','unknown'].includes(cat)?cat:'unknown';
  }

  function metricAnchorForBox(left,top,bw,bh,cat,width,height){
    const x=clamp01((left+bw/2)/width);
    const isBall=cat==='ball';
    const y=clamp01((isBall?(top+bh/2):(top+bh))/height);
    return {x,y,kind:isBall?'bbox_center':'bbox_bottom_center'};
  }

  function createArtifact(input,options={}){
    const width=Number(options.width),height=Number(options.height),fps=Number(options.fps);
    if(!(width>0&&height>0&&fps>0))throw new Error('TRACKING_FRAME_GEOMETRY_REQUIRED');
    const provenance=normalizeProvenance(options.provenance,{requireWeightProvenance:options.requireWeightProvenance!==false});
    const frameBase=Number.isInteger(options.frameBase)?options.frameBase:1;
    const maxCayActive=Math.max(1,Math.min(11,Number(options.maxCayActive)||11));
    const minScore=finite(options.minScore)?clamp01(options.minScore):0;
    const normalizeEmbeddings=options.normalizeEmbeddings!==false;
    const expectedFeatureDim=Number.isInteger(options.expectedFeatureDim)&&options.expectedFeatureDim>0?options.expectedFeatureDim:null;
    const classMap=options.classMap||{};
    const rows=normalizeRows(input);
    const byFrame=new Map();
    let rejectedGeometry=0,rejectedScore=0,rejectedId=0,rejectedFeature=0,accepted=0,embeddingRows=0;
    let observedFeatureDim=expectedFeatureDim;
    for(const row of rows){
      if(!Number.isInteger(row.frame)||row.frame<frameBase||!Number.isInteger(row.track_id)||row.track_id<0){rejectedId++;continue;}
      const b=row.bbox_ltwh;
      if(!Array.isArray(b)||b.length!==4||!b.every(finite)||b[2]<=0||b[3]<=0){rejectedGeometry++;continue;}
      const score=finite(row.score)?clamp01(row.score):1;if(score<minScore){rejectedScore++;continue;}
      let feature=null;
      if(Array.isArray(row.feature)){
        if(!row.feature.length||!row.feature.every(finite)){rejectedFeature++;continue;}
        if(observedFeatureDim==null)observedFeatureDim=row.feature.length;
        if(row.feature.length!==observedFeatureDim){rejectedFeature++;continue;}
        feature=normalizeEmbeddings?l2NormalizeFeature(row.feature):row.feature.map(Number);
        if(!feature){rejectedFeature++;continue;}
        embeddingRows++;
      }
      const left=Number(b[0]),top=Number(b[1]),bw=Number(b[2]),bh=Number(b[3]);
      const cat=categoryFor(row,classMap);
      const anchor=metricAnchorForBox(left,top,bw,bh,cat,width,height);
      const {x,y,kind:anchorKind}=anchor;
      const track={sourceTrackId:row.track_id,personId:row.person_id??null,videoId:row.video_id??null,cat,score,bboxPx:{left,top,width:bw,height:bh},anchor:{x,y,kind:anchorKind},detection:{x,y,anchorKind,score,cat,feature}};
      if(!byFrame.has(row.frame))byFrame.set(row.frame,[]);byFrame.get(row.frame).push(track);accepted++;
    }
    const frames=[];let overCapacityFrames=0,cayEligibleFrames=0,activeSlots=0;
    for(const frame of [...byFrame.keys()].sort((a,b)=>a-b)){
      const tracks=byFrame.get(frame).sort((a,b)=>a.sourceTrackId-b.sourceTrackId);
      const cay=tracks.filter(t=>t.cat==='team'||t.cat==='goalkeeper');
      const cayEligible=cay.length<=maxCayActive;
      if(cayEligible)cayEligibleFrames++;else overCapacityFrames++;
      activeSlots+=cay.length;
      frames.push({frame,timeSec:(frame-frameBase)/fps,cayActiveCount:cay.length,cayEligible,tracks});
    }
    const coverage=frames.length?cayEligibleFrames/frames.length:0;
    const inputFingerprint=text(options.inputFingerprint||`${provenance.source}:${provenance.revision}:${frames.length}:${accepted}`);
    const analysisId=text(options.analysisId||'external-tracking-import');
    const spatialReference={coordinateSystem:'image_normalized',unit:'ratio',origin:'top_left',xAxisDirection:'right',yAxisDirection:'down',normalized:true};
    const descriptor=Contract&&typeof Contract.createArtifactDescriptor==='function'?Contract.createArtifactDescriptor({stage:'tracking_v1',schemaVersion:VERSION,inputFingerprint,analysisId,createdAt:options.createdAt||null,provenance,coverage,confidence:coverage,spatialReference}):{stage:'tracking_v1',schemaVersion:VERSION,inputFingerprint,analysisId,coverage,confidence:coverage,spatialReference,provenance};
    return {version:VERSION,descriptor,provenance,frameGeometry:{width,height,fps,frameBase},policy:{maxCayActive,minScore,failClosedOnOverCapacity:true,noTeamInference:true,metricAnchorPolicy:'PERSON_BOTTOM_CENTER_BALL_CENTER',embeddingPolicy:normalizeEmbeddings?'L2_NORMALIZED_EUCLIDEAN_EQUIV_COSINE':'PASSTHROUGH',featureDim:observedFeatureDim},frames,summary:{inputRows:rows.length,acceptedRows:accepted,rejectedGeometry,rejectedScore,rejectedId,rejectedFeature,embeddingRows,featureDim:observedFeatureDim,frameCount:frames.length,cayEligibleFrames,overCapacityFrames,cayEligibilityCoverage:+coverage.toFixed(4),observedCaySlots:activeSlots}};
  }

  function detectionsAt(artifact,timeSec,options={}){
    if(!artifact||artifact.version!==VERSION||!Array.isArray(artifact.frames))return {status:'INDISPONIBLE',reason:'TRACKING_ARTIFACT_INVALID',detections:[]};
    const t=Number(timeSec);if(!Number.isFinite(t))return {status:'INDISPONIBLE',reason:'TRACKING_TIME_INVALID',detections:[]};
    const maxAgeSec=finite(options.maxAgeSec)?Math.max(0,Number(options.maxAgeSec)):Math.max(.04,1/Number(artifact.frameGeometry?.fps||25)*.75);
    let best=null,age=Infinity;
    for(const f of artifact.frames){const d=Math.abs(Number(f.timeSec)-t);if(d<age){age=d;best=f;}}
    if(!best||age>maxAgeSec)return {status:'INDISPONIBLE',reason:'TRACKING_SAMPLE_STALE',ageSec:best?+age.toFixed(4):null,detections:[]};
    if(best.cayEligible!==true)return {status:'INDISPONIBLE',reason:'CAY_ACTIVE_CAP_EXCEEDED',frame:best.frame,ageSec:+age.toFixed(4),detections:[]};
    const detections=best.tracks.filter(t=>t.cat==='team'||t.cat==='goalkeeper').map(t=>({...t.detection,sourceTrackId:t.sourceTrackId,bboxPx:{...t.bboxPx}}));
    return {status:'AVAILABLE',reason:null,frame:best.frame,ageSec:+age.toFixed(4),detections};
  }

  return {VERSION,PERMISSIVE_LICENSES:[...PERMISSIVE_LICENSES],licenseAllowed,normalizeProvenance,parseMotText,normalizeRows,l2NormalizeFeature,metricAnchorForBox,createArtifact,detectionsAt};
});