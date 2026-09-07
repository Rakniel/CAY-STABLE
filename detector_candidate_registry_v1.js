(function(root){
'use strict';

const VERSION='1.1.0';
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
    id:'rfdetr-soccernet-julianzu9612',family:'rfdetr',license:'Apache-2.0',status:'BENCHMARK_READY',
    runtimeDefaultAllowed:false,requiresWeightProvenance:true,requiresRealVideoBenchmark:true,requiresBrowserExportVerification:true,
    modelSource:'https://huggingface.co/julianzu9612/RFDETR-Soccernet',
    modelRevision:'7e567611ea77efd3a6144b3a61eced5a8c8df8d7',
    classMap:{0:'ball',1:'player',2:'referee',3:'goalkeeper'},
    reportedMetrics:{map50:.857,map:.498,map75:.520,ballPrecision:.785,ballRecall:.712,playerPrecision:.913,playerRecall:.897},
    note:'Model card explicitly declares Apache-2.0 and a four-class SoccerNet map. Still no runtime promotion until an exact local/exported weight id is recorded, ONNX/browser contract is verified, and the locked CAY real-video benchmark passes.'
  },
  'dfine-football-rudrasinghm':{
    id:'dfine-football-rudrasinghm',family:'dfine',license:'Apache-2.0-declared',status:'BENCHMARK_ONLY',
    runtimeDefaultAllowed:false,requiresWeightProvenance:true,requiresRealVideoBenchmark:true,
    note:'Football-specialized D-FINE candidate. No browser runtime promotion without measured real-video results.'
  }
};

function get(id){const c=candidates[String(id||'')];return c?{...c,classMap:c.classMap?{...c.classMap}:c.classMap,reportedMetrics:c.reportedMetrics?{...c.reportedMetrics}:c.reportedMetrics}:null;}
function list(){return Object.keys(candidates).map(get);}
function provenanceValid(p){
  return !!(p&&typeof p==='object'&&String(p.source||'').trim()&&String(p.license||'').trim()&&String(p.weightId||p.sha256||p.revision||'').trim());
}
function benchmarkValid(report){
  return !!(report&&report.version==='CAY_DETECTOR_BENCHMARK_V1'&&report.summary&&report.summary.promotionEligible===true);
}
function browserExportValid(report){
  return !!(report&&report.version==='CAY_RFDETR_BROWSER_EXPORT_V1'&&report.contractVerified===true&&String(report.weightId||report.sha256||'').trim());
}
function promotionVerdict(id,benchmarkReport,provenance,options={}){
  const c=get(id);
  if(!c)return {allowed:false,reason:'UNKNOWN_CANDIDATE'};
  if(c.status==='REJECTED')return {allowed:false,reason:'REJECTED_CANDIDATE',candidate:c};
  if(c.requiresWeightProvenance&&!provenanceValid(provenance))return {allowed:false,reason:'WEIGHT_PROVENANCE_REQUIRED',candidate:c};
  if(c.requiresRealVideoBenchmark&&!benchmarkValid(benchmarkReport))return {allowed:false,reason:'REAL_VIDEO_BENCHMARK_REQUIRED',candidate:c};
  const declaredLicense=String(provenance?.license||'').toLowerCase();
  if(declaredLicense.includes('agpl')||declaredLicense.includes('gpl-')||declaredLicense==='gpl')return {allowed:false,reason:'PROVENANCE_LICENSE_REJECTED',candidate:c};
  if(c.requiresBrowserExportVerification&&!browserExportValid(options.browserExportReport))return {allowed:false,reason:'BROWSER_EXPORT_VERIFICATION_REQUIRED',candidate:c};
  if(c.requiresBrowserExportVerification){
    const exportWeight=String(options.browserExportReport.weightId||options.browserExportReport.sha256||'').trim();
    const provenanceWeight=String(provenance.weightId||provenance.sha256||provenance.revision||'').trim();
    if(exportWeight!==provenanceWeight)return {allowed:false,reason:'BROWSER_EXPORT_WEIGHT_MISMATCH',candidate:c};
  }
  return {allowed:true,reason:'PROMOTION_ELIGIBLE',candidate:{...c,status:'ELIGIBLE_AFTER_BENCHMARK'},benchmarkVersion:benchmarkReport.version};
}
function assertPromotable(id,benchmarkReport,provenance,options){
  const v=promotionVerdict(id,benchmarkReport,provenance,options);
  if(!v.allowed){const e=new Error('CAY detector promotion blocked: '+v.reason);e.code='CAY_DETECTOR_PROMOTION_BLOCKED';e.reason=v.reason;throw e;}
  return v;
}

root.CAYDetectorCandidateRegistry={version:VERSION,get,list,provenanceValid,benchmarkValid,browserExportValid,promotionVerdict,assertPromotable};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYDetectorCandidateRegistry;
})(typeof globalThis!=='undefined'?globalThis:this);
