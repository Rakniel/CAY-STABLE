(function(root){
'use strict';

const VERSION='1.0.0';
const candidates={
  'roboflow-trackers-apache':{
    id:'roboflow-trackers-apache',family:'mot',license:'Apache-2.0',status:'BENCHMARK_ONLY',
    source:'https://github.com/roboflow/trackers',runtimeDefaultAllowed:false,
    requiresBenchmark:true,requiresDependencyAudit:true,
    note:'Permissive reference/backend candidate exposing ByteTrack, BoT-SORT, OC-SORT and evaluation tooling. Python backend must remain optional until real CAY footage proves a measurable identity gain.'
  },
  'sportslabkit-gpl':{
    id:'sportslabkit-gpl',family:'sports-mot',license:'GPL-3.0',status:'REFERENCE_ONLY',
    source:'https://github.com/AtomScott/SportsLabKit',runtimeDefaultAllowed:false,
    requiresBenchmark:false,requiresDependencyAudit:true,
    note:'Useful soccer tracking/calibration architecture reference, but GPL code is not copied into the current permissive CAY-STABLE runtime.'
  },
  'soccertrack-v2-benchmark':{
    id:'soccertrack-v2-benchmark',family:'dataset-benchmark',license:'MIT-code/CC-BY-4.0-dataset',status:'BENCHMARK_DATA_CANDIDATE',
    source:'https://github.com/AtomScott/SoccerTrack-v2',runtimeDefaultAllowed:false,
    requiresBenchmark:false,requiresDependencyAudit:false,
    note:'Candidate benchmark format/data for persistent IDs, pitch coordinates and ball-action labels. Dataset attribution must be retained if used.'
  }
};
const compatibleRuntimeLicenses=new Set(['apache-2.0','mit','bsd-2-clause','bsd-3-clause']);
function get(id){const c=candidates[String(id||'')];return c?{...c}:null;}
function list(){return Object.values(candidates).map(c=>({...c}));}
function runtimeLicenseCompatible(candidate){
  const c=typeof candidate==='string'?get(candidate):candidate;
  if(!c)return false;
  return compatibleRuntimeLicenses.has(String(c.license||'').toLowerCase());
}
function benchmarkReportValid(report){
  if(!report||typeof report!=='object')return false;
  const before=Number(report.beforeIdSwitchRate),after=Number(report.afterIdSwitchRate);
  const frames=Number(report.frames);
  return Number.isFinite(before)&&Number.isFinite(after)&&Number.isFinite(frames)&&frames>=300&&after<before;
}
function promotionVerdict(id,report,dependencyAudit){
  const c=get(id);
  if(!c)return {allowed:false,reason:'UNKNOWN_CANDIDATE'};
  if(!runtimeLicenseCompatible(c))return {allowed:false,reason:'LICENSE_REFERENCE_ONLY',candidate:c};
  if(c.requiresDependencyAudit&&dependencyAudit?.compatible!==true)return {allowed:false,reason:'DEPENDENCY_AUDIT_REQUIRED',candidate:c};
  if(c.requiresBenchmark&&!benchmarkReportValid(report))return {allowed:false,reason:'REAL_VIDEO_GAIN_REQUIRED',candidate:c};
  return {allowed:true,reason:'OPTIONAL_BACKEND_ELIGIBLE',candidate:{...c,status:'ELIGIBLE_AFTER_BENCHMARK'}};
}
function assertPromotable(id,report,dependencyAudit){
  const verdict=promotionVerdict(id,report,dependencyAudit);
  if(!verdict.allowed){const e=new Error('CAY tracking backend promotion blocked: '+verdict.reason);e.code='CAY_TRACKING_BACKEND_PROMOTION_BLOCKED';e.reason=verdict.reason;throw e;}
  return verdict;
}
root.CAYTrackingBackendCandidateRegistry={version:VERSION,get,list,runtimeLicenseCompatible,benchmarkReportValid,promotionVerdict,assertPromotable};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYTrackingBackendCandidateRegistry;
})(typeof globalThis!=='undefined'?globalThis:this);
