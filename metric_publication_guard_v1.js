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
  const DISTANCE_FIELDS=['distanceM'];
  const SPEED_CORE_FIELDS=['avgSpeedKmh','sprintCount','sprintQualifiedSeconds'];
  const CORE_PHYSICAL_FIELDS=[...DISTANCE_FIELDS,...SPEED_CORE_FIELDS];
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
    const sourceMaxSpeedValid=finite(metric.maxSpeedKmh)&&Number(metric.maxSpeedKmh)>=0;
    const sustained=sourceMaxSpeedValid?sustainedMaxSpeedKmh(metric.speedSamples):null;
    return {...metric,maxSpeedSourceValid:sourceMaxSpeedValid,instantaneousMaxSpeedKmh:sourceMaxSpeedValid?Number(metric.maxSpeedKmh):null,sustainedMaxSpeedKmh:sustained,maxSpeedKmh:sustained};
  }

  function baseEvidenceDecision(metric,context={}){
    const identityQuality=context&&context.identityQuality!==undefined&&context.identityQuality!==null?String(context.identityQuality):null;
    if(identityQuality&&identityQuality!=='FIABLE')return {publishable:false,status:'INDISPONIBLE',reason:'identité joueur insuffisamment fiable pour attribuer des métriques physiques individuelles',identityQuality};
    if(!metric||!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0)return {publishable:false,status:'INDISPONIBLE',reason:'aucune couverture métrique validée',identityQuality};
    if(!finite(metric.metricCoveredSeconds)||Number(metric.metricCoveredSeconds)<MIN_PUBLISHABLE_COVERED_SECONDS)return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_PUBLISHABLE_COVERED_SECONDS}s de trajectoire métrique valide`,identityQuality};
    if(!finite(metric.defendableScore)||Number(metric.defendableScore)<MIN_PUBLISHABLE_EVIDENCE_SCORE||metric.quality!=='FIABLE')return {publishable:false,status:'INDISPONIBLE',reason:`preuve métrique insuffisante (score < ${MIN_PUBLISHABLE_EVIDENCE_SCORE.toFixed(2)})`,identityQuality};
    return {publishable:true,status:'FIABLE',reason:null,identityQuality};
  }

  function distancePublicationDecision(metric,context={}){
    const decision=baseEvidenceDecision(metric,context);
    if(!decision.publishable)return decision;
    if(!finite(metric.distanceM)||Number(metric.distanceM)<0)return {...decision,publishable:false,status:'INDISPONIBLE',reason:'métrique physique invalide ou absente (distanceM)'};
    return decision;
  }

  function corePublicationDecision(metric,context={}){
    const decision=baseEvidenceDecision(metric,context);
    if(!decision.publishable)return decision;
    const continuousSpeedSeconds=longestContinuousSpeedEvidenceSeconds(metric.speedSamples);
    if(continuousSpeedSeconds<MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS)return {...decision,publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS}s continus de preuve vitesse fiable`,continuousSpeedSeconds};
    const invalidSpeedField=SPEED_CORE_FIELDS.find(field=>!finite(metric[field])||Number(metric[field])<0);
    if(invalidSpeedField)return {...decision,publishable:false,status:'INDISPONIBLE',reason:`métrique physique invalide ou absente (${invalidSpeedField})`,continuousSpeedSeconds};
    if(!Number.isInteger(Number(metric.sprintCount)))return {...decision,publishable:false,status:'INDISPONIBLE',reason:'compteur de sprints invalide',continuousSpeedSeconds};
    return {...decision,continuousSpeedSeconds};
  }

  function publicationDecision(metric,context={}){
    const decision=corePublicationDecision(metric,context);
    if(!decision.publishable)return decision;
    if(!finite(metric.maxSpeedKmh)||Number(metric.maxSpeedKmh)<0)return {...decision,publishable:false,status:'INDISPONIBLE',reason:'métrique physique invalide ou absente (maxSpeedKmh)'};
    return decision;
  }

  function maxSpeedDecision(metric,baseDecision){
    if(!baseDecision?.publishable)return {publishable:false,status:'INDISPONIBLE',reason:baseDecision?.reason||'preuve métrique de base indisponible'};
    if(metric?.maxSpeedSourceValid===false)return {publishable:false,status:'INDISPONIBLE',reason:'vitesse maximale source invalide ou absente'};
    if(!finite(metric?.sustainedMaxSpeedKmh))return {publishable:false,status:'INDISPONIBLE',reason:`pic de vitesse non soutenu pendant au moins ${MIN_SUSTAINED_MAX_SPEED_SECONDS}s sur ${MIN_SUSTAINED_MAX_SPEED_INTERVALS} intervalles continus`};
    return {publishable:true,status:'FIABLE',reason:null};
  }

  function applyPublicationPolicy(metric,context={}){
    if(!metric)return metric;
    const robustMetric=metricWithRobustPeak(metric),distanceDecision=distancePublicationDecision(robustMetric,context),speedDecision=corePublicationDecision(robustMetric,context),maxDecision=maxSpeedDecision(robustMetric,speedDecision);
    const diagnostic={};
    for(const field of PHYSICAL_FIELDS)diagnostic[field]=robustMetric[field]===undefined?null:robustMetric[field];
    diagnostic.instantaneousMaxSpeedKmh=robustMetric.instantaneousMaxSpeedKmh;diagnostic.sustainedMaxSpeedKmh=robustMetric.sustainedMaxSpeedKmh;
    const diagnosticMetricCoverage=finite(robustMetric.metricCoverage)?Number(robustMetric.metricCoverage):0;
    const published={};
    published.distanceM=distanceDecision.publishable?diagnostic.distanceM:null;
    for(const field of SPEED_CORE_FIELDS)published[field]=speedDecision.publishable?diagnostic[field]:null;
    published.maxSpeedKmh=maxDecision.publishable?diagnostic.maxSpeedKmh:null;
    const anyPublishable=distanceDecision.publishable||speedDecision.publishable||maxDecision.publishable;
    const fieldStatus={distanceM:{status:distanceDecision.status,reason:distanceDecision.reason},avgSpeedKmh:{status:speedDecision.status,reason:speedDecision.reason},sprintCount:{status:speedDecision.status,reason:speedDecision.reason},sprintQualifiedSeconds:{status:speedDecision.status,reason:speedDecision.reason},maxSpeedKmh:{status:maxDecision.status,reason:maxDecision.reason}};
    const publicationStatus=anyPublishable?'FIABLE':'INDISPONIBLE';
    const publicationReason=anyPublishable?null:(distanceDecision.reason||speedDecision.reason||maxDecision.reason||'preuve métrique insuffisante');
    return {...robustMetric,...published,metricCoverage:anyPublishable?diagnosticMetricCoverage:0,diagnosticMetricCoverage:+diagnosticMetricCoverage.toFixed(4),continuousSpeedEvidenceSeconds:speedDecision.continuousSpeedSeconds??longestContinuousSpeedEvidenceSeconds(robustMetric.speedSamples),diagnosticPhysicalMetrics:diagnostic,publication:{status:publicationStatus,reason:publicationReason,identityQuality:distanceDecision.identityQuality??speedDecision.identityQuality??null,requiresReliableIdentity:true,fieldStatus,allPhysicalFieldsAvailable:distanceDecision.publishable&&speedDecision.publishable&&maxDecision.publishable,minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,minSustainedMaxSpeedSeconds:MIN_SUSTAINED_MAX_SPEED_SECONDS,minSustainedMaxSpeedIntervals:MIN_SUSTAINED_MAX_SPEED_INTERVALS,policy:'PUBLICATION_FAIL_CLOSED_PAR_CHAMP; DISTANCE_EXIGE_IDENTITE_FIABLE_COUVERTURE_DUREE_ET_SCORE_DEFENDABLE; VITESSE_MOYENNE_ET_SPRINTS_EXIGENT_EN_PLUS_3S_DE_PREUVE_VITESSE_CONTINUE; VITESSE_MAX_EXIGE_EN_PLUS_UN_PIC_SOUTENU'}};
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
      if(report.team){report.team.playersWithPublishedPhysicalMetrics=publishablePlayers;report.team.playersWithPublishedMaxSpeed=publishedMaxSpeedPlayers;report.team.measuredDistanceM=+publishedDistanceM.toFixed(2);report.team.physicalMetricPublicationPolicy='SOMME_DISTANCE_SUR_PREUVE_FIABLE_MEME_FRAGMENTEE_SANS_RACCORDEMENT_DES_TROUS; VITESSES_ET_SPRINTS_EXIGENT_LEUR_PREUVE_TEMPORELLE_SPECIFIQUE';}
      report.metricPublicationGuard={version:'CAY_METRIC_PUBLICATION_GUARD_V1_3',minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,minSustainedMaxSpeedSeconds:MIN_SUSTAINED_MAX_SPEED_SECONDS,minSustainedMaxSpeedIntervals:MIN_SUSTAINED_MAX_SPEED_INTERVALS,requiresReliablePlayerIdentity:true,principle:'publication fail-closed par champ: la distance peut être publiée sur fenêtres métriques fiables disjointes car aucun trou n’est interpolé; vitesse moyenne et sprints exigent en plus une continuité temporelle de vitesse; le pic de vitesse exige encore une preuve soutenue'};
      return report;
    };
    Stats.__cayMetricPublicationGuardPatched=true;return true;
  }

  patch();
  return {publicationDecision,baseEvidenceDecision,distancePublicationDecision,corePublicationDecision,maxSpeedDecision,applyPublicationPolicy,longestContinuousSpeedEvidenceSeconds,sustainedMaxSpeedKmh,patch,MIN_PUBLISHABLE_EVIDENCE_SCORE,MIN_PUBLISHABLE_COVERED_SECONDS,MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,MAX_CONTINUOUS_SPEED_GAP_SECONDS,MIN_SUSTAINED_MAX_SPEED_SECONDS,MIN_SUSTAINED_MAX_SPEED_INTERVALS};
});