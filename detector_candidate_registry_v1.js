(function(root){
'use strict';

const VERSION='1.2.0';
const SHA256_RE=/^[a-f0-9]{64}$/i;
const candidates={
  'legacy-lukasiktar11-yolo':{
    id:'legacy-lukasiktar11-yolo',family:'yolo',license:'AGPL-3.0',status:'REJECTED',
    runtimeDefaultAllowed:false,reason:'Copyleft model source rejected by current CAY-STABLE license policy.'
  },
  'rfdetr-core-apache':{
    id:'rfdetr-core-apache',family:'rfdetr',license:'Apache-2.0',status:'BENCHMARK_ONLY',
    runtimeDefaultAllowed:false,requiresWeightProvenance:true,requiresRealVideoBenchmark:true,
    note:'Only Apache-designated RF-DETR core weights are eligible; Plus/PML variants are excluded.'
  },
  'rfdetr-soccernet-julianzu9612':{
    id:'rfdetr-soccernet-julianzu9612',family:'rfdetr',license:'Apache-2.0-declared',status:'BENCHMARK_ONLY',
    runtimeDefaultAllowed:false,requiresWeightProvenance:true,requiresRealVideoBenchmark:true,
    note:'Football fine-tune candidate. Exact exported class map, preprocessing profile and immutable weight SHA-256 must be recorded before use.'
  },
  'dfine-football-rudrasinghm':{
    id:'dfine-football-rudrasinghm',family:'dfine',license:'Apache-2.0-declared',status:'BENCHMARK_ONLY',
    runtimeDefaultAllowed:false,requiresWeightProvenance:true,requiresRealVideoBenchmark:true,
    note:'Football-specialized D-FINE candidate. No browser runtime promotion without measured real-video results and immutable weight SHA-256 provenance.'
  }
};

function get(id){const c=candidates[String(id||'')];return c?{...c}:null;}
function list(){return Object.values(candidates).map(c=>({...c}));}
function normalizedSha256(value){
  const raw=String(value||'').trim();
  const hex=raw.toLowerCase().startsWith('sha256:')?raw.slice(7):raw;
  return SHA256_RE.test(hex)?hex.toLowerCase():null;
}
function provenanceBaseValid(p){
  return !!(p&&typeof p==='object'&&String(p.source||'').trim()&&String(p.license||'').trim());
}
function provenanceValid(p){
  return provenanceBaseValid(p)&&normalizedSha256(p.sha256||p.weightSha256||p.weightId)!==null;
}
function provenanceFailureReason(p){
  if(!provenanceBaseValid(p))return 'WEIGHT_PROVENANCE_REQUIRED';
  if(!normalizedSha256(p.sha256||p.weightSha256||p.weightId))return 'WEIGHT_SHA256_REQUIRED';
  return null;
}
function resolveLicenseGuard(){
  if(root.CAYDetectorLicenseGuard?.inspectLicense)return root.CAYDetectorLicenseGuard;
  if(typeof require==='function'){
    try{return require('./detector_license_guard_v1.js');}catch(_){return null;}
  }
  return null;
}
function provenanceLicenseVerdict(provenance){
  const failure=provenanceFailureReason(provenance);
  if(failure)return {allowed:false,reason:failure};
  const guard=resolveLicenseGuard();
  if(!guard?.inspectLicense)return {allowed:false,reason:'LICENSE_GUARD_UNAVAILABLE'};
  const verdict=guard.inspectLicense(provenance.license);
  return verdict.allowed?{allowed:true,reason:'PROVENANCE_LICENSE_ALLOWED',license:verdict.license,sha256:normalizedSha256(provenance.sha256||provenance.weightSha256||provenance.weightId)}:{allowed:false,reason:'PROVENANCE_LICENSE_REJECTED',license:verdict.license,licenseReason:verdict.reason};
}
function benchmarkValid(report){
  return !!(report&&report.version==='CAY_DETECTOR_BENCHMARK_V1'&&report.summary&&report.summary.promotionEligible===true);
}
function promotionVerdict(id,benchmarkReport,provenance){
  const c=get(id);
  if(!c)return {allowed:false,reason:'UNKNOWN_CANDIDATE'};
  if(c.status==='REJECTED')return {allowed:false,reason:'REJECTED_CANDIDATE',candidate:c};
  if(c.requiresWeightProvenance){
    const failure=provenanceFailureReason(provenance);
    if(failure)return {allowed:false,reason:failure,candidate:c};
  }
  const licenseVerdict=provenanceLicenseVerdict(provenance);
  if(!licenseVerdict.allowed)return {allowed:false,reason:licenseVerdict.reason,candidate:c,license:licenseVerdict.license,licenseReason:licenseVerdict.licenseReason};
  if(c.requiresRealVideoBenchmark&&!benchmarkValid(benchmarkReport))return {allowed:false,reason:'REAL_VIDEO_BENCHMARK_REQUIRED',candidate:c};
  return {allowed:true,reason:'PROMOTION_ELIGIBLE',candidate:{...c,status:'ELIGIBLE_AFTER_BENCHMARK'},benchmarkVersion:benchmarkReport.version,license:licenseVerdict.license,weightSha256:licenseVerdict.sha256};
}
function assertPromotable(id,benchmarkReport,provenance){
  const v=promotionVerdict(id,benchmarkReport,provenance);
  if(!v.allowed){const e=new Error('CAY detector promotion blocked: '+v.reason);e.code='CAY_DETECTOR_PROMOTION_BLOCKED';e.reason=v.reason;throw e;}
  return v;
}

root.CAYDetectorCandidateRegistry={version:VERSION,get,list,normalizedSha256,provenanceBaseValid,provenanceValid,provenanceFailureReason,provenanceLicenseVerdict,benchmarkValid,promotionVerdict,assertPromotable};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYDetectorCandidateRegistry;
})(typeof globalThis!=='undefined'?globalThis:this);
