(function(root,factory){
  const api=factory(
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./roster_metric_pipeline_v1.js'):root.CAYRosterMetricPipeline
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYRosterMetricAuditRollup=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Pipeline){
  'use strict';

  const VERSION='CAY_ROSTER_METRIC_AUDIT_ROLLUP_V1';
  const finite=v=>v!==null&&v!==undefined&&!(typeof v==='string'&&v.trim()==='')&&Number.isFinite(Number(v));
  const round=(value,digits=3)=>+Number(value||0).toFixed(digits);
  const metricRows=windows=>(Array.isArray(windows)?windows:[]).map(window=>window&&window.metric?window.metric:window).filter(row=>row&&typeof row==='object');
  const sum=(rows,key)=>rows.reduce((total,row)=>total+(finite(row?.[key])?Number(row[key]):0),0);

  const CAUSES=Object.freeze({
    invalidPath:{samples:'rejectedInvalidPathSamples',seconds:'rejectedInvalidPathSeconds',intervals:'rejectedInvalidPathIntervals'},
    segmentBoundary:{seconds:'segmentBoundarySeconds',intervals:'segmentBoundaryBreaks'},
    temporalGap:{seconds:'rejectedGapSeconds',intervals:'gapBreaks'},
    unvalidatedProjector:{samples:'rejectedUnvalidatedProjectorSamples'},
    projectionFailure:{samples:'rejectedProjectionFailureSamples'},
    projectionAffected:{seconds:'rejectedProjectionSeconds',intervals:'rejectedProjectionIntervals'},
    outsidePitch:{samples:'rejectedOutsidePitchSamples',seconds:'rejectedOutsidePitchSeconds',intervals:'rejectedOutsidePitchIntervals'},
    rawMetricSpike:{pairs:'rejectedRawSpikePairs'},
    postSmoothingSpeedVeto:{pairs:'rejectedSpeedPairs'}
  });

  function cause(rows,fields){
    const out={};
    for(const [kind,key] of Object.entries(fields))out[kind]=kind==='seconds'?round(sum(rows,key)):Math.round(sum(rows,key));
    return out;
  }

  function rollup(windows){
    const rows=metricRows(windows);
    const byCause={};
    for(const [name,fields] of Object.entries(CAUSES))byCause[name]=cause(rows,fields);
    return {
      version:VERSION,
      windowCount:rows.length,
      byCause,
      policy:'AUDIT_AGREGE_EXCLUSIVEMENT_DEPUIS_LES_METRIQUES_DE_CHAQUE_FENETRE_DE_PARTICIPATION; AUCUNE_STATISTIQUE_PHYSIQUE_N_EST_RECALCULEE; LES_DUREES_PAR_CAUSE_RESTENT_SEPAREES_ET_NE_SONT_PAS_ADDITIONNEES_EN_UN_FAUX_TOTAL_CAR_CERTAINES_PREUVES_PEUTVENT_SE_RECOUVRIR',
      source:'ROSTER_METRIC_PIPELINE_V1_WINDOWS'
    };
  }

  function flatAudit(audit){
    const c=audit.byCause;
    return {
      rejectedInvalidPathSamples:c.invalidPath.samples,
      rejectedInvalidPathSeconds:c.invalidPath.seconds,
      rejectedInvalidPathIntervals:c.invalidPath.intervals,
      segmentBoundarySeconds:c.segmentBoundary.seconds,
      segmentBoundaryBreaks:c.segmentBoundary.intervals,
      rejectedGapSeconds:c.temporalGap.seconds,
      gapBreaks:c.temporalGap.intervals,
      rejectedUnvalidatedProjectorSamples:c.unvalidatedProjector.samples,
      rejectedProjectionFailureSamples:c.projectionFailure.samples,
      rejectedProjectionSeconds:c.projectionAffected.seconds,
      rejectedProjectionIntervals:c.projectionAffected.intervals,
      rejectedOutsidePitchSamples:c.outsidePitch.samples,
      rejectedOutsidePitchSeconds:c.outsidePitch.seconds,
      rejectedOutsidePitchIntervals:c.outsidePitch.intervals,
      rejectedRawSpikePairs:c.rawMetricSpike.pairs,
      rejectedSpeedPairs:c.postSmoothingSpeedVeto.pairs
    };
  }

  function augmentMetric(metric,windows){
    if(!metric||typeof metric!=='object')return metric;
    const audit=rollup(windows);
    return {...metric,...flatAudit(audit),audit};
  }

  function augmentResult(result){
    if(!result||typeof result!=='object'||!Array.isArray(result.windows))return result;
    return {...result,metric:augmentMetric(result.metric,result.windows),metricAudit:rollup(result.windows)};
  }

  function patch(){
    if(!Pipeline||typeof Pipeline.build!=='function'||Pipeline.__cayRosterMetricAuditRollupPatched===true)return false;
    const baseBuild=Pipeline.build.bind(Pipeline);
    Pipeline.build=function(input){return augmentResult(baseBuild(input));};
    if(typeof Pipeline.aggregateMetrics==='function'){
      const baseAggregate=Pipeline.aggregateMetrics.bind(Pipeline);
      Pipeline.aggregateMetrics=function(rows){return augmentMetric(baseAggregate(rows),rows);};
    }
    Pipeline.__cayRosterMetricAuditRollupPatched=true;
    return true;
  }

  patch();
  return {VERSION,CAUSES,rollup,flatAudit,augmentMetric,augmentResult,patch};
});
