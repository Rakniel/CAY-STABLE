(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricPublicationGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Stats){
  'use strict';

  const MIN_PUBLISHABLE_EVIDENCE_SCORE=0.80;
  const MIN_PUBLISHABLE_COVERED_SECONDS=3;
  const PHYSICAL_FIELDS=['distanceM','avgSpeedKmh','maxSpeedKmh','sprintCount','sprintQualifiedSeconds'];
  const finite=v=>Number.isFinite(Number(v));

  function publicationDecision(metric){
    if(!metric||!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0){
      return {publishable:false,status:'INDISPONIBLE',reason:'aucune couverture métrique validée'};
    }
    if(!finite(metric.metricCoveredSeconds)||Number(metric.metricCoveredSeconds)<MIN_PUBLISHABLE_COVERED_SECONDS){
      return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_PUBLISHABLE_COVERED_SECONDS}s de trajectoire métrique valide`};
    }
    if(!finite(metric.defendableScore)||Number(metric.defendableScore)<MIN_PUBLISHABLE_EVIDENCE_SCORE||metric.quality!=='FIABLE'){
      return {publishable:false,status:'INDISPONIBLE',reason:`preuve métrique insuffisante (score < ${MIN_PUBLISHABLE_EVIDENCE_SCORE.toFixed(2)})`};
    }
    if(metric.distanceM===null||metric.avgSpeedKmh===null||metric.maxSpeedKmh===null||metric.sprintCount===null){
      return {publishable:false,status:'INDISPONIBLE',reason:'métriques physiques incomplètes'};
    }
    return {publishable:true,status:'FIABLE',reason:null};
  }

  function applyPublicationPolicy(metric){
    if(!metric)return metric;
    const decision=publicationDecision(metric);
    const diagnostic={};
    for(const field of PHYSICAL_FIELDS)diagnostic[field]=metric[field]===undefined?null:metric[field];
    const published={};
    for(const field of PHYSICAL_FIELDS)published[field]=decision.publishable?diagnostic[field]:null;
    return {
      ...metric,
      ...published,
      diagnosticPhysicalMetrics:diagnostic,
      publication:{
        status:decision.status,
        reason:decision.reason,
        minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,
        minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,
        policy:'NE_PUBLIE_DISTANCE_VITESSE_SPRINT_QUE_SI_PREUVE_METRIQUE_FIABLE_ET_DUREE_MINIMALE'
      }
    };
  }

  function patch(){
    if(!Stats||typeof Stats.buildReport!=='function'||Stats.__cayMetricPublicationGuardPatched)return false;
    const originalBuildReport=Stats.buildReport.bind(Stats);
    Stats.buildReport=function(coreState,coreApi,projectors){
      const report=originalBuildReport(coreState,coreApi,projectors);
      let publishablePlayers=0,publishedDistanceM=0;
      for(const player of report.players||[]){
        if(!player.metric)continue;
        player.metric=applyPublicationPolicy(player.metric);
        const published=player.metric.publication?.status==='FIABLE';
        if(player.quality){
          player.quality.metricDistance=published?'FIABLE':'INDISPONIBLE';
          player.quality.metricSpeed=published?'FIABLE':'INDISPONIBLE';
          player.quality.sprints=published?'FIABLE':'INDISPONIBLE';
        }
        if(published){
          publishablePlayers++;
          publishedDistanceM+=Number(player.metric.distanceM)||0;
        }
      }
      if(report.team){
        report.team.playersWithPublishedPhysicalMetrics=publishablePlayers;
        report.team.measuredDistanceM=+publishedDistanceM.toFixed(2);
        report.team.physicalMetricPublicationPolicy='SOMME UNIQUEMENT DES JOUEURS AVEC METRIQUES FIABLES';
      }
      report.metricPublicationGuard={
        version:'CAY_METRIC_PUBLICATION_GUARD_V1',
        minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,
        minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,
        principle:'les valeurs partielles restent auditables mais les statistiques physiques affichables deviennent INDISPONIBLE tant que la preuve nest pas FIABLE'
      };
      return report;
    };
    Stats.__cayMetricPublicationGuardPatched=true;
    return true;
  }

  patch();
  return {publicationDecision,applyPublicationPolicy,patch,MIN_PUBLISHABLE_EVIDENCE_SCORE,MIN_PUBLISHABLE_COVERED_SECONDS};
});
