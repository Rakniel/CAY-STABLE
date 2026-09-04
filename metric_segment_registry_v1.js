(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricSegmentRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const finiteInt=v=>{
    if(v===null||v===undefined)return false;
    if(typeof v==='string'&&v.trim()==='')return false;
    return Number.isInteger(Number(v))&&Number(v)>=0;
  };
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const MIN_DYNAMIC_KEYFRAME_CONFIDENCE=.5;

  function createRegistry(projectorApi){
    if(!projectorApi||typeof projectorApi.createProjector!=='function')throw new Error('CAYMetricHomographyProjector requis');
    const entries=new Map();

    function calibrationSnapshot(projector,time,kind='absolute'){
      return {
        time:Number(time),projector,validated:projector?.validated===true,
        source:projector?.source||null,
        confidence:finite(projector?.confidence)?Number(projector.confidence):0,
        validation:projector?.validation||null,kind
      };
    }

    function reliableKeyframes(record){
      return (record?.keyframes||[])
        .filter(k=>k.validated&&k.projector&&typeof k.projector.project==='function'&&finite(k.confidence)&&Number(k.confidence)>=MIN_DYNAMIC_KEYFRAME_CONFIDENCE);
    }

    function dynamicConfidence(record){
      const reliable=reliableKeyframes(record);
      return reliable.length?reliable.reduce((s,k)=>s+Number(k.confidence),0)/reliable.length:0;
    }

    function projectKeyframe(keyframe,point){
      if(!keyframe||!keyframe.projector||typeof keyframe.projector.project!=='function')return null;
      let q=null;try{q=keyframe.projector.project(point);}catch(e){return null;}
      if(!q||!finite(q.x)||!finite(q.y))return null;
      return {x:Number(q.x),y:Number(q.y)};
    }

    function temporalProjector(record){
      const allValid=(record.keyframes||[]).filter(k=>k.validated&&k.projector&&typeof k.projector.project==='function').sort((a,b)=>a.time-b.time);
      if(!allValid.length)return null;
      const reliable=reliableKeyframes(record).sort((a,b)=>a.time-b.time);
      if(!reliable.length)return null;
      const valid=reliable;
      const lowConfidenceKeyframesRejected=allValid.length-reliable.length;
      const maxAge=finite(record.maxCalibrationAgeSec)?Math.max(.02,Number(record.maxCalibrationAgeSec)):.35;
      const avgConfidence=dynamicConfidence(record);
      return {
        validated:true,
        source:'temporal_calibration_keyframes',
        confidence:avgConfidence,
        validation:{keyframes:valid.length,sourceKeyframes:allValid.length,lowConfidenceKeyframesRejected,minDynamicKeyframeConfidence:MIN_DYNAMIC_KEYFRAME_CONFIDENCE,maxCalibrationAgeSec:maxAge,dynamicCamera:true,temporalBlend:'PROJECTED_POINT_LINEAR_BLEND_BETWEEN_VALIDATED_KEYFRAMES'},
        pitch:record.pitch||valid[0].projector.pitch||null,
        project(point){
          if(!point||!finite(point.time))return null;
          const t=Number(point.time);
          let previous=null,next=null;
          for(const k of valid){
            if(k.time<=t)previous=k;
            if(k.time>=t){next=k;break;}
          }
          if(previous&&next&&previous!==next){
            const agePrev=t-previous.time,ageNext=next.time-t;
            if(agePrev<=maxAge&&ageNext<=maxAge){
              const q0=projectKeyframe(previous,point),q1=projectKeyframe(next,point);
              if(q0&&q1){
                const gap=next.time-previous.time;
                if(gap>0){
                  const alpha=Math.max(0,Math.min(1,(t-previous.time)/gap));
                  const q={x:q0.x+(q1.x-q0.x)*alpha,y:q0.y+(q1.y-q0.y)*alpha};
                  if(finite(q.x)&&finite(q.y))return {
                    ...q,
                    calibrationKeyframeTime:null,
                    calibrationKeyframeTimes:[previous.time,next.time],
                    calibrationAgeSec:+Math.max(agePrev,ageNext).toFixed(4),
                    calibrationKind:'interpolated_validated_keyframes',
                    calibrationBlendAlpha:+alpha.toFixed(4)
                  };
                }
              }
            }
          }
          let best=null,bestAge=Infinity;
          for(const k of valid){const age=Math.abs(t-k.time);if(age<bestAge){bestAge=age;best=k;}}
          if(!best||bestAge>maxAge)return null;
          const q=projectKeyframe(best,point);if(!q)return null;
          return {...q,calibrationKeyframeTime:best.time,calibrationAgeSec:+bestAge.toFixed(4),calibrationKind:best.kind};
        },
        provenance:{
          strategy:'ABSOLUTE_KEYFRAMES_WITH_STRICT_FRESHNESS_CONFIDENCE_GUARD_AND_OUTPUT_SPACE_TEMPORAL_BLEND',
          designReferences:['rafaelsouza-tech/soccer-tactical-vision','MM4SPA/tvcalib self-verification'],
          auditedRevisions:['4c557534c624948f3bfe3db956859c7ea3b442fa','1222c5230af2742395d74918ed6f34eb2b9bf7f9'],
          referenceLicenses:['MIT','MIT'],
          adaptedIdea:'smooth only trustworthy geometrically meaningful calibration keyframes; weak keyframes cannot be rescued by confidence averaging',
          codeCopied:false,licenseDependency:'none'
        }
      };
    }

    function baseRecord(segment,projector,options={}){
      return {
        segment:Number(segment),
        projector,
        validated:projector.validated===true,
        source:options.source||projector.source||null,
        confidence:finite(projector.confidence)?Number(projector.confidence):0,
        diagnosticConfidence:finite(projector.confidence)?Number(projector.confidence):0,
        reason:projector.reason||null,
        validation:projector.validation||null,
        pitch:projector.pitch||null,
        createdAt:finite(options.createdAt)?Number(options.createdAt):null,
        shotId:options.shotId==null?null:String(options.shotId),
        dynamicCamera:false,
        maxCalibrationAgeSec:finite(options.maxCalibrationAgeSec)?Math.max(.02,Number(options.maxCalibrationAgeSec)):.35,
        keyframes:[],
        provenance:{
          architectureReferences:['soccer-tactical-vision calibration/validation/project stages','TVCalib','SoccerNet calibration','MatchVision guarded short-horizon calibration propagation'],
          registration:options.registration||'REGISTRY_CREATED_PROJECTOR',
          upstreamValidationPreserved:options.upstreamValidationPreserved===true,
          semanticCalibration:options.semanticCalibration||null,
          codeCopied:false,
          licenseDependency:'none'
        }
      };
    }

    function calibrate(segment,options={}){
      if(!finiteInt(segment))return {ok:false,reason:'segment invalide'};
      const seg=Number(segment);
      const projector=projectorApi.createProjector(options);
      const record=baseRecord(seg,projector,options);
      entries.set(seg,record);
      return {ok:record.validated,record:safeRecord(record),reason:record.reason};
    }

    function projectorEligibility(projector){
      if(!projector||projector.validated!==true||typeof projector.project!=='function')return {ok:false,reason:'projecteur validé requis'};
      if(!finite(projector.confidence))return {ok:false,reason:'confiance calibration explicite requise'};
      const confidence=Number(projector.confidence);
      if(confidence<0||confidence>1)return {ok:false,reason:'confiance calibration hors bornes'};
      return {ok:true,confidence};
    }

    function registerValidatedProjector(segment,projector,options={}){
      if(!finiteInt(segment))return {ok:false,reason:'segment invalide'};
      const eligibility=projectorEligibility(projector);if(!eligibility.ok)return eligibility;
      const seg=Number(segment);
      const record=baseRecord(seg,projector,{
        ...options,
        registration:'PREVALIDATED_PROJECTOR_FAIL_CLOSED',
        upstreamValidationPreserved:true
      });
      record.reason=null;
      entries.set(seg,record);
      return {ok:true,record:safeRecord(record),reason:null};
    }

    function safeRecord(record){
      if(!record)return null;
      return {
        segment:record.segment,validated:record.validated,source:record.source,
        confidence:record.confidence,diagnosticConfidence:record.diagnosticConfidence,
        reason:record.reason,validation:record.validation,
        pitch:record.pitch,createdAt:record.createdAt,shotId:record.shotId,
        dynamicCamera:record.dynamicCamera===true,maxCalibrationAgeSec:record.maxCalibrationAgeSec,
        calibrationKeyframes:(record.keyframes||[]).map(k=>({time:k.time,validated:k.validated,source:k.source,confidence:k.confidence,kind:k.kind})),
        provenance:record.provenance
      };
    }

    function get(segment){
      if(!finiteInt(segment))return null;
      return safeRecord(entries.get(Number(segment))||null);
    }

    function projectorFor(segment){
      if(!finiteInt(segment))return null;
      const record=entries.get(Number(segment));
      if(!record||!record.validated)return null;
      if(record.dynamicCamera===true)return temporalProjector(record);
      return record.projector;
    }

    function markDynamic(segment,time,options={}){
      if(!finiteInt(segment))return {ok:false,reason:'segment invalide'};
      const record=entries.get(Number(segment));if(!record)return {ok:false,reason:'segment non calibré'};
      if(finite(options.maxCalibrationAgeSec))record.maxCalibrationAgeSec=Math.max(.02,Number(options.maxCalibrationAgeSec));
      const anchorTime=finite(time)?Number(time):(finite(record.createdAt)?Number(record.createdAt):null);
      if(record.dynamicCamera!==true&&record.projector?.validated===true&&anchorTime!==null){
        record.keyframes.push(calibrationSnapshot(record.projector,anchorTime,'absolute_anchor'));
      }
      record.dynamicCamera=true;
      record.source='temporal_calibration_keyframes';
      record.confidence=dynamicConfidence(record);
      record.diagnosticConfidence=record.keyframes.length?record.keyframes.reduce((s,k)=>s+k.confidence,0)/record.keyframes.length:0;
      record.validation={...(record.validation||{}),dynamicCamera:true,maxCalibrationAgeSec:record.maxCalibrationAgeSec,temporalBlend:'PROJECTED_POINT_LINEAR_BLEND_BETWEEN_VALIDATED_KEYFRAMES'};
      const temporal=temporalProjector(record);
      return {ok:!!temporal,record:safeRecord(record),reason:temporal?null:'aucun keyframe de calibration avec confiance suffisante'};
    }

    function registerValidatedKeyframe(segment,time,projector,options={}){
      if(!finiteInt(segment)||!finite(time))return {ok:false,reason:'segment ou temps invalide'};
      const record=entries.get(Number(segment));if(!record)return {ok:false,reason:'segment non calibré'};
      const eligibility=projectorEligibility(projector);if(!eligibility.ok)return {...eligibility,record:safeRecord(record)};
      if(finite(options.maxCalibrationAgeSec))record.maxCalibrationAgeSec=Math.max(.02,Number(options.maxCalibrationAgeSec));
      if(record.dynamicCamera!==true&&record.projector?.validated===true){
        const anchorTime=finite(record.createdAt)?Number(record.createdAt):Number(time);
        record.keyframes.push(calibrationSnapshot(record.projector,anchorTime,'absolute_anchor'));
      }
      record.dynamicCamera=true;
      const snapshot=calibrationSnapshot(projector,Number(time),options.kind||'prevalidated_refresh');
      const duplicate=(record.keyframes||[]).findIndex(k=>Math.abs(k.time-snapshot.time)<1e-6);
      if(duplicate>=0)record.keyframes[duplicate]=snapshot;else record.keyframes.push(snapshot);
      record.keyframes.sort((a,b)=>a.time-b.time);
      record.source='temporal_calibration_keyframes';
      record.confidence=dynamicConfidence(record);
      record.diagnosticConfidence=record.keyframes.length?record.keyframes.reduce((s,k)=>s+k.confidence,0)/record.keyframes.length:0;
      record.validation={...(record.validation||{}),dynamicCamera:true,keyframes:record.keyframes.length,reliableKeyframes:reliableKeyframes(record).length,maxCalibrationAgeSec:record.maxCalibrationAgeSec,temporalBlend:'PROJECTED_POINT_LINEAR_BLEND_BETWEEN_VALIDATED_KEYFRAMES'};
      record.provenance={...(record.provenance||{}),registration:'PREVALIDATED_DYNAMIC_KEYFRAME_FAIL_CLOSED',upstreamValidationPreserved:true};
      const temporal=temporalProjector(record);
      const eligible=eligibility.confidence>=MIN_DYNAMIC_KEYFRAME_CONFIDENCE;
      return {ok:true,eligible,projectorAvailable:!!temporal,record:safeRecord(record),reason:temporal?null:'aucun keyframe de calibration avec confiance suffisante'};
    }

    function addCalibrationKeyframe(segment,time,options={}){
      if(!finiteInt(segment)||!finite(time))return {ok:false,reason:'segment ou temps invalide'};
      const record=entries.get(Number(segment));if(!record)return {ok:false,reason:'segment non calibré'};
      const projector=projectorApi.createProjector(options);
      if(projector.validated!==true)return {ok:false,reason:projector.reason||'keyframe de calibration non validé',record:safeRecord(record)};
      return registerValidatedKeyframe(segment,time,projector,{...options,kind:options.kind||'absolute_refresh'});
    }

    function invalidate(segment,reason='calibration invalidée explicitement'){
      if(!finiteInt(segment))return false;
      const record=entries.get(Number(segment));
      if(!record)return false;
      record.validated=false;
      record.reason=reason;
      if(record.projector){
        record.projector={...record.projector,validated:false,project:null,reason};
      }
      record.keyframes=[];
      return true;
    }

    function bindSegment(projector,segment){
      if(!projector||projector.validated!==true||typeof projector.project!=='function')return null;
      return {...projector,segment:Number(segment)};
    }

    function exportProjectors(){
      const out={};
      for(const [segment,record] of entries){
        if(!record.validated)continue;
        const projector=record.dynamicCamera===true?temporalProjector(record):record.projector;
        const bound=bindSegment(projector,segment);
        if(bound)out[segment]=bound;
      }
      return out;
    }

    function summary(){
      const records=[...entries.values()].sort((a,b)=>a.segment-b.segment).map(safeRecord);
      const validated=records.filter(r=>r.validated),dynamic=validated.filter(r=>r.dynamicCamera);
      return {
        segments:records,
        configuredSegments:records.length,
        validatedSegments:validated.length,
        rejectedSegments:records.length-validated.length,
        dynamicSegments:dynamic.length,
        calibrationKeyframes:dynamic.reduce((s,r)=>s+r.calibrationKeyframes.length,0),
        reliableCalibrationKeyframes:dynamic.reduce((s,r)=>s+r.calibrationKeyframes.filter(k=>k.validated&&finite(k.confidence)&&Number(k.confidence)>=MIN_DYNAMIC_KEYFRAME_CONFIDENCE).length,0),
        avgConfidence:validated.length?+(validated.reduce((s,r)=>s+r.confidence,0)/validated.length).toFixed(3):0,
        avgDiagnosticConfidence:validated.length?+(validated.reduce((s,r)=>s+(finite(r.diagnosticConfidence)?r.diagnosticConfidence:r.confidence),0)/validated.length).toFixed(3):0,
        policy:'CALIBRATION_EXACTE_PAR_SEGMENT_SANS_REUTILISATION_SILENCIEUSE_ENTRE_PLANS',
        dynamicPolicy:'CAMERA_DYNAMIQUE=AU_MOINS_UN_KEYFRAME_VALIDE_CONFIANCE_GE_0_5_REQUIS; KEYFRAMES_FAIBLES_EXCLUS; AGE_MAX_STRICT; INTERPOLATION UNIQUEMENT EN ESPACE PROJETE ENTRE KEYFRAMES ELIGIBLES; SINON_PROJECTION_INDISPONIBLE'
      };
    }

    return {calibrate,registerValidatedProjector,registerValidatedKeyframe,get,projectorFor,markDynamic,addCalibrationKeyframe,invalidate,exportProjectors,summary};
  }

  return {VERSION:'1.5.0',MIN_DYNAMIC_KEYFRAME_CONFIDENCE,createRegistry};
});
