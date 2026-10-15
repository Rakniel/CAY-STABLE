(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsReadiness=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='CAY_FIRST_RESULTS_READINESS_V1';
  const REQUIRED=Object.freeze(['playerCards','tracking','coverage','trajectories','heatmaps']);
  const nonBlank=v=>typeof v==='string'&&v.trim().length>0;
  const finite01=v=>v!==null&&v!==undefined&&typeof v!=='boolean'&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1;

  function evaluateArtifact(name,artifact){
    if(!artifact||typeof artifact!=='object')return {name,ready:false,reason:'MISSING'};
    if(artifact.available!==true)return {name,ready:false,reason:artifact.reason||'UNAVAILABLE'};
    if(!finite01(artifact.coverage))return {name,ready:false,reason:'COVERAGE_NOT_DEFENDABLE'};
    if(Number(artifact.coverage)===0)return {name,ready:false,reason:'COVERAGE_ZERO'};
    if(!nonBlank(artifact.analysisId)||!nonBlank(artifact.inputFingerprint))return {name,ready:false,reason:'PROVENANCE_INCOMPLETE'};
    return {name,ready:true,reason:'READY',coverage:Number(artifact.coverage)};
  }

  function evaluateFirstResults(artifacts,{minCoverage=0}={}){
    if(!finite01(minCoverage))throw new Error('minCoverage must be between 0 and 1');
    const checks=REQUIRED.map(name=>evaluateArtifact(name,artifacts&&artifacts[name]));
    let expectedAnalysisId=null,expectedFingerprint=null;
    for(const check of checks){
      if(!check.ready)continue;
      if(check.coverage<Number(minCoverage)){
        check.ready=false;
        check.reason='COVERAGE_BELOW_THRESHOLD';
        continue;
      }
      const artifact=artifacts[check.name];
      if(expectedAnalysisId===null){
        expectedAnalysisId=artifact.analysisId;
        expectedFingerprint=artifact.inputFingerprint;
      }else if(artifact.analysisId!==expectedAnalysisId||artifact.inputFingerprint!==expectedFingerprint){
        check.ready=false;
        check.reason='PROVENANCE_MISMATCH';
      }
    }
    const missing=checks.filter(x=>!x.ready);
    return {
      version:VERSION,
      status:missing.length===0?'PREMIERS_RESULTATS_PRETS':'INDISPONIBLE',
      ready:missing.length===0,
      checks,
      unavailable:missing.map(x=>({name:x.name,reason:x.reason}))
    };
  }

  return {VERSION,REQUIRED,evaluateArtifact,evaluateFirstResults};
});
