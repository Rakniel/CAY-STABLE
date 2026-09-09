(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYCalibrationRuntimeBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const ratio=(n,d)=>d>0?+(n/d).toFixed(4):0;
  function summarize(rows){
    const input=Array.isArray(rows)?rows:[];
    let attempted=0,valid=0,directValid=0,fallbackValid=0,invalid=0,notAttempted=0,confidenceSum=0,confidenceCount=0;
    for(const row of input){
      const wasAttempted=row?.attempted!==false;
      if(!wasAttempted){notAttempted++;continue;}
      attempted++;
      const isValid=row?.valid===true;
      if(!isValid){invalid++;continue;}
      valid++;
      if(row?.fallback===true)fallbackValid++;else directValid++;
      if(finite(row?.confidence)){confidenceSum+=Number(row.confidence);confidenceCount++;}
    }
    return {
      version:'CAY_CALIBRATION_RUNTIME_BENCHMARK_V1',
      frames:input.length,
      attemptedFrames:attempted,
      notAttemptedFrames:notAttempted,
      validProjectionFrames:valid,
      directValidFrames:directValid,
      fallbackValidFrames:fallbackValid,
      invalidProjectionFrames:invalid,
      validProjectionRate:ratio(valid,attempted),
      directValidRate:ratio(directValid,attempted),
      fallbackProjectionRate:ratio(fallbackValid,attempted),
      fallbackShareOfValid:ratio(fallbackValid,valid),
      meanValidConfidence:confidenceCount?+(confidenceSum/confidenceCount).toFixed(4):null,
      policy:'BENCHMARK_DIAGNOSTIQUE_SEULEMENT; AUCUN_TAUX_NE_PROMEUT_UNE_CALIBRATION_NON_VALIDEE_DANS_STABLE'
    };
  }
  function compare(before,after){
    const a=before?.validProjectionRate===undefined?summarize(before):before;
    const b=after?.validProjectionRate===undefined?summarize(after):after;
    const delta=(key)=>finite(a?.[key])&&finite(b?.[key])?+(Number(b[key])-Number(a[key])).toFixed(4):null;
    return {
      version:'CAY_CALIBRATION_RUNTIME_BENCHMARK_COMPARE_V1',
      before:a,
      after:b,
      deltaValidProjectionRate:delta('validProjectionRate'),
      deltaDirectValidRate:delta('directValidRate'),
      deltaFallbackProjectionRate:delta('fallbackProjectionRate'),
      deltaMeanValidConfidence:delta('meanValidConfidence'),
      improved:finite(a?.validProjectionRate)&&finite(b?.validProjectionRate)?Number(b.validProjectionRate)>Number(a.validProjectionRate):false,
      policy:'MESURE_AVANT_APRES_EXPLICITE; LA_FIABILITE_STABLE_RESTE_GOUVERNEE_PAR_LES_GARDES_DE_CALIBRATION_EXISTANTS'
    };
  }
  return {summarize,compare};
});
