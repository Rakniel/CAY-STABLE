const assert=require('assert');
const Audit=require('../roster_metric_audit_rollup_v1.js');

const windows=[
  {metric:{
    rejectedInvalidPathSamples:1,rejectedInvalidPathSeconds:2,rejectedInvalidPathIntervals:2,
    segmentBoundarySeconds:1,segmentBoundaryBreaks:1,rejectedGapSeconds:3,gapBreaks:1,
    rejectedUnvalidatedProjectorSamples:2,rejectedProjectionFailureSamples:1,rejectedProjectionSeconds:2,rejectedProjectionIntervals:2,
    rejectedOutsidePitchSamples:1,rejectedOutsidePitchSeconds:1,rejectedOutsidePitchIntervals:1,
    rejectedRawSpikePairs:2,rejectedSpeedPairs:1
  }},
  {metric:{
    rejectedInvalidPathSamples:2,rejectedInvalidPathSeconds:1.5,rejectedInvalidPathIntervals:1,
    segmentBoundarySeconds:2,segmentBoundaryBreaks:1,rejectedGapSeconds:0.5,gapBreaks:1,
    rejectedUnvalidatedProjectorSamples:1,rejectedProjectionFailureSamples:3,rejectedProjectionSeconds:4,rejectedProjectionIntervals:2,
    rejectedOutsidePitchSamples:2,rejectedOutsidePitchSeconds:2.5,rejectedOutsidePitchIntervals:2,
    rejectedRawSpikePairs:1,rejectedSpeedPairs:2
  }}
];

const audit=Audit.rollup(windows);
assert.equal(Audit.VERSION,'CAY_ROSTER_METRIC_AUDIT_ROLLUP_V1_3');
assert.equal(audit.windowCount,2);
assert.deepStrictEqual(audit.byCause.invalidPath,{samples:3,seconds:3.5,intervals:3});
assert.deepStrictEqual(audit.byCause.segmentBoundary,{seconds:3,intervals:2});
assert.deepStrictEqual(audit.byCause.temporalGap,{seconds:3.5,intervals:2});
assert.deepStrictEqual(audit.byCause.unvalidatedProjector,{samples:3});
assert.deepStrictEqual(audit.byCause.projectionFailure,{samples:4});
assert.deepStrictEqual(audit.byCause.projectionAffected,{seconds:6,intervals:4});
assert.deepStrictEqual(audit.byCause.outsidePitch,{samples:3,seconds:3.5,intervals:3});
assert.deepStrictEqual(audit.byCause.rawMetricSpike,{pairs:3});
assert.deepStrictEqual(audit.byCause.postSmoothingSpeedVeto,{pairs:3});
assert(!Object.prototype.hasOwnProperty.call(audit,'rejectedSecondsTotal'),'overlapping causal evidence must never be exposed as a fake additive total');
assert.equal(audit.summary.status,'DISPONIBLE');
assert.equal(audit.summary.activeCauseCount,9);
assert.deepStrictEqual(audit.summary.topCauses.map(row=>row.key),['projectionAffected','invalidPath','outsidePitch'],'summary must rank by affected seconds then events without summing overlapping evidence');
assert.deepStrictEqual(audit.summary.topCauses[0],{key:'projectionAffected',label:'temps affecté par la projection',seconds:6,events:4,samples:0,intervals:4,pairs:0});
assert.match(audit.summary.policy,/NON_ADDITIF/);
const causalReason=Audit.causalReason(audit.summary);
assert.match(causalReason,/non additives/i);
assert.match(causalReason,/temps affecté par la projection \(6 s, 4 événement\(s\)\)/i);
assert.match(causalReason,/trajectoire invalide \(3\.5 s, 3 événement\(s\)\)/i);
assert.match(causalReason,/projection hors terrain \(3\.5 s, 3 événement\(s\)\)/i);
assert.doesNotMatch(causalReason,/total/i,'overlapping causes must not be presented as one total');

const baseMetric={
  distanceM:10,metricCoverage:.5,quality:'PARTIEL',
  publication:{
    fieldStatus:{
      distanceM:{status:'INDISPONIBLE',reason:'confiance calibration insuffisante'},
      avgSpeedKmh:{status:'INDISPONIBLE',reason:'couverture vitesse insuffisante'},
      sprintCount:{status:'FIABLE',reason:null}
    },
    policy:'PUBLICATION_FAIL_CLOSED'
  }
};
const augmented=Audit.augmentMetric(baseMetric,windows);
assert.equal(augmented.distanceM,10,'audit rollup must not recalculate or change physical values');
assert.equal(augmented.metricCoverage,.5,'audit rollup must not change metric coverage');
assert.equal(augmented.rejectedProjectionSeconds,6);
assert.equal(augmented.rejectedOutsidePitchSeconds,3.5);
assert.equal(augmented.audit.byCause.invalidPath.samples,3);
assert.equal(augmented.audit.summary.topCauses[0].key,'projectionAffected');
assert.match(augmented.diagnosticReason,/temps affecté par la projection/i);
assert.match(augmented.publication.fieldStatus.distanceM.reason,/confiance calibration insuffisante/i,'existing publication reason must be preserved');
assert.match(augmented.publication.fieldStatus.distanceM.reason,/Causes principales auditées/i,'unavailable metric should receive the already-computed causal explanation used by player cards');
assert.match(augmented.publication.fieldStatus.avgSpeedKmh.reason,/Causes principales auditées/i);
assert.deepStrictEqual(augmented.publication.fieldStatus.sprintCount,baseMetric.publication.fieldStatus.sprintCount,'available fields must not be rewritten by diagnostics');
assert.equal(augmented.publication.policy,'PUBLICATION_FAIL_CLOSED','publication policy must remain unchanged');
assert.equal(augmented.publication.causalAudit.activeCauseCount,9);
assert.match(augmented.publication.causalAudit.policy,/NE_MODIFIE_JAMAIS/);

const noAuditReason=Audit.augmentMetric({publication:{fieldStatus:{distanceM:{status:'INDISPONIBLE',reason:'preuve absente'}}}},[]);
assert.equal(noAuditReason.publication.fieldStatus.distanceM.reason,'preuve absente','empty audit must not fabricate a causal explanation');
assert.equal(noAuditReason.diagnosticReason,null);

const unavailable=Audit.augmentResult({status:'INDISPONIBLE',metric:null,windows});
assert.equal(unavailable.status,'INDISPONIBLE','audit must never promote availability');
assert.equal(unavailable.metric,null);
assert.equal(unavailable.metricAudit.byCause.projectionFailure.samples,4);
assert.equal(unavailable.metricAudit.summary.status,'DISPONIBLE','causal diagnostics remain available even when physical metrics are correctly unavailable');

function spatialResult(qualities,metricPublicationStatus='INDISPONIBLE'){
  const heatmaps=qualities.map((quality,index)=>({windowIndex:index,quality,status:'DISPONIBLE'}));
  return {
    status:'FIABLE',reason:null,windows:[],
    metric:{publication:{status:metricPublicationStatus,fieldStatus:{}}},
    spatial:{
      status:'FIABLE',coverageNote:null,
      heatmap:{status:'DISPONIBLE',windowCount:heatmaps.length},
      heatmaps,
      trajectory:{status:'FIABLE',runs:[[{x:1,y:1,time:0},{x:2,y:2,time:1}]]}
    }
  };
}

const reliableSpatial=Audit.augmentResult(spatialResult(['FIABLE','FIABLE']));
assert.equal(reliableSpatial.status,'FIABLE','all reliable heatmap windows must preserve the reliable roster result');
assert.equal(reliableSpatial.spatial.status,'FIABLE');
assert.equal(reliableSpatial.spatial.heatmap.quality,'FIABLE');
assert.equal(reliableSpatial.spatial.heatmap.reliableWindowCount,2);
assert.equal(reliableSpatial.spatial.heatmap.sourceWindowCount,2);

const partialSpatial=Audit.augmentResult(spatialResult(['FIABLE','PARTIEL']));
assert.equal(partialSpatial.status,'PARTIEL','a partial source heatmap must never be promoted to a reliable roster result');
assert.equal(partialSpatial.spatial.status,'PARTIEL');
assert.equal(partialSpatial.spatial.heatmap.status,'DISPONIBLE','available heatmap evidence remains visible even when reliability is insufficient');
assert.equal(partialSpatial.spatial.heatmap.quality,'PARTIEL');
assert.equal(partialSpatial.spatial.heatmap.reliableWindowCount,1);
assert.equal(partialSpatial.spatial.heatmap.sourceWindowCount,2);
assert.match(partialSpatial.spatial.coverageNote,/qualité de preuve insuffisante/i);
assert.match(partialSpatial.spatial.qualityGuard.policy,/NE_PROMEUT_JAMAIS/i);

const physicalReliable=Audit.augmentResult(spatialResult(['PARTIEL'],'FIABLE'));
assert.equal(physicalReliable.status,'FIABLE','reliable physical metrics may keep the parent result reliable without falsely upgrading the spatial block');
assert.equal(physicalReliable.spatial.status,'PARTIEL');
assert.equal(physicalReliable.spatial.heatmap.quality,'PARTIEL');

const custom=Audit.causalSummary({
  outsidePitch:{seconds:2,intervals:1,samples:1},
  rawMetricSpike:{pairs:5},
  temporalGap:{seconds:2,intervals:3}
},2);
assert.deepStrictEqual(custom.topCauses.map(row=>row.key),['temporalGap','outsidePitch'],'equal durations must use event count as deterministic tie-breaker');
assert.equal(custom.activeCauseCount,3);
assert.equal(custom.topCauses.length,2);

const empty=Audit.rollup([]);
assert.equal(empty.windowCount,0);
assert.deepStrictEqual(empty.byCause.invalidPath,{samples:0,seconds:0,intervals:0});
assert.deepStrictEqual(empty.summary,{status:'AUCUN_REJET_AUDITE',topCauses:[],activeCauseCount:0,policy:'RESUME_CAUSAL_NON_ADDITIF; LES_CAUSES_PEUVENT_SE_RECOUVRIR; AUCUN_TOTAL_DE_SECONDES_PERDUES_N_EST_DEDUIT; ORDRE_PAR_DUREE_PUIS_NOMBRE_D_EVENEMENTS'});

console.log('roster_metric_audit_rollup_nonregression: OK');