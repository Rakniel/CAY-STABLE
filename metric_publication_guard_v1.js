(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports ? require('./player_stats_v1.js') : root.CAYPlayerStats);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYMetricPublicationGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Stats){
  'use strict';

  const MIN_PUBLISHABLE_EVIDENCE_SCORE=0.80;
  const MIN_PUBLISHABLE_COVERED_SECONDS=3;
  const MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS=3;
  const MAX_CONTINUOUS_SPEED_GAP_SECONDS=1;
  const PHYSICAL_FIELDS=['distanceM','avgSpeedKmh','maxSpeedKmh','sprintCount','sprintQualifiedSeconds'];
  const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));

  function longestContinuousSpeedEvidenceSeconds(samples){
    const rows=(Array.isArray(samples)?samples:[])
      .filter(s=>s&&finite(s.time)&&s.segment!==undefined&&s.segment!==null&&finite(s.kmh)&&Number(s.kmh)>=0)
      .map(s=>({time:Number(s.time),segment:String(s.segment)}))
      .sort((a,b)=>a.time-b.time);
    if(rows.length<2)return 0;
    let best=0,current=0;
    for(let i=1;i<rows.length;i++){
      const a=rows[i-1],b=rows[i],dt=b.time-a.time;
      if(a.segment===b.segment&&dt>0&&dt<=MAX_CONTINUOUS_SPEED_GAP_SECONDS){
        current+=dt;best=Math.max(best,current);
      }else current=0;
    }
    return +best.toFixed(3);
  }

  function publicationDecision(metric,context={}){
    const identityQuality=context&&context.identityQuality!==undefined&&context.identityQuality!==null?String(context.identityQuality):null;
    if(identityQuality&&identityQuality!=='FIABLE'){
      return {publishable:false,status:'INDISPONIBLE',reason:'identité joueur insuffisamment fiable pour attribuer des métriques physiques individuelles',identityQuality};
    }
    if(!metric||!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0){
      return {publishable:false,status:'INDISPONIBLE',reason:'aucune couverture métrique validée',identityQuality};
    }
    if(!finite(metric.metricCoveredSeconds)||Number(metric.metricCoveredSeconds)<MIN_PUBLISHABLE_COVERED_SECONDS){
      return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_PUBLISHABLE_COVERED_SECONDS}s de trajectoire métrique valide`,identityQuality};
    }
    const continuousSpeedSeconds=longestContinuousSpeedEvidenceSeconds(metric.speedSamples);
    if(continuousSpeedSeconds<MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS){
      return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS}s continus de preuve vitesse fiable`,continuousSpeedSeconds,identityQuality};
    }
    if(!finite(metric.defendableScore)||Number(metric.defendableScore)<MIN_PUBLISHABLE_EVIDENCE_SCORE||metric.quality!=='FIABLE'){
      return {publishable:false,status:'INDISPONIBLE',reason:`preuve métrique insuffisante (score < ${MIN_PUBLISHABLE_EVIDENCE_SCORE.toFixed(2)})`,continuousSpeedSeconds,identityQuality};
    }
    const invalidPhysicalField=PHYSICAL_FIELDS.find(field=>!finite(metric[field])||Number(metric[field])<0);
    if(invalidPhysicalField){
      return {publishable:false,status:'INDISPONIBLE',reason:`métrique physique invalide ou absente (${invalidPhysicalField})`,continuousSpeedSeconds,identityQuality};
    }
    if(!Number.isInteger(Number(metric.sprintCount))){
      return {publishable:false,status:'INDISPONIBLE',reason:'compteur de sprints invalide',continuousSpeedSeconds,identityQuality};
    }
    return {publishable:true,status:'FIABLE',reason:null,continuousSpeedSeconds,identityQuality};
  }

  function applyPublicationPolicy(metric,context={}){
    if(!metric)return metric;
    const decision=publicationDecision(metric,context);
    const diagnostic={};
    for(const field of PHYSICAL_FIELDS)diagnostic[field]=metric[field]===undefined?null:metric[field];
    const diagnosticMetricCoverage=finite(metric.metricCoverage)?Number(metric.metricCoverage):0;
    const published={};
    for(const field of PHYSICAL_FIELDS)published[field]=decision.publishable?diagnostic[field]:null;
    return {
      ...metric,
      ...published,
      metricCoverage:decision.publishable?diagnosticMetricCoverage:0,
      diagnosticMetricCoverage:+diagnosticMetricCoverage.toFixed(4),
      continuousSpeedEvidenceSeconds:decision.continuousSpeedSeconds??longestContinuousSpeedEvidenceSeconds(metric.speedSamples),
      diagnosticPhysicalMetrics:diagnostic,
      publication:{
        status:decision.status,
        reason:decision.reason,
        identityQuality:decision.identityQuality??null,
        requiresReliableIdentity:true,
        minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,
        minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,
        minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,
        maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,
        policy:'NE_PUBLIE_DISTANCE_VITESSE_SPRINT_QUE_SI_IDENTITE_JOUEUR_FIABLE_PREUVE_METRIQUE_FIABLE_ET_FENETRE_TEMPORELLE_CONTINUE'
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
        const identityQuality=player.identityQuality||player.quality?.identity||null;
        player.metric=applyPublicationPolicy(player.metric,{identityQuality});
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
        report.team.physicalMetricPublicationPolicy='SOMME UNIQUEMENT DES JOUEURS AVEC IDENTITE FIABLE ET METRIQUES FIABLES ET PREUVE VITESSE CONTINUE';
      }
      report.metricPublicationGuard={
        version:'CAY_METRIC_PUBLICATION_GUARD_V1',
        minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,
        minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,
        minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,
        maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,
        requiresReliablePlayerIdentity:true,
        principle:'les valeurs partielles restent auditables dans diagnosticMetricCoverage/diagnosticPhysicalMetrics mais les statistiques physiques affichables deviennent INDISPONIBLE tant que lidentite joueur et la preuve metrique ne sont pas FIABLES et temporellement continues'
      };
      return report;
    };
    Stats.__cayMetricPublicationGuardPatched=true;
    return true;
  }

  patch();
  return {publicationDecision,applyPublicationPolicy,longestContinuousSpeedEvidenceSeconds,patch,MIN_PUBLISHABLE_EVIDENCE_SCORE,MIN_PUBLISHABLE_COVERED_SECONDS,MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,MAX_CONTINUOUS_SPEED_GAP_SECONDS};
});