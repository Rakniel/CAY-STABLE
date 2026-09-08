(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYDetectorCocoEvalGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='CAY_DETECTOR_COCOEVAL_GATE_V1';
const METRICS=['AP','AP50','AP75','personAP50','ballAP50'];
const DEFAULT_POLICY=Object.freeze({
  minCandidate:{AP:0,AP50:0,AP75:0,personAP50:0,ballAP50:0},
  maxRegression:{AP:0.01,AP50:0.01,AP75:0.015,personAP50:0.01,ballAP50:0.01},
  minAnnotationCoverage:1,
  requireSameEvaluationSet:true
});
const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
const clamp01=v=>Math.max(0,Math.min(1,Number(v)));
function normalizeMetric(value){if(!finite(value))return null;const n=Number(value);if(n<0)return null;return n>1&&n<=100?n/100:n<=1?n:null;}
function normalizeReport(report){
  if(!report||typeof report!=='object')return null;
  const metrics={};for(const key of METRICS)metrics[key]=normalizeMetric(report.metrics?.[key]??report[key]);
  return {evaluationSet:String(report.evaluationSet??report.datasetId??'').trim()||null,annotationCoverage:normalizeMetric(report.annotationCoverage??report.coverage?.annotationCoverage),metrics,source:report.source??null};
}
function normalizePolicy(policy={}){
  const out={minCandidate:{...DEFAULT_POLICY.minCandidate,...(policy.minCandidate||{})},maxRegression:{...DEFAULT_POLICY.maxRegression,...(policy.maxRegression||{})},minAnnotationCoverage:finite(policy.minAnnotationCoverage)?clamp01(policy.minAnnotationCoverage):1,requireSameEvaluationSet:policy.requireSameEvaluationSet!==false};
  for(const key of METRICS){out.minCandidate[key]=normalizeMetric(out.minCandidate[key])??0;out.maxRegression[key]=normalizeMetric(out.maxRegression[key])??DEFAULT_POLICY.maxRegression[key];}
  return out;
}
function compareReports(baselineInput,candidateInput,policyInput={}){
  const baseline=normalizeReport(baselineInput),candidate=normalizeReport(candidateInput),policy=normalizePolicy(policyInput);
  if(!baseline||!candidate)return {version:VERSION,status:'INDISPONIBLE',reason:'DETECTOR_COCOEVAL_REPORT_REQUIRED'};
  if(policy.requireSameEvaluationSet&&(!baseline.evaluationSet||baseline.evaluationSet!==candidate.evaluationSet))return {version:VERSION,status:'INDISPONIBLE',reason:'DETECTOR_COCOEVAL_SET_MISMATCH',baseline,candidate,policy};
  if(candidate.annotationCoverage===null||candidate.annotationCoverage<policy.minAnnotationCoverage)return {version:VERSION,status:'INDISPONIBLE',reason:'DETECTOR_COCOEVAL_ANNOTATION_COVERAGE_INSUFFICIENT',baseline,candidate,policy};
  const checks=[],deltas={};
  for(const key of METRICS){
    const b=baseline.metrics[key],c=candidate.metrics[key];
    if(b===null||c===null)return {version:VERSION,status:'INDISPONIBLE',reason:`DETECTOR_COCOEVAL_${key}_REQUIRED`,baseline,candidate,policy};
    const delta=c-b;deltas[key]=+delta.toFixed(6);
    checks.push({metric:key,baseline:b,candidate:c,delta:deltas[key],passesFloor:c>=policy.minCandidate[key],passesRegression:delta>=-policy.maxRegression[key],minCandidate:policy.minCandidate[key],maxRegression:policy.maxRegression[key]});
  }
  const failed=checks.filter(c=>!c.passesFloor||!c.passesRegression);
  return {version:VERSION,status:failed.length?'REJETE':'VALIDE',reason:failed.length?'DETECTOR_COCOEVAL_REGRESSION_GATE_FAILED':null,promotionAllowed:failed.length===0,failedMetrics:failed.map(c=>c.metric),baseline,candidate,policy,deltas,checks};
}
return {VERSION,METRICS,DEFAULT_POLICY,normalizeMetric,normalizeReport,normalizePolicy,compareReports};
});
