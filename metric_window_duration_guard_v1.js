(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricWindowDurationGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));

  function inspect(row){
    const eligibleRaw=row?.eligibleSeconds;
    const coveredRaw=row?.metricCoveredSeconds;
    const reasons=[];
    if(!finite(eligibleRaw))reasons.push('ELIGIBLE_SECONDS_NON_FINITE');
    else if(Number(eligibleRaw)<0)reasons.push('ELIGIBLE_SECONDS_NEGATIVE');
    if(!finite(coveredRaw))reasons.push('METRIC_COVERED_SECONDS_NON_FINITE');
    else if(Number(coveredRaw)<0)reasons.push('METRIC_COVERED_SECONDS_NEGATIVE');
    if(finite(eligibleRaw)&&finite(coveredRaw)&&Number(eligibleRaw)>=0&&Number(coveredRaw)>=0&&Number(coveredRaw)>Number(eligibleRaw))reasons.push('METRIC_COVERAGE_EXCEEDS_ELIGIBLE');
    return {
      valid:reasons.length===0,
      reasons,
      eligibleSeconds:finite(eligibleRaw)?Number(eligibleRaw):null,
      metricCoveredSeconds:finite(coveredRaw)?Number(coveredRaw):null,
      raw:{eligibleSeconds:eligibleRaw,metricCoveredSeconds:coveredRaw},
      policy:'FINITE_NON_NEGATIVE_DURATIONS_AND_METRIC_COVERED_SECONDS_NOT_GREATER_THAN_ELIGIBLE_SECONDS'
    };
  }

  function inspectAll(rows){
    const input=Array.isArray(rows)?rows:[];
    const windows=input.map((row,index)=>({windowIndex:index,...inspect(row)}));
    const invalidWindows=windows.filter(window=>!window.valid);
    return {
      valid:invalidWindows.length===0,
      invalidWindowCount:invalidWindows.length,
      invalidWindowIndexes:invalidWindows.map(window=>window.windowIndex),
      invalidReasons:[...new Set(invalidWindows.flatMap(window=>window.reasons))],
      windows,
      source:'METRIC_WINDOW_DURATION_GUARD_V1'
    };
  }

  return {inspect,inspectAll};
});
