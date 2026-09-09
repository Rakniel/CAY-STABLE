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
  const MAX_SPEED_SOURCE_TOLERANCE_KMH=0.1;
  const PHYSICAL_FIELDS=['distanceM','avgSpeedKmh','sprintCount','sprintQualifiedSeconds','maxSpeedKmh'];
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

  function basePublicationDecision(metric,context={}){
    const identityQuality=context&&context.identityQuality!==undefined&&context.identityQuality!==null?String(context.identityQuality):null;
    if(identityQuality&&identityQuality!=='FIABLE')return {publishable:false,status:'INDISPONIBLE',reason:'identité joueur insuffisamment fiable pour attribuer des métriques physiques individuelles',identityQuality};
    if(!metric||!finite(metric.metricCoverage)||Number(metric.metricCoverage)<=0)return {publishable:false,status:'INDISPONIBLE',reason:'aucune couverture métrique validée',identityQuality};
    if(!finite(metric.metricCoveredSeconds)||Number(metric.metricCoveredSeconds)<MIN_PUBLISHABLE_COVERED_SECONDS)return {publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_PUBLISHABLE_COVERED_SECONDS}s de trajectoire métrique valide`,identityQuality};
    if(!finite(metric.defendableScore)||Number(metric.defendableScore)<MIN_PUBLISHABLE_EVIDENCE_SCORE||metric.quality!=='FIABLE')return {publishable:false,status:'INDISPONIBLE',reason:`preuve métrique insuffisante (score < ${MIN_PUBLISHABLE_EVIDENCE_SCORE.toFixed(2)})`,identityQuality};
    return {publishable:true,status:'FIABLE',reason:null,identityQuality};
  }

  function fieldInvalidDecision(baseDecision,field,label,{integer=false}={}){
    if(!baseDecision?.publishable)return baseDecision;
    const value=field?.value;
    if(!finite(value)||Number(value)<0||(integer&&!Number.isInteger(Number(value))))return {...baseDecision,publishable:false,status:'INDISPONIBLE',reason:`métrique physique invalide ou absente (${label})`};
    return baseDecision;
  }

  function distanceDecision(metric,baseDecision){
    return fieldInvalidDecision(baseDecision,{value:metric?.distanceM},'distanceM');
  }

  function speedPublicationDecision(metric,baseDecision){
    const structural=fieldInvalidDecision(baseDecision,{value:metric?.avgSpeedKmh},'avgSpeedKmh');
    if(!structural?.publishable)return structural;
    const continuousSpeedSeconds=longestContinuousSpeedEvidenceSeconds(metric?.speedSamples);
    if(continuousSpeedSeconds<MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS)return {...structural,publishable:false,status:'INDISPONIBLE',reason:`moins de ${MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS}s continus de preuve vitesse fiable`,continuousSpeedSeconds};
    return {...structural,continuousSpeedSeconds};
  }

  function sprintDecision(metric,speedDecision){
    const count=fieldInvalidDecision(speedDecision,{value:metric?.sprintCount},'sprintCount',{integer:true});
    if(!count?.publishable)return count;
    return fieldInvalidDecision(count,{value:metric?.sprintQualifiedSeconds},'sprintQualifiedSeconds');
  }

  function maxSpeedDecision(metric,speedDecision){
    if(!speedDecision?.publishable)return {publishable:false,status:'INDISPONIBLE',reason:speedDecision?.reason||'preuve vitesse de base indisponible'};
    if(metric?.maxSpeedSourceValid===false)return {publishable:false,status:'INDISPONIBLE',reason:'vitesse maximale source invalide ou absente'};
    if(!finite(metric?.sustainedMaxSpeedKmh))return {publishable:false,status:'INDISPONIBLE',reason:`pic de vitesse non soutenu pendant au moins ${MIN_SUSTAINED_MAX_SPEED_SECONDS}s sur ${MIN_SUSTAINED_MAX_SPEED_INTERVALS} intervalles continus`};
    if(!finite(metric?.instantaneousMaxSpeedKmh)||Number(metric.sustainedMaxSpeedKmh)>Number(metric.instantaneousMaxSpeedKmh)+MAX_SPEED_SOURCE_TOLERANCE_KMH)return {publishable:false,status:'INDISPONIBLE',reason:'vitesse maximale soutenue incohérente avec la vitesse maximale source'};
    return {publishable:true,status:'FIABLE',reason:null};
  }

  function corePublicationDecision(metric,context={}){
    const robustMetric=metricWithRobustPeak(metric);
    const base=basePublicationDecision(robustMetric,context);
    const speed=speedPublicationDecision(robustMetric,base);
    const sprints=sprintDecision(robustMetric,speed);
    return sprints;
  }

  function publicationDecision(metric,context={}){
    const robustMetric=metricWithRobustPeak(metric);
    const base=basePublicationDecision(robustMetric,context);
    const distance=distanceDecision(robustMetric,base);
    const speed=speedPublicationDecision(robustMetric,base);
    const sprints=sprintDecision(robustMetric,speed);
    const max=maxSpeedDecision(robustMetric,speed);
    const publishable=distance.publishable&&speed.publishable&&sprints.publishable&&max.publishable;
    return {publishable,status:publishable?'FIABLE':'INDISPONIBLE',reason:publishable?null:(distance.reason||speed.reason||sprints.reason||max.reason),identityQuality:base.identityQuality,continuousSpeedSeconds:speed.continuousSpeedSeconds};
  }

  function applyPublicationPolicy(metric,context={}){
    if(!metric)return metric;
    const robustMetric=metricWithRobustPeak(metric);
    const base=basePublicationDecision(robustMetric,context);
    const distance=distanceDecision(robustMetric,base);
    const speed=speedPublicationDecision(robustMetric,base);
    const sprints=sprintDecision(robustMetric,speed);
    const max=maxSpeedDecision(robustMetric,speed);
    const diagnostic={};
    for(const field of PHYSICAL_FIELDS)diagnostic[field]=robustMetric[field]===undefined?null:robustMetric[field];
    diagnostic.instantaneousMaxSpeedKmh=robustMetric.instantaneousMaxSpeedKmh;
    diagnostic.sustainedMaxSpeedKmh=robustMetric.sustainedMaxSpeedKmh;
    const diagnosticMetricCoverage=finite(robustMetric.metricCoverage)?Number(robustMetric.metricCoverage):0;
    const published={
      distanceM:distance.publishable?diagnostic.distanceM:null,
      avgSpeedKmh:speed.publishable?diagnostic.avgSpeedKmh:null,
      sprintCount:sprints.publishable?diagnostic.sprintCount:null,
      sprintQualifiedSeconds:sprints.publishable?diagnostic.sprintQualifiedSeconds:null,
      maxSpeedKmh:max.publishable?diagnostic.maxSpeedKmh:null
    };
    const anyPublished=distance.publishable||speed.publishable||sprints.publishable||max.publishable;
    const allPublished=distance.publishable&&speed.publishable&&sprints.publishable&&max.publishable;
    const parentStatus=anyPublished?'FIABLE':'INDISPONIBLE';
    const parentReason=anyPublished?null:(base.reason||distance.reason||speed.reason||sprints.reason||max.reason);
    const fieldStatus={
      distanceM:{status:distance.status,reason:distance.reason},
      avgSpeedKmh:{status:speed.status,reason:speed.reason},
      sprintCount:{status:sprints.status,reason:sprints.reason},
      sprintQualifiedSeconds:{status:sprints.status,reason:sprints.reason},
      maxSpeedKmh:{status:max.status,reason:max.reason}
    };
    return {...robustMetric,...published,metricCoverage:anyPublished?diagnosticMetricCoverage:0,diagnosticMetricCoverage:+diagnosticMetricCoverage.toFixed(4),continuousSpeedEvidenceSeconds:speed.continuousSpeedSeconds??longestContinuousSpeedEvidenceSeconds(robustMetric.speedSamples),diagnosticPhysicalMetrics:diagnostic,publication:{status:parentStatus,reason:parentReason,identityQuality:base.identityQuality??null,requiresReliableIdentity:true,fieldStatus,anyPhysicalFieldAvailable:anyPublished,allPhysicalFieldsAvailable:allPublished,minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,minSustainedMaxSpeedSeconds:MIN_SUSTAINED_MAX_SPEED_SECONDS,minSustainedMaxSpeedIntervals:MIN_SUSTAINED_MAX_SPEED_INTERVALS,maxSpeedSourceToleranceKmh:MAX_SPEED_SOURCE_TOLERANCE_KMH,policy:'PUBLICATION_PAR_PREUVE_SPECIFIQUE: IDENTITE+COUVERTURE+QUALITE COMMUNES; VALIDITE_STRUCTURELLE PAR CHAMP; DISTANCE INDEPENDANTE; VITESSE_MOYENNE EXIGE EN PLUS CONTINUITE; SPRINTS EXIGENT VITESSE+COMPTEUR+DUREE VALIDES; VITESSE_MAX EXIGE VITESSE+SOURCE+PIC SOUTENU COHERENT AVEC LE MAXIMUM SOURCE'}};
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
      if(report.team){report.team.playersWithPublishedPhysicalMetrics=publishablePlayers;report.team.playersWithPublishedMaxSpeed=publishedMaxSpeedPlayers;report.team.measuredDistanceM=+publishedDistanceM.toFixed(2);report.team.physicalMetricPublicationPolicy='SOMME_DISTANCE_SUR_PREUVE_FIABLE; VALIDITE_STRUCTURELLE PAR CHAMP; VITESSE/SPRINTS EXIGENT CONTINUITE; VITESSE_MAX PUBLIEE SEPAREMENT UNIQUEMENT SI PIC SOUTENU ET COHERENT AVEC MAX SOURCE';}
      report.metricPublicationGuard={version:'CAY_METRIC_PUBLICATION_GUARD_V1_5',minEvidenceScore:MIN_PUBLISHABLE_EVIDENCE_SCORE,minCoveredSeconds:MIN_PUBLISHABLE_COVERED_SECONDS,minContinuousSpeedEvidenceSeconds:MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,maxContinuousSpeedGapSeconds:MAX_CONTINUOUS_SPEED_GAP_SECONDS,minSustainedMaxSpeedSeconds:MIN_SUSTAINED_MAX_SPEED_SECONDS,minSustainedMaxSpeedIntervals:MIN_SUSTAINED_MAX_SPEED_INTERVALS,maxSpeedSourceToleranceKmh:MAX_SPEED_SOURCE_TOLERANCE_KMH,requiresReliablePlayerIdentity:true,principle:'publication fail-closed par champ après preuve commune identité/couverture/qualité: chaque valeur est validée structurellement sans bloquer les autres; vitesse moyenne et sprints ajoutent une exigence de continuité; vitesse max ajoute une preuve de pic soutenu cohérente avec le maximum source'};
      return report;
    };
    Stats.__cayMetricPublicationGuardPatched=true;return true;
  }

  patch();
  return {publicationDecision,corePublicationDecision,basePublicationDecision,distanceDecision,speedPublicationDecision,sprintDecision,maxSpeedDecision,applyPublicationPolicy,longestContinuousSpeedEvidenceSeconds,sustainedMaxSpeedKmh,patch,MIN_PUBLISHABLE_EVIDENCE_SCORE,MIN_PUBLISHABLE_COVERED_SECONDS,MIN_CONTINUOUS_SPEED_EVIDENCE_SECONDS,MAX_CONTINUOUS_SPEED_GAP_SECONDS,MIN_SUSTAINED_MAX_SPEED_SECONDS,MIN_SUSTAINED_MAX_SPEED_INTERVALS,MAX_SPEED_SOURCE_TOLERANCE_KMH};
});
