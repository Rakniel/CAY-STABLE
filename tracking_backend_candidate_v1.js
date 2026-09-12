(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./detector_license_guard_v1.js'):root.CAYDetectorLicenseGuard);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingBackendCandidate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(LicenseGuard){
  'use strict';
  const VERSION='CAY_TRACKING_BACKEND_CANDIDATE_V1_0';
  const SUPPORTED_ALGORITHMS=new Set(['BYTETRACK','BOT-SORT','OC-SORT','SORT','CBIOU','MCBYTE']);
  const REQUIRED_PROVENANCE=['project','sourceUrl','version','revision','license'];
  const present=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
  function normalizeAlgorithm(v){return String(v||'').trim().toUpperCase().replace(/[_ ]+/g,'-');}
  function inspect(manifest){
    const m=manifest&&typeof manifest==='object'?manifest:{};
    const missing=REQUIRED_PROVENANCE.filter(k=>!present(m[k]));
    if(missing.length)return {accepted:false,status:'REJECTED',reason:'PROVENANCE_INCOMPLETE',missing,version:VERSION};
    if(!LicenseGuard||typeof LicenseGuard.inspectLicense!=='function')return {accepted:false,status:'REJECTED',reason:'LICENSE_GUARD_UNAVAILABLE',version:VERSION};
    const license=LicenseGuard.inspectLicense(m.license);
    if(!license.allowed)return {accepted:false,status:'REJECTED',reason:license.reason,license:license.license,version:VERSION};
    const algorithms=[...(Array.isArray(m.algorithms)?m.algorithms:[])].map(normalizeAlgorithm).filter(Boolean);
    if(!algorithms.length)return {accepted:false,status:'REJECTED',reason:'ALGORITHMS_MISSING',version:VERSION};
    const unsupported=algorithms.filter(x=>!SUPPORTED_ALGORITHMS.has(x));
    if(unsupported.length)return {accepted:false,status:'REJECTED',reason:'ALGORITHM_NOT_SUPPORTED',unsupported,version:VERSION};
    const externalRuntime=m.runtime==='external-python'||m.runtime==='offline-python';
    if(!externalRuntime)return {accepted:false,status:'REJECTED',reason:'RUNTIME_BOUNDARY_NOT_EXPLICIT',version:VERSION};
    const timestampSupport=m.timestampSupport===true;
    const cameraMotion=String(m.cameraMotion||'NONE').trim().toUpperCase();
    const hasBotSort=algorithms.includes('BOT-SORT');
    if(hasBotSort&&cameraMotion==='NONE')return {accepted:false,status:'REJECTED',reason:'BOTSORT_CAMERA_MOTION_CAPABILITY_MISSING',version:VERSION};
    return {accepted:true,status:'ELIGIBLE_FOR_BENCHMARK',reason:null,version:VERSION,project:String(m.project),sourceUrl:String(m.sourceUrl),upstreamVersion:String(m.version),revision:String(m.revision),license:license.license,algorithms,timestampSupport,cameraMotion,runtime:m.runtime,weightsBundled:m.weightsBundled===true,requiresSeparateWeightAudit:m.weightsBundled===true||m.optionalWeights===true};
  }
  return {VERSION,SUPPORTED_ALGORITHMS:[...SUPPORTED_ALGORITHMS],REQUIRED_PROVENANCE:[...REQUIRED_PROVENANCE],normalizeAlgorithm,inspect};
});
