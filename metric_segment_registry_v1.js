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

  function createRegistry(projectorApi){
    if(!projectorApi||typeof projectorApi.createProjector!=='function')throw new Error('CAYMetricHomographyProjector requis');
    const entries=new Map();

    function calibrate(segment,options={}){
      if(!finiteInt(segment))return {ok:false,reason:'segment invalide'};
      const seg=Number(segment);
      const projector=projectorApi.createProjector(options);
      const record={
        segment:seg,
        projector,
        validated:projector.validated===true,
        source:projector.source||null,
        confidence:Number.isFinite(Number(projector.confidence))?Number(projector.confidence):0,
        reason:projector.reason||null,
        validation:projector.validation||null,
        pitch:projector.pitch||null,
        createdAt:Number.isFinite(Number(options.createdAt))?Number(options.createdAt):null,
        shotId:options.shotId==null?null:String(options.shotId),
        provenance:{
          architectureReferences:['soccer-tactical-vision calibration/validation/project stages','TVCalib','SoccerNet calibration'],
          codeCopied:false,
          licenseDependency:'none'
        }
      };
      entries.set(seg,record);
      return {ok:record.validated,record:safeRecord(record),reason:record.reason};
    }

    function safeRecord(record){
      if(!record)return null;
      return {
        segment:record.segment,validated:record.validated,source:record.source,
        confidence:record.confidence,reason:record.reason,validation:record.validation,
        pitch:record.pitch,createdAt:record.createdAt,shotId:record.shotId,
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
      return record&&record.validated?record.projector:null;
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
      return true;
    }

    function exportProjectors(){
      const out={};
      for(const [segment,record] of entries){
        if(record.validated&&record.projector&&typeof record.projector.project==='function')out[segment]=record.projector;
      }
      return out;
    }

    function summary(){
      const records=[...entries.values()].sort((a,b)=>a.segment-b.segment).map(safeRecord);
      const validated=records.filter(r=>r.validated);
      return {
        segments:records,
        configuredSegments:records.length,
        validatedSegments:validated.length,
        rejectedSegments:records.length-validated.length,
        avgConfidence:validated.length?+(validated.reduce((s,r)=>s+r.confidence,0)/validated.length).toFixed(3):0,
        policy:'CALIBRATION_EXACTE_PAR_SEGMENT_SANS_REUTILISATION_SILENCIEUSE_ENTRE_PLANS'
      };
    }

    return {calibrate,get,projectorFor,invalidate,exportProjectors,summary};
  }

  return {createRegistry};
});
