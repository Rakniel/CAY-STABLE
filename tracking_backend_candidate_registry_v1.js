(function(root){
'use strict';

const VERSION='1.5.0';
const CANONICAL_PROMOTION_VERSION='CAY_TRACKING_PERSISTENT_IDENTITY_PROMOTION_GATE_V1';
const candidates={
  'roboflow-trackers-apache':{
    id:'roboflow-trackers-apache',family:'mot',license:'Apache-2.0',status:'BENCHMARK_ONLY',
    source:'https://github.com/roboflow/trackers',upstreamVersion:'2.6.0',upstreamRevision:'0e839f348d8bf4ed09eea9f3bef58fd5f95dca3f',releaseDate:'2026-08-06',runtimeDefaultAllowed:false,
    requiresBenchmark:true,requiresDependencyAudit:true,requiresIdentityBenchmark:true,requiresCanonicalPromotionGate:true,timestampSupport:true,
    algorithms:['ByteTrack','BoT-SORT','OC-SORT','SORT','CBIoU','McByte'],cameraMotionCapability:'CMC',
    preferredProfiles:{cameraMotion:'BoT-SORT',variableDetectionConfidence:'ByteTrack'},
    note:'Permissive reference/backend candidate exposing ByteTrack, BoT-SORT, OC-SORT and evaluation tooling. Version/revision are pinned to the audited 2.6.0 release because lifecycle/timestamp behavior changed upstream. Python backend must remain optional until real CAY footage proves measurable short-term tracking, metric-trajectory and persistent-identity gains through the canonical promotion gate.'
  },
  'cameltrack-apache':{
    id:'cameltrack-apache',family:'learned-multi-cue-mot',license:'Apache-2.0',status:'BENCHMARK_ONLY',
    source:'https://github.com/TrackingLaboratory/CAMELTrack',upstreamVersion:'46a74bb22a28d2d699b4c5c5e317a26d3b87f1e2',runtimeDefaultAllowed:false,
    requiresBenchmark:true,requiresDependencyAudit:true,requiresIdentityBenchmark:true,requiresCanonicalPromotionGate:true,
    preferredProfiles:{crowdedSports:'CAMEL bbox+appearance+keypoints',crossDomain:'global multi-dataset checkpoint'},
    note:'Context-aware learned association candidate from the TrackLab ecosystem. SportsMOT reports HOTA 80.3 upstream, but CAY promotion remains blocked until dependency/model-weight licensing and the canonical C.A. Yenne tracking+trajectory+persistent-identity promotion gate are validated. No CAMELTrack source or weights are bundled.'
  },
  'sportslabkit-gpl':{
    id:'sportslabkit-gpl',family:'sports-mot',license:'GPL-3.0',status:'REFERENCE_ONLY',
    source:'https://github.com/AtomScott/SportsLabKit',runtimeDefaultAllowed:false,
    requiresBenchmark:false,requiresDependencyAudit:true,requiresIdentityBenchmark:false,
    note:'Useful soccer tracking/calibration architecture reference, but GPL code is not copied into the current permissive CAY-STABLE runtime.'
  },
  'soccertrack-v2-benchmark':{
    id:'soccertrack-v2-benchmark',family:'dataset-benchmark',license:'MIT-code/CC-BY-4.0-dataset',status:'BENCHMARK_DATA_CANDIDATE',
    source:'https://github.com/AtomScott/SoccerTrack-v2',runtimeDefaultAllowed:false,
    requiresBenchmark:false,requiresDependencyAudit:false,requiresIdentityBenchmark:false,
    note:'Candidate benchmark format/data for persistent IDs, pitch coordinates and ball-action labels. Dataset attribution must be retained if used.'
  }
};
function get(id){const c=candidates[String(id||'')];return c?{...c}:null;}
function list(){return Object.values(candidates).map(c=>({...c}));}
function resolveLicenseGuard(){
  if(root.CAYDetectorLicenseGuard&&typeof root.CAYDetectorLicenseGuard.inspectLicense==='function')return root.CAYDetectorLicenseGuard;
  if(typeof module!=='undefined'&&module.exports&&typeof require==='function'){
    try{
      const guard=require('./detector_license_guard_v1.js');
      if(guard&&typeof guard.inspectLicense==='function')return guard;
    }catch(_){/* fail closed below */}
  }
  return null;
}
function runtimeLicenseVerdict(candidate){
  const c=typeof candidate==='string'?get(candidate):candidate;
  if(!c)return {allowed:false,license:'',reason:'UNKNOWN_CANDIDATE'};
  const guard=resolveLicenseGuard();
  if(!guard)return {allowed:false,license:String(c.license||''),reason:'LICENSE_GUARD_UNAVAILABLE'};
  return guard.inspectLicense(c.license);
}
function runtimeLicenseCompatible(candidate){return runtimeLicenseVerdict(candidate).allowed===true;}
function shortTermBenchmarkValid(report){
  if(!report||typeof report!=='object')return false;
  const before=Number(report.beforeIdSwitchRate),after=Number(report.afterIdSwitchRate);
  const frames=Number(report.frames);
  return Number.isFinite(before)&&Number.isFinite(after)&&Number.isFinite(frames)&&frames>=300&&after<before;
}
function identityBenchmarkValid(report){
  if(!report||typeof report!=='object')return false;
  const attempts=Number(report.reidAttempts);
  const before=Number(report.beforeReidRecoveryRate),after=Number(report.afterReidRecoveryRate);
  const beforeFailed=Number(report.beforeFailedReidentifications),afterFailed=Number(report.afterFailedReidentifications);
  if(!Number.isFinite(attempts)||attempts<3)return false;
  if(!Number.isFinite(before)||!Number.isFinite(after)||after<before)return false;
  if(Number.isFinite(beforeFailed)&&Number.isFinite(afterFailed)&&afterFailed>beforeFailed)return false;
  const crossAttempts=Number(report.crossSegmentAttempts||0);
  if(crossAttempts>0){
    const beforeCross=Number(report.beforeCrossSegmentRecoveryRate),afterCross=Number(report.afterCrossSegmentRecoveryRate);
    if(!Number.isFinite(beforeCross)||!Number.isFinite(afterCross)||afterCross<beforeCross)return false;
  }
  return true;
}
function benchmarkReportValid(report){return shortTermBenchmarkValid(report)&&identityBenchmarkValid(report);}
function canonicalPromotionValid(evidence){
  if(!evidence||typeof evidence!=='object')return false;
  if(evidence.version!==CANONICAL_PROMOTION_VERSION)return false;
  if(evidence.promote!==true||evidence.status!=='PROMOTE')return false;
  if(evidence.reason!=='TRACKING_TRAJECTORY_AND_PERSISTENT_IDENTITY_GATES_PASSED')return false;
  if(evidence.trackingAndTrajectory?.promote!==true)return false;
  if(evidence.trackingAndTrajectory?.tracking?.promote!==true)return false;
  if(evidence.trackingAndTrajectory?.tracking?.inputParity?.pass!==true)return false;
  if(evidence.trackingAndTrajectory?.trajectory?.pass!==true)return false;
  if(evidence.persistentIdentity?.pass!==true)return false;
  return true;
}
function promotionVerdict(id,report,dependencyAudit,canonicalPromotionEvidence){
  const c=get(id);
  if(!c)return {allowed:false,reason:'UNKNOWN_CANDIDATE'};
  const licenseVerdict=runtimeLicenseVerdict(c);
  if(!licenseVerdict.allowed)return {allowed:false,reason:'LICENSE_REFERENCE_ONLY',licenseVerdict,candidate:c};
  if(c.requiresDependencyAudit&&dependencyAudit?.compatible!==true)return {allowed:false,reason:'DEPENDENCY_AUDIT_REQUIRED',candidate:c};
  if(c.requiresCanonicalPromotionGate){
    if(!canonicalPromotionValid(canonicalPromotionEvidence))return {allowed:false,reason:'CANONICAL_PROMOTION_GATE_REQUIRED',candidate:c};
    return {allowed:true,reason:'OPTIONAL_BACKEND_ELIGIBLE',candidate:{...c,status:'ELIGIBLE_AFTER_CANONICAL_BENCHMARK'},canonicalPromotionVersion:CANONICAL_PROMOTION_VERSION};
  }
  if(c.requiresBenchmark&&!shortTermBenchmarkValid(report))return {allowed:false,reason:'REAL_VIDEO_GAIN_REQUIRED',candidate:c};
  if(c.requiresIdentityBenchmark&&!identityBenchmarkValid(report))return {allowed:false,reason:'PERSISTENT_IDENTITY_GAIN_REQUIRED',candidate:c};
  return {allowed:true,reason:'OPTIONAL_BACKEND_ELIGIBLE',candidate:{...c,status:'ELIGIBLE_AFTER_BENCHMARK'}};
}
function assertPromotable(id,report,dependencyAudit,canonicalPromotionEvidence){
  const verdict=promotionVerdict(id,report,dependencyAudit,canonicalPromotionEvidence);
  if(!verdict.allowed){const e=new Error('CAY tracking backend promotion blocked: '+verdict.reason);e.code='CAY_TRACKING_BACKEND_PROMOTION_BLOCKED';e.reason=verdict.reason;throw e;}
  return verdict;
}
root.CAYTrackingBackendCandidateRegistry={version:VERSION,CANONICAL_PROMOTION_VERSION,get,list,resolveLicenseGuard,runtimeLicenseVerdict,runtimeLicenseCompatible,shortTermBenchmarkValid,identityBenchmarkValid,benchmarkReportValid,canonicalPromotionValid,promotionVerdict,assertPromotable};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYTrackingBackendCandidateRegistry;
})(typeof globalThis!=='undefined'?globalThis:this);
