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
  const MIN_SUSTAINED_MAX_SPEED_SECONDS=1;
  const MIN_SUSTAINED_MAX_SPEED_INTERVALS=2;
  const CORE_PHYSICAL_FIELDS=['distanceM','avgSpeedKmh','sprintCount','sprintQualifiedSeconds'];
  const PHYSICAL_FIELDS=[...CORE_PHYSICAL_FIELDS,'maxSpeedKmh'];
  const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));

  function normalizedSpeedRows(samples){
    return (Array.isArray(samples)?samples:[])
      .filter(s=>s&&finite(s.time)&&s.segment!==undefined&&s.segment!==null&&finite(s.kmh)&&Number(s.kmh)>=0)
      .map(s=>({time:Number(s.time),segment:String(s.segment),kmh:Number(s.kmh)}))
      .sort((a,b)=>a.time-b.time);
  }

  function longestContinuousSpeedEvidenceSeconds(samples){
    const rows=normalizedSpeedRows(samples);
    if(rows.length<2)return 0;
    let best=0,current=0;
    for(let i=1;i<rows.length;i++){
      const a=rows[i-1],b=rows[i],dt=b.time-a.time;
      if(a.segment===b.segment&&dt>0&&dt<=MAX_CONTINUOUS_SPEED_GAP_SECONDS){current+=dt;best=Math.max(best,current);}else current=0;
    }
    return +best.toFixed(3);
  }

  function sustainedMaxSpeedKmh(samples){
    const rows=normalizedSpeedRows(samples);
    if(rows.length<MIN_SUSTAINED_MAX_SPEED_INTERVALS+1)return null;
    let best=null;
    for(let start=0;start<rows.length-1;start++){
      let weighted=0,duration=0,intervals=0;
      const segment=rows[start].segment;
      for(let end=start+1;end<rows.length;end++){
        const a=rows[end-1],b=rows[end],dt=b.time-a.time;
        if(a.segment!==segment||b.segment!==segment||!(dt>0)||dt>MAX_CONTINUOUS_SPEED_GAP_SECONDS)break;
        weighted+=b.kmh*dt;duration+=dt;intervals++;
        if(duration>=MIN_SUSTAINED_MAX_SPEED_SECONDS&&intervals>=MIN_SUSTAINED_MAX_SPEED_INTERVALS){
          const avg=weighted/duration;if(Number.isFinite(avg))best=best===null?avg:Math.max(best,avg);
        }
      }
    }
    return best===null?null:+best.toFixed(2);
  }

  function metricWithRobustPeak(metric){
    if(!metric)return metric;
    const sustained=sustainedMaxSpeedKmh(metric.speedSamples);
    return {...metric,instantaneousMaxSpeedKmh:finite(metric.maxSpeedKmh)?Number(metric.maxSpeedKmh):null,sustainedMaxSpeedKmh:sustained,maxSpeedKmh:sustained};
  }

  function publicationDecision(metric,context={}){
    const identityQuality=context&&context.identityQuality!==undefined&&context.identityQuality!==null?String(context.identityQuality):null;
    if(identityQuality&&identityQuality!=='FIABLE')return {publishable:false,status:'INDISPONIBLE',reason:'identité joueur insuffisamment fiable pour attribuer des métriques physiques individuelles',identityQuality};
    if(!metric||!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0)return {publishable:false,status:'INDISPONIBLE',reason:'aucune couverture métrique validée',identityQuality};
    if(!finite(metric.metricCoveredSeconds)||Number(metric.metricCoveredSeconds)<MIN_PUBLISHABLE_COVERED_SECONDS)return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_PUBLISHABLE_COVERED_SECONDS}s de trajectoire métrique valide`,identityQuality};
    const continuousSpeedSeconds=longestContinuousSpeedEvidenceSeconds(metric.speedSamples);
    if(continuousSpeedSeconds<MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS)return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS}s continus de preuve vitesse fiable`,continuousSpeedSeconds,identityQuality};
    if(!finite(metric.defendableScore)||Number(metric.defendableScore)<MIN_PUBLISHABLE_EVIDENCE_SCORE||metric.quality!=='FIABLE')return {publishable:false,status:'INDISPONIBLE',reason:`preuve métrique insuffisante (score < ${MIN_PUBLISHABLE_EVIDENCE_SCORE.toFixed(2)})`,continuousSpeedSeconds,identityQuality};
    const invalidCoreField=CORE_PHYSICAL_FIELDS.find(field=>!finite(metric[field])||Number(metric[field])<0);
    if(invalidCoreField)return {publishable:false,status:'INDISPONIBLE',reason:`métrique physique invalide ou absente (${invalidCoreField})`,continuousSpeedSeconds,identityQuality};
    if(!Number.isInteger(Number(metric.sprintCount)))return {publishable:false,status:'INDISPONIBLE',reason:'compteur de sprints invalide',continuousSpeedSeconds,identityQuality};
    return {publishable:true,status:'FIABLE',reason:null,continuousSpeedSeconds,identityQuality};
  }

  function maxSpeedDecision(metric,baseDecision){
    if(!baseDecision?.publishable)return {publishable:false,status:'INDISPONIBLE',reason:baseDecision?.reason||'preuve métrique de base indisponible'};
    if(!finite(metric?.sustainedMaxSpeedKmh))return {publishable:false,status:'INDISPONIBLE',reason:`pic de vitesse non soutenu pendant au moins ${MIN_SUSTAINED_MAX_SPEED_SECONDS}s sur ${MIN_SUSTAINED_MAX_SPEED_INTERVALS} intervalles continus`};
    return {publishable:true,status:'FIABLE',reason:null};
  }

  function applyPublicationPolicy(metric,context={}){
    if(!metric)return metric;
    const robustMetric=metricWithRobustPeak(metric),decision=publicationDecision(robustMetric,context),maxDecision=maxSpeedDecision(robustMetric,decision);
    const diagnostic={};
    for(const field of PHYSICAL_FIELDS)diagnostic[field]=robustMetric[field]===undefined?null:robustMetric[field];
    diagnostic.instantaneousMaxSpeedKmh=robustMetric.instantaneousMaxSpeedKmh;diagnostic.sustainedMaxSpeedKmh=robustMetric.sustainedMaxSpeedKmh;
    const diagnosticMetricCoverage=finite(robustMetric.metricCoverage)?Number(robustMetric.metricCoverage):0;
    const published={};
    for(const field of CORE_PHYSICAL_FIELDS)published[field]=decision.publishable?diagnostic[field]:null;
    published.maxSpeedKmh=maxDecision.publishable?diagnostic.maxSpeedKmh:null;
    const fieldStatus={distanceM:{status:decision.status,reason:decision.reason},avgSpeedKmh:{status:decision.status,reason:decision.reason},sprintCount:{status:decision.status,reason:decision.reason},sprintQualifiedSeconds:{status:decision.status,reason:decision.reason},maxSpeedKmh:{status:maxDecision.status,reason:maxDecision.reason}};
    return {...robustMetric,...published,metricCoverage:decision.publishable?diagnosticMetricCoverage:0,diagnosticMetricCoverage:+diagnosticMetricCoverage.toFixed(4),continuousSpeedEvidenceSeconds:decision.continuousSpeedSeconds??longestContinuousSpeedEvidenceSeconds(robustMetric.speedSamples),diagnosticPhysicalMetrics:diagnostic,publication:{status:decision.status,reason:decision.reason,identityQuality:decision.identityQuality??null,requiresReliableIdentity:true,fieldStatus,allPhysicalFieldsAvailable:decision.publishable&&maxDecision.publishable,minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,minSustainedMaxSpeedSeconds:MIN_SUSTAINED_MAX_SPEED_SECONDS,minSustainedMaxSpeedIntervals:MIN_SUSTAINED_MAX_SPEED_INTERVALS,policy:'PUBLIE_CHAQUE_METRIQUE_SELON_SA_PREUVE; DISTANCE_VITESSE_MOYENNE_SPRINTS_PARTAGENT_LE_SOCLE_FIABLE; VITESSE_MAX_EXIGE_EN_PLUS_UN_PIC_SOUTENU'}};
  }

  function patch(){
    if(!Stats||typeof Stats.buildReport!=='function'||Stats.__cayMetricPublicationGuardPatched)return false;
    const originalBuildReport=Stats.buildReport.bind(Stats);
    Stats.buildReport=function(coreState,coreApi,projectors){
      const report=originalBuildReport(coreState,coreApi,projectors);let publishablePlayers=0,publishedMaxSpeedPlayers=0,publishedDistanceM=0;
      for(const player of report.players||[]){
        if(!player.metric)continue;
        const identityQuality=player.identityQuality||player.quality?.identity||null;
        player.metric=applyPublicationPolicy(player.metric,{identityQuality});
        const fields=player.metric.publication?.fieldStatus||{};
        const distancePublished=fields.distanceM?.status==='FIABLE',speedPublished=fields.avgSpeedKmh?.status==='FIABLE',maxSpeedPublished=fields.maxSpeedKmh?.status==='FIABLE',sprintsPublished=fields.sprintCount?.status==='FIABLE';
        if(player.quality){player.quality.metricDistance=distancePublished?'FIABLE':'INDISPONIBLE';player.quality.metricSpeed=speedPublished?'FIABLE':'INDISPONIBLE';player.quality.metricMaxSpeed=maxSpeedPublished?'FIABLE':'INDISPONIBLE';player.quality.sprints=sprintsPublished?'FIABLE':'INDISPONIBLE';}
        if(distancePublished){publishablePlayers++;publishedDistanceM+=Number(player.metric.distanceM)||0;}
        if(maxSpeedPublished)publishedMaxSpeedPlayers++;
      }
      if(report.team){report.team.playersWithPublishedPhysicalMetrics=publishablePlayers;report.team.playersWithPublishedMaxSpeed=publishedMaxSpeedPlayers;report.team.measuredDistanceM=+publishedDistanceM.toFixed(2);report.team.physicalMetricPublicationPolicy='SOMME_DISTANCE_SUR_PREUVE_FIABLE; VITESSE_MAX PUBLIEE SEPAREMENT UNIQUEMENT SI PIC SOUTENU';}
      report.metricPublicationGuard={version:'CAY_METRIC_PUBLICATION_GUARD_V1_2',minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,minSustainedMaxSpeedSeconds:MIN_SUSTAINED_MAX_SPEED_SECONDS,minSustainedMaxSpeedIntervals:MIN_SUSTAINED_MAX_SPEED_INTERVALS,requiresReliablePlayerIdentity:true,principle:'publication fail-closed par champ: le socle identite/couverture/continuite/qualite gouverne distance vitesse moyenne et sprints; le pic de vitesse exige en plus une preuve soutenue sans bloquer les autres champs'};
      return report;
    };
    Stats.__cayMetricPublicationGuardPatched=true;return true;
  }

  patch();
  return {publicationDecision,maxSpeedDecision,applyPublicationPolicy,longestContinuousSpeedEvidenceSeconds,sustainedMaxSpeedKmh,patch,MIN_PUBLISHABLE_EVIDENCE_SCORE,MIN_PUBLISHABLE_COVERED_SECONDS,MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,MAX_CONTINUOUS_SPEED_GAP_SECONDS,MIN_SUSTAINED_MAX_SPEED_SECONDS,MIN_SUSTAINED_MAX_SPEED_INTERVALS};
});