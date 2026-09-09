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
      attemptedFrameRate:ratio(attempted,input.length),
      validFrameRate:ratio(valid,input.length),
      validProjectionRate:ratio(valid,attempted),
      directValidRate:ratio(directValid,attempted),
      fallbackProjectionRate:ratio(fallbackValid,attempted),
      fallbackShareOfValid:ratio(fallbackValid,valid),
      meanValidConfidence:confidenceCount?+(confidenceSum/confidenceCount).toFixed(4):null,
      policy:'BENCHMARK_DIAGNOSTIQUE_SEULEMENT; TAUX_GLOBAL_FRAMES_VALIDES_ET_COUVERTURE_DES_TENTATIVES_EXPOSES_POUR_INTERDIRE_UN_GAIN_ARTIFICIEL_PAR_FRAMES_IGNOREES; AUCUN_TAUX_NE_PROMEUT_UNE_CALIBRATION_NON_VALIDEE_DANS_STABLE'
    };
  }
  function compare(before,after){
    const a=before?.validProjectionRate===undefined?summarize(before):before;
    const b=after?.validProjectionRate===undefined?summarize(after):after;
    const delta=(key)=>finite(a?.[key])&&finite(b?.[key])?+(Number(b[key])-Number(a[key])).toFixed(4):null;
    const aGlobal=finite(a?.validFrameRate)?Number(a.validFrameRate):null;
    const bGlobal=finite(b?.validFrameRate)?Number(b.validFrameRate):null;
    const aAttempt=finite(a?.attemptedFrameRate)?Number(a.attemptedFrameRate):null;
    const bAttempt=finite(b?.attemptedFrameRate)?Number(b.attemptedFrameRate):null;
    const aConditional=finite(a?.validProjectionRate)?Number(a.validProjectionRate):null;
    const bConditional=finite(b?.validProjectionRate)?Number(b.validProjectionRate):null;
    const improved=aGlobal!==null&&bGlobal!==null&&(
      bGlobal>aGlobal ||
      (bGlobal===aGlobal&&aAttempt!==null&&bAttempt!==null&&bAttempt>=aAttempt&&aConditional!==null&&bConditional!==null&&bConditional>aConditional)
    );
    return {
      version:'CAY_CALIBRATION_RUNTIME_BENCHMARK_COMPARE_V1',
      before:a,
      after:b,
      deltaAttemptedFrameRate:delta('attemptedFrameRate'),
      deltaValidFrameRate:delta('validFrameRate'),
      deltaValidProjectionRate:delta('validProjectionRate'),
      deltaDirectValidRate:delta('directValidRate'),
      deltaFallbackProjectionRate:delta('fallbackProjectionRate'),
      deltaMeanValidConfidence:delta('meanValidConfidence'),
      improved,
      policy:'MESURE_AVANT_APRES_EXPLICITE; UN_MEILLEUR_TAUX_CONDITIONNEL_NE_COMPTE_PAS_COMME_GAIN_S_IL_PROVIENT_D_UNE_BAISSE_DE_COUVERTURE_DES_FRAMES; LA_FIABILITE_STABLE_RESTE_GOUVERNEE_PAR_LES_GARDES_DE_CALIBRATION_EXISTANTS'
    };
  }
  return {summarize,compare};
});
