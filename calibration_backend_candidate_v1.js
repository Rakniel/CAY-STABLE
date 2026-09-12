(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./detector_license_guard_v1.js'):root.CAYDetectorLicenseGuard);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYCalibrationBackendCandidate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(LicenseGuard){
  'use strict';
  const VERSION='CAY_CALIBRATION_BACKEND_CANDIDATE_V1_0';
  const REQUIRED_PROVENANCE=['project','sourceUrl','version','revision','license'];
  const SUPPORTED_CAPABILITIES=new Set(['HOMOGRAPHY','RANSAC','CAMERA_CALIBRATION','LENS_DISTORTION','CAMERA_MOTION']);
  const present=v=>v!==null&&v!==undefined&&String(v).trim()!=='';
  const normalizeCapability=v=>String(v||'').trim().toUpperCase().replace(/[ _]+/g,'_');

  function inspect(manifest){
    const m=manifest&&typeof manifest==='object'?manifest:{};
    const missing=REQUIRED_PROVENANCE.filter(k=>!present(m[k]));
    if(missing.length)return {accepted:false,status:'REJECTED',reason:'PROVENANCE_INCOMPLETE',missing,version:VERSION};
    if(!LicenseGuard||typeof LicenseGuard.inspectLicense!=='function')return {accepted:false,status:'REJECTED',reason:'LICENSE_GUARD_UNAVAILABLE',version:VERSION};
    const license=LicenseGuard.inspectLicense(m.license);
    if(!license.allowed)return {accepted:false,status:'REJECTED',reason:license.reason,license:license.license,version:VERSION};
    const capabilities=(Array.isArray(m.capabilities)?m.capabilities:[]).map(normalizeCapability).filter(Boolean);
    if(!capabilities.length)return {accepted:false,status:'REJECTED',reason:'CAPABILITIES_MISSING',version:VERSION};
    const unsupported=capabilities.filter(x=>!SUPPORTED_CAPABILITIES.has(x));
    if(unsupported.length)return {accepted:false,status:'REJECTED',reason:'CAPABILITY_NOT_SUPPORTED',unsupported,version:VERSION};
    const runtime=String(m.runtime||'').trim();
    if(!['external-python','offline-python','native-offline'].includes(runtime))return {accepted:false,status:'REJECTED',reason:'RUNTIME_BOUNDARY_NOT_EXPLICIT',version:VERSION};
    if(m.weightsBundled===true||m.optionalWeights===true){
      if(!present(m.weightsLicense))return {accepted:false,status:'REJECTED',reason:'WEIGHTS_LICENSE_AUDIT_REQUIRED',version:VERSION};
      const weightsLicense=LicenseGuard.inspectLicense(m.weightsLicense);
      if(!weightsLicense.allowed)return {accepted:false,status:'REJECTED',reason:'WEIGHTS_LICENSE_NOT_ALLOWLISTED',weightsLicense:weightsLicense.license,version:VERSION};
    }
    return {
      accepted:true,status:'ELIGIBLE_FOR_BENCHMARK',reason:null,version:VERSION,
      project:String(m.project),sourceUrl:String(m.sourceUrl),upstreamVersion:String(m.version),revision:String(m.revision),
      license:license.license,capabilities:[...new Set(capabilities)],runtime,
      codeImported:m.codeImported===true,weightsBundled:m.weightsBundled===true,optionalWeights:m.optionalWeights===true,
      requiresRealCayBenchmark:true,requiresMetricTrajectoryValidation:true,
      policy:'ADMISSION_ONLY; NO_RUNTIME_PROMOTION_WITHOUT_CAY_CALIBRATION_AND_METRIC_TRAJECTORY_EVIDENCE'
    };
  }

  return {VERSION,REQUIRED_PROVENANCE:[...REQUIRED_PROVENANCE],SUPPORTED_CAPABILITIES:[...SUPPORTED_CAPABILITIES],normalizeCapability,inspect};
});
