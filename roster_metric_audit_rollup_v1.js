(function(root,factory){
  const api=factory(
    (typeof module==='object'&&module.exports&&typeof require==='function')?require('./roster_metric_pipeline_v1.js'):root.CAYRosterMetricPipeline
  );
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYRosterMetricAuditRollup=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Pipeline){
  'use strict';

  const VERSION='CAY_ROSTER_METRIC_AUDIT_ROLLUP_V1_3';
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

  const CAUSE_LABELS=Object.freeze({
    invalidPath:'trajectoire invalide',
    segmentBoundary:'changement de plan caméra',
    temporalGap:'trou temporel',
    unvalidatedProjector:'projection terrain non validée',
    projectionFailure:'échec de projection terrain',
    projectionAffected:'temps affecté par la projection',
    outsidePitch:'projection hors terrain',
    rawMetricSpike:'mouvement métrique impossible',
    postSmoothingSpeedVeto:'vitesse non défendable'
  });

  function cause(rows,fields){
    const out={};
    for(const [kind,key] of Object.entries(fields))out[kind]=kind==='seconds'?round(sum(rows,key)):Math.round(sum(rows,key));
    return out;
  }

  function causalSummary(byCause,limit=3){
    const rows=[];
    for(const [key,evidence] of Object.entries(byCause||{})){
      const seconds=finite(evidence?.seconds)?Number(evidence.seconds):0;
      const intervals=finite(evidence?.intervals)?Number(evidence.intervals):0;
      const samples=finite(evidence?.samples)?Number(evidence.samples):0;
      const pairs=finite(evidence?.pairs)?Number(evidence.pairs):0;
      const events=Math.max(0,intervals,samples,pairs);
      if(seconds<=0&&events<=0)continue;
      rows.push({key,label:CAUSE_LABELS[key]||key,seconds:round(Math.max(0,seconds)),events:Math.round(events),samples:Math.round(Math.max(0,samples)),intervals:Math.round(Math.max(0,intervals)),pairs:Math.round(Math.max(0,pairs))});
    }
    rows.sort((a,b)=>b.seconds-a.seconds||b.events-a.events||a.key.localeCompare(b.key));
    const max=Math.max(0,Math.floor(Number(limit)||0));
    return {
      status:rows.length?'DISPONIBLE':'AUCUN_REJET_AUDITE',
      topCauses:max?rows.slice(0,max):[],
      activeCauseCount:rows.length,
      policy:'RESUME_CAUSAL_NON_ADDITIF; LES_CAUSES_PEUVENT_SE_RECOUVRIR; AUCUN_TOTAL_DE_SECONDES_PERDUES_N_EST_DEDUIT; ORDRE_PAR_DUREE_PUIS_NOMBRE_D_EVENEMENTS'
    };
  }

  function causalReason(summary){
    const top=Array.isArray(summary?.topCauses)?summary.topCauses:[];
    if(!top.length)return null;
    const text=top.map(row=>{
      const evidence=[];
      if(finite(row?.seconds)&&Number(row.seconds)>0)evidence.push(`${round(row.seconds)} s`);
      if(finite(row?.events)&&Number(row.events)>0)evidence.push(`${Math.round(Number(row.events))} événement(s)`);
      return `${String(row?.label||row?.key||'cause auditée')}${evidence.length?` (${evidence.join(', ')})`:''}`;
    }).join(' ; ');
    return `Causes principales auditées (non additives) : ${text}.`;
  }

  function augmentPublication(publication,audit){
    if(!publication||typeof publication!=='object')return publication;
    const reason=causalReason(audit?.summary);
    if(!reason||!publication.fieldStatus||typeof publication.fieldStatus!=='object')return publication;
    const fieldStatus={};
    for(const [key,value] of Object.entries(publication.fieldStatus)){
      if(!value||typeof value!=='object'||value.status!=='INDISPONIBLE'){
        fieldStatus[key]=value;
        continue;
      }
      const existing=String(value.reason||'preuve spécifique insuffisante pour cette métrique').trim();
      fieldStatus[key]={...value,reason:existing.includes(reason)?existing:`${existing} • ${reason}`};
    }
    return {...publication,fieldStatus,causalAudit:{...audit.summary,reason,policy:'INFORMATION_DIAGNOSTIQUE_UNIQUEMENT; NE_MODIFIE_JAMAIS_LA_DISPONIBILITE_OU_LA_VALEUR_D_UNE_METRIQUE'}};
  }

  function rollup(windows){
    const rows=metricRows(windows);
    const byCause={};
    for(const [name,fields] of Object.entries(CAUSES))byCause[name]=cause(rows,fields);
    return {
      version:VERSION,
      windowCount:rows.length,
      byCause,
      summary:causalSummary(byCause),
      policy:'AUDIT_AGREGE_EXCLUSIVEMENT_DEPUIS_LES_METRIQUES_DE_CHAQUE_FENETRE_DE_PARTICIPATION; AUCUNE_STATISTIQUE_PHYSIQUE_N_EST_RECALCULEE; LES_DUREES_PAR_CAUSE_RESTENT_SEPAREES_ET_NE_SONT_PAS_ADDITIONNEES_EN_UN_FAUX_TOTAL_CAR_CERTAINES_PREUVES_PEUVENT_SE_RECOUVRIR',
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
    return {...metric,...flatAudit(audit),audit,publication:augmentPublication(metric.publication,audit),diagnosticReason:causalReason(audit.summary)};
  }

  function guardSpatialQuality(spatial){
    if(!spatial||typeof spatial!=='object')return spatial;
    const sourceHeatmaps=Array.isArray(spatial.heatmaps)?spatial.heatmaps:[];
    if(!spatial.heatmap||!sourceHeatmaps.length)return spatial;
    const sourceQualities=sourceHeatmaps.map(row=>String(row?.quality||'').trim().toUpperCase());
    const reliableWindowCount=sourceQualities.filter(quality=>quality==='FIABLE').length;
    const mergedQuality=reliableWindowCount===sourceHeatmaps.length?'FIABLE':'PARTIEL';
    const heatmap={...spatial.heatmap,quality:mergedQuality,reliableWindowCount,sourceWindowCount:sourceHeatmaps.length,qualityPolicy:'QUALITE_HEATMAP_AGREGEE_NE_PEUT_ETRE_FIABLE_QUE_SI_TOUTES_LES_FENETRES_SOURCE_SONT_FIABLES'};
    if(spatial.status!=='FIABLE'||mergedQuality==='FIABLE')return {...spatial,heatmap};
    const qualityReason='heatmap terrain disponible mais qualité de preuve insuffisante pour la qualifier de fiable';
    const existing=String(spatial.coverageNote||'').trim();
    return {
      ...spatial,
      status:'PARTIEL',
      reason:spatial.reason||qualityReason,
      coverageNote:existing?(existing.includes(qualityReason)?existing:`${existing} ; ${qualityReason}`):qualityReason,
      heatmap,
      qualityGuard:{status:'PARTIEL',reliableHeatmapWindowCount:reliableWindowCount,heatmapWindowCount:sourceHeatmaps.length,policy:'LE_ROLLUP_ROSTER_NE_PROMEUT_JAMAIS_UNE_HEATMAP_SOURCE_PARTIELLE_EN_FIABLE'}
    };
  }

  function augmentResult(result){
    if(!result||typeof result!=='object'||!Array.isArray(result.windows))return result;
    const metric=augmentMetric(result.metric,result.windows);
    const spatial=guardSpatialQuality(result.spatial);
    const metricReliable=metric?.publication?.status==='FIABLE';
    const downgradedSpatial=result.spatial?.status==='FIABLE'&&spatial?.status==='PARTIEL';
    const status=downgradedSpatial&&!metricReliable?'PARTIEL':result.status;
    const reason=status==='PARTIEL'&&result.status==='FIABLE'?(spatial?.coverageNote||'résultat terrain disponible mais qualité de preuve insuffisante pour le qualifier de fiable'):result.reason;
    return {...result,status,reason,metric,spatial,metricAudit:rollup(result.windows)};
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
  return {VERSION,CAUSES,CAUSE_LABELS,causalSummary,causalReason,augmentPublication,rollup,flatAudit,augmentMetric,guardSpatialQuality,augmentResult,patch};
});