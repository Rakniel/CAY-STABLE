(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsReadiness=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='CAY_FIRST_RESULTS_READINESS_V1';
  const REQUIRED=Object.freeze(['playerCards','tracking','coverage','trajectories','heatmaps']);
  const present=v=>typeof v==='string'&&v.trim().length>0;
  const hasSource=artifact=>Object.prototype.hasOwnProperty.call(artifact,'sourceVideoFingerprint');
  const finite01=v=>(typeof v==='number'||(typeof v==='string'&&v.trim().length>0))&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=1;

  function evaluateArtifact(name,artifact){
    if(!artifact||typeof artifact!=='object'||Array.isArray(artifact))return {name,ready:false,reason:'MISSING'};
    if(artifact.available!==true)return {name,ready:false,reason:artifact.reason||'UNAVAILABLE'};
    if(!finite01(artifact.coverage))return {name,ready:false,reason:'COVERAGE_NOT_DEFENDABLE'};
    if(!present(artifact.analysisId)||!present(artifact.inputFingerprint))return {name,ready:false,reason:'PROVENANCE_INCOMPLETE'};
    if(hasSource(artifact)&&!present(artifact.sourceVideoFingerprint))return {name,ready:false,reason:'PROVENANCE_INCOMPLETE'};
    // No observed evidence exists at zero coverage, even if minCoverage=0.
    if(Number(artifact.coverage)===0)return {name,ready:false,reason:'NO_USABLE_COVERAGE'};
    return {name,ready:true,reason:'READY',coverage:Number(artifact.coverage)};
  }

  function evaluateFirstResults(artifacts,{minCoverage=0}={}){
    if(!finite01(minCoverage))throw new Error('minCoverage must be between 0 and 1');
    const checks=REQUIRED.map(name=>evaluateArtifact(name,artifacts&&artifacts[name]));
    const valid=checks.filter(check=>check.ready);
    const reference=valid[0];
    const referenceAnalysisId=reference?String(artifacts[reference.name].analysisId).trim():null;
    const canonical=valid.some(check=>hasSource(artifacts[check.name]));
    const sourceOf=check=>String(canonical?artifacts[check.name].sourceVideoFingerprint:artifacts[check.name].inputFingerprint).trim();
    const sourceReference=canonical?valid.find(check=>hasSource(artifacts[check.name])):reference;
    const referenceFingerprint=sourceReference?sourceOf(sourceReference):null;
    for(const check of checks){
      if(!check.ready)continue;
      const artifact=artifacts[check.name];
      if(String(artifact.analysisId).trim()!==referenceAnalysisId){
        check.ready=false;
        check.reason='ANALYSIS_ID_MISMATCH';
      }else if(canonical&&!hasSource(artifact)){
        check.ready=false;
        check.reason='SOURCE_VIDEO_FINGERPRINT_MISSING';
      }else if(sourceOf(check)!==referenceFingerprint){
        check.ready=false;
        check.reason='INPUT_FINGERPRINT_MISMATCH';
      }else if(check.coverage<Number(minCoverage)){
        check.ready=false;
        check.reason='COVERAGE_BELOW_THRESHOLD';
      }
    }
    const missing=checks.filter(x=>!x.ready);
    return {
      version:VERSION,
      status:missing.length===0?'PREMIERS_RESULTATS_PRETS':'INDISPONIBLE',
      ready:missing.length===0,
      sourceVideoFingerprintConsistent:canonical&&missing.length===0,
      provenanceMode:canonical?'EXPLICIT_SOURCE_VIDEO':'LEGACY_INPUT_FINGERPRINT',
      checks,
      unavailable:missing.map(x=>({name:x.name,reason:x.reason}))
    };
  }

  return {VERSION,REQUIRED,evaluateArtifact,evaluateFirstResults};
});
