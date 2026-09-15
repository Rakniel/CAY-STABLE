(function(root,factory){
  const api=factory(
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./roster_metric_pipeline_v1.js'):root.CAYRosterMetricPipeline,
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./metric_window_duration_guard_v1.js'):root.CAYMetricWindowDurationGuard
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYRosterMetricDurationGuardedPipeline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Pipeline,DurationGuard){
  function ensureDependencies(){
    if(!Pipeline||typeof Pipeline.aggregateMetrics!=='function')throw new Error('ROSTER_METRIC_PIPELINE_REQUIRED');
    if(!DurationGuard||typeof DurationGuard.inspectAll!=='function')throw new Error('METRIC_WINDOW_DURATION_GUARD_REQUIRED');
  }

  function aggregateMetrics(rows){
    ensureDependencies();
    const input=Array.isArray(rows)?rows:[];
    const durationAudit=DurationGuard.inspectAll(input);
    if(!durationAudit.valid){
      return {
        status:'INDISPONIBLE',reason:'INVALID_METRIC_WINDOW_DURATIONS',
        metricCoverage:0,metricCoveredSeconds:0,eligibleSeconds:0,
        distanceM:null,avgSpeedKmh:null,maxSpeedKmh:null,sprintCount:null,sprintQualifiedSeconds:null,
        distanceEvidenceComplete:false,maxSpeedEvidenceComplete:false,sprintEvidenceComplete:false,
        quality:'INDISPONIBLE',avgCalibrationConfidence:0,defendableScore:0,speedSamples:[],
        participationWindowCount:input.length,durationAudit,
        source:'ROSTER_METRIC_DURATION_GUARDED_PIPELINE_V1',
        policy:'FAIL_CLOSED_BEFORE_DELEGATING_TO_ROSTER_METRIC_PIPELINE_WHEN_ANY_WINDOW_DURATION_IS_STRUCTURALLY_INVALID'
      };
    }
    return Pipeline.aggregateMetrics(input);
  }

  return {...Pipeline,aggregateMetrics};
});
