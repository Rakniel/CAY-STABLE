(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYTrackingBenchmarkGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='CAY_TRACKING_BENCHMARK_GATE_V1';
  const TRACKING_METRICS=['HOTA','DetA','AssA','IDF1'];
  const DEFAULT_POLICY=Object.freeze({
    minCandidate:{HOTA:0,DetA:0,AssA:0,IDF1:0},
    maxRegression:{HOTA:0.01,DetA:0.015,AssA:0.01,IDF1:0.01},
    minBboxEvidenceCoverage:1,
    requireSameEvaluationSet:true
  });
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const clamp01=v=>Math.max(0,Math.min(1,Number(v)));

  function normalizeMetric(value){
    if(!finite(value))return null;
    const n=Number(value);
    if(n<0)return null;
    return n>1&&n<=100?n/100:n<=1?n:null;
  }

  function normalizeReport(report){
    if(!report||typeof report!=='object')return null;
    const metrics={};
    for(const key of TRACKING_METRICS)metrics[key]=normalizeMetric(report.metrics?.[key]??report[key]);
    const coverage=normalizeMetric(report.bboxEvidenceCoverage??report.coverage?.bboxEvidenceCoverage);
    const evaluationSet=String(report.evaluationSet??report.datasetId??'').trim()||null;
    const tracker=String(report.tracker??report.name??'').trim()||null;
    return {metrics,bboxEvidenceCoverage:coverage,evaluationSet,tracker,source:report.source??null};
  }

  function normalizePolicy(policy={}){
    const merged={
      minCandidate:{...DEFAULT_POLICY.minCandidate,...(policy.minCandidate||{})},
      maxRegression:{...DEFAULT_POLICY.maxRegression,...(policy.maxRegression||{})},
      minBboxEvidenceCoverage:finite(policy.minBboxEvidenceCoverage)?clamp01(policy.minBboxEvidenceCoverage):DEFAULT_POLICY.minBboxEvidenceCoverage,
      requireSameEvaluationSet:policy.requireSameEvaluationSet!==false
    };
    for(const key of TRACKING_METRICS){
      merged.minCandidate[key]=normalizeMetric(merged.minCandidate[key]);
      merged.maxRegression[key]=normalizeMetric(merged.maxRegression[key]);
      if(merged.minCandidate[key]===null)merged.minCandidate[key]=0;
      if(merged.maxRegression[key]===null)merged.maxRegression[key]=DEFAULT_POLICY.maxRegression[key];
    }
    return merged;
  }

  function compareTrackingReports(baselineInput,candidateInput,policyInput={}){
    const baseline=normalizeReport(baselineInput);
    const candidate=normalizeReport(candidateInput);
    const policy=normalizePolicy(policyInput);
    if(!baseline||!candidate)return {version:VERSION,status:'INDISPONIBLE',reason:'TRACKING_BENCHMARK_REPORT_REQUIRED'};
    if(policy.requireSameEvaluationSet&&(!baseline.evaluationSet||!candidate.evaluationSet||baseline.evaluationSet!==candidate.evaluationSet)){
      return {version:VERSION,status:'INDISPONIBLE',reason:'TRACKING_BENCHMARK_SET_MISMATCH',baseline,candidate,policy};
    }
    if(candidate.bboxEvidenceCoverage===null||candidate.bboxEvidenceCoverage<policy.minBboxEvidenceCoverage){
      return {version:VERSION,status:'INDISPONIBLE',reason:'TRACKING_BENCHMARK_COVERAGE_INSUFFICIENT',baseline,candidate,policy};
    }
    const deltas={},checks=[];
    for(const key of TRACKING_METRICS){
      const b=baseline.metrics[key],c=candidate.metrics[key];
      if(b===null||c===null)return {version:VERSION,status:'INDISPONIBLE',reason:`TRACKING_BENCHMARK_${key}_REQUIRED`,baseline,candidate,policy};
      const delta=c-b;
      deltas[key]=+delta.toFixed(6);
      checks.push({metric:key,baseline:b,candidate:c,delta:deltas[key],minCandidate:policy.minCandidate[key],maxRegression:policy.maxRegression[key],passesFloor:c>=policy.minCandidate[key],passesRegression:delta>=-policy.maxRegression[key]});
    }
    const failed=checks.filter(check=>!check.passesFloor||!check.passesRegression);
    return {
      version:VERSION,
      status:failed.length?'REJETE':'VALIDE',
      reason:failed.length?'TRACKING_REGRESSION_GATE_FAILED':null,
      baseline,candidate,policy,deltas,checks,
      failedMetrics:failed.map(check=>check.metric),
      promotionAllowed:failed.length===0
    };
  }

  return {VERSION,TRACKING_METRICS,DEFAULT_POLICY,normalizeMetric,normalizeReport,normalizePolicy,compareTrackingReports};
});
