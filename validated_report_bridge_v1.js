(function(root,factory){
  if(typeof module==='object'&&module.exports){
    module.exports=factory(require('./player_stats_v1.js'),require('./replacement_events_v1.js'));
  }else{
    root.CAYValidatedReport=factory(root.CAYPlayerStats,root.CAYReplacementEvents);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(PlayerStats,ReplacementEvents){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hypot=(a,b)=>Math.hypot((b.x||0)-(a.x||0),(b.y||0)-(a.y||0));
  const qualityFromCoverage=c=>c>=.8?'FIABLE':c>0?'PARTIEL':'INDISPONIBLE';
  const MAX_METRIC_GAP_SEC=Number(PlayerStats?.MAX_METRIC_GAP_SEC)||1;
  function ensureDeps(){
    if(!PlayerStats||typeof PlayerStats.buildReport!=='function')throw new Error('CAYPlayerStats.buildReport requis');
    if(!ReplacementEvents||typeof ReplacementEvents.buildValidatedReplacementLayer!=='function'||typeof ReplacementEvents.applyToPlayerCard!=='function')throw new Error('CAYReplacementEvents requis');
  }
  function segmentHeatmap(points,cols=6,rows=4){
    const cells=Array.from({length:rows},()=>Array(cols).fill(0));
    for(const p of points||[]){
      if(!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y)))continue;
      const x=clamp(Number(p.x),0,.999999),y=clamp(Number(p.y),0,.999999);
      cells[Math.floor(y*rows)][Math.floor(x*cols)]++;
    }
    const observations=cells.reduce((s,row)=>s+row.reduce((a,b)=>a+b,0),0);
    return {cols,rows,cells,max:cells.reduce((m,r)=>Math.max(m,...r),0),observations};
  }
  function buildSegmentVisuals(coreState){
    const byId=new Map();
    for(const tr of [...(coreState?.archive||[]),...(coreState?.active||[])]){
      const segments=new Map();
      for(const p of tr.fullPath||[]){
        const segment=Number(p.segment);
        if(!Number.isFinite(segment)||!Number.isFinite(Number(p.time)))continue;
        if(!Number.isFinite(Number(p.x))||!Number.isFinite(Number(p.y)))continue;
        if(!segments.has(segment))segments.set(segment,[]);
        segments.get(segment).push({time:Number(p.time),segment,x:clamp(Number(p.x),0,1),y:clamp(Number(p.y),0,1)});
      }
      const views=[...segments.entries()].sort((a,b)=>a[0]-b[0]).map(([segment,points])=>{
        points.sort((a,b)=>a.time-b.time);
        const heatmap=segmentHeatmap(points);
        return {
          segment,firstTime:points.length?points[0].time:null,lastTime:points.length?points[points.length-1].time:null,
          observations:points.length,trajectoryNormalized:points,heatmap,
          quality:points.length>=10?'FIABLE':(points.length>=2?'PARTIEL':'INDISPONIBLE'),
          coordinateSpace:'IMAGE_NORMALISEE_SEGMENT',
          fusionRule:'NE_PAS_FUSIONNER_AVEC_UN_AUTRE_SEGMENT_SANS_GEOMETRIE_COMPATIBLE'
        };
      });
      byId.set(tr.globalId,views);
    }
    return byId;
  }
  function buildMetricSegmentProvenance(coreState,projectors){
    const byId=new Map();
    const projectorInfo=PlayerStats&&typeof PlayerStats.projectorInfo==='function'
      ?PlayerStats.projectorInfo
      :(entry=>({validated:false,project:null,source:null,confidence:null,reason:entry?'validation de projection indisponible':'aucune projection terrain fournie'}));
    for(const tr of [...(coreState?.archive||[]),...(coreState?.active||[])]){
      const grouped=new Map();
      for(const p of tr.fullPath||[]){
        const segment=Number(p.segment),time=Number(p.time);
        if(!Number.isFinite(segment)||!Number.isFinite(time))continue;
        if(!grouped.has(segment))grouped.set(segment,[]);
        grouped.get(segment).push({time,x:Number(p.x),y:Number(p.y),segment});
      }
      const rows=[...grouped.entries()].sort((a,b)=>a[0]-b[0]).map(([segment,points])=>{
        points.sort((a,b)=>a.time-b.time);
        const info=projectorInfo((projectors||{})[segment]);
        let eligibleSeconds=0,measuredSeconds=0,rejectedSeconds=0,rejectedPairs=0,acceptedPairs=0,distanceM=0;
        const rejectionReasons={};
        const reject=(reason,dt)=>{rejectedPairs++;rejectedSeconds+=dt;rejectionReasons[reason]=(rejectionReasons[reason]||0)+1;};
        for(let i=1;i<points.length;i++){
          const a=points[i-1],b=points[i],dt=b.time-a.time;
          if(!(dt>0))continue;
          eligibleSeconds+=dt;
          if(dt>MAX_METRIC_GAP_SEC){reject('GAP_TEMPOREL_NON_OBSERVE',dt);continue;}
          if(!info.validated){reject('PROJECTION_NON_VALIDEE',dt);continue;}
          let pa=null,pb=null;
          try{pa=info.project(a);pb=info.project(b);}catch(e){reject('ERREUR_PROJECTION',dt);continue;}
          if(!pa||!pb||![pa.x,pa.y,pb.x,pb.y].every(Number.isFinite)){reject('COORDONNEES_METRIQUES_INVALIDES',dt);continue;}
          const d=hypot(pa,pb);
          if(!Number.isFinite(d)||d<0){reject('DISTANCE_INVALIDE',dt);continue;}
          const speedKmh=(d/dt)*3.6;
          if(!Number.isFinite(speedKmh)||speedKmh>45){reject('VITESSE_NON_DEFENDABLE',dt);continue;}
          measuredSeconds+=dt;distanceM+=d;acceptedPairs++;
        }
        const coverage=eligibleSeconds>0?measuredSeconds/eligibleSeconds:0;
        let reason=null;
        if(eligibleSeconds<=0)reason='aucun intervalle temporel éligible sur ce segment';
        else if(!info.validated)reason=info.reason||'projection terrain non validée';
        else if(measuredSeconds<=0)reason='projection validée mais aucune paire métrique exploitable';
        else if(measuredSeconds<eligibleSeconds)reason='projection métrique exploitable seulement sur une partie des intervalles éligibles';
        return {
          segment,firstTime:points.length?points[0].time:null,lastTime:points.length?points[points.length-1].time:null,
          observations:points.length,eligibleSeconds:+eligibleSeconds.toFixed(3),measuredSeconds:+measuredSeconds.toFixed(3),
          rejectedSeconds:+rejectedSeconds.toFixed(3),coverage:+coverage.toFixed(4),acceptedPairs,rejectedPairs,rejectionReasons,
          distanceM:measuredSeconds>0?+distanceM.toFixed(2):null,metricProjectionValidated:info.validated===true,
          calibrationSource:info.source||null,calibrationConfidence:Number.isFinite(info.confidence)?info.confidence:null,reason,
          quality:eligibleSeconds<=0?'INDISPONIBLE':(coverage>=.8?'FIABLE':(coverage>0?'PARTIEL':'INDISPONIBLE')),
          maxMetricGapSec:MAX_METRIC_GAP_SEC,
          aggregationPolicy:'DISTANCE_VITESSE_SPRINTS_UNIQUEMENT_SUR_PAIRES_METRIQUES_VALIDES_CONTINUES_ET_DEFENDABLES'
        };
      });
      byId.set(tr.globalId,rows);
    }
    return byId;
  }
  function summarizeMetricEvidence(metricById){
    let eligibleSeconds=0,measuredSeconds=0,acceptedPairs=0,rejectedPairs=0,distanceM=0;
    const rejectionReasons={};
    for(const rows of metricById instanceof Map?metricById.values():[]){
      for(const row of rows||[]){
        eligibleSeconds+=Number(row.eligibleSeconds)||0;
        measuredSeconds+=Number(row.measuredSeconds)||0;
        acceptedPairs+=Number(row.acceptedPairs)||0;
        rejectedPairs+=Number(row.rejectedPairs)||0;
        if(Number.isFinite(Number(row.distanceM)))distanceM+=Number(row.distanceM);
        for(const [reason,count] of Object.entries(row.rejectionReasons||{}))rejectionReasons[reason]=(rejectionReasons[reason]||0)+(Number(count)||0);
      }
    }
    const coverage=eligibleSeconds>0?measuredSeconds/eligibleSeconds:0;
    return {
      eligibleSeconds:+eligibleSeconds.toFixed(3),measuredSeconds:+measuredSeconds.toFixed(3),coverage:+coverage.toFixed(4),
      quality:qualityFromCoverage(coverage),acceptedPairs,rejectedPairs,rejectionReasons,
      measuredDistanceM:measuredSeconds>0?+distanceM.toFixed(2):null,
      denominator:'SOMME_DES_INTERVALLES_JOUEURS_ELIGIBLES',
      policy:'COUVERTURE_EQUIPE_BASEE_SUR_PAIRES_METRIQUES_REELLEMENT_ACCEPTEES_PAS_SUR_CALIBRATION_SEULE'
    };
  }
  function buildReport(coreState,coreApi,projectors,replacementEvents){
    ensureDeps();
    const base=PlayerStats.buildReport(coreState,coreApi,projectors||{});
    const ids=(base.players||[]).map(p=>p.id);
    const layer=ReplacementEvents.buildValidatedReplacementLayer(replacementEvents||[],ids);
    const visualById=buildSegmentVisuals(coreState);
    const metricById=buildMetricSegmentProvenance(coreState,projectors||{});
    const metricEvidence=summarizeMetricEvidence(metricById);
    const players=(base.players||[]).map(card=>{
      const withReplacement=ReplacementEvents.applyToPlayerCard(card,layer);
      const segmentVisuals=visualById.get(card.id)||[];
      const metricSegmentProvenance=metricById.get(card.id)||[];
      return {
        ...withReplacement,segmentVisuals,metricSegmentProvenance,
        visualTrajectoryQuality:segmentVisuals.length?(segmentVisuals.every(v=>v.quality==='FIABLE')?'FIABLE':'PARTIEL'):'INDISPONIBLE',
        visualCoordinatesPolicy:'coordonnées image et heatmaps conservées par segment; aucune fusion inter-plans implicite',
        metricAggregationPolicy:'distance, vitesse et sprints agrégés uniquement depuis les paires à projection métrique validée et physiquement défendable; aucune extrapolation silencieuse'
      };
    });
    const unavailable={...(base.unavailable||{})};
    if(layer.confirmedCount>0)delete unavailable.confirmedReplacements;
    else unavailable.confirmedReplacements=layer.rejectedCount
      ?`aucun événement de remplacement validé (${layer.rejectedCount} rejeté${layer.rejectedCount>1?'s':''})`
      :'aucun événement de remplacement validé';
    return {
      ...base,players,
      team:{
        ...(base.team||{}),confirmedReplacements:layer.confirmedCount,replacementQuality:layer.quality,replacementRejectedCount:layer.rejectedCount,
        metricEvidenceCoverage:metricEvidence.coverage,metricEvidenceQuality:metricEvidence.quality,
        metricEvidenceMeasuredSeconds:metricEvidence.measuredSeconds,metricEvidenceEligibleSeconds:metricEvidence.eligibleSeconds
      },
      teamCoverage:{
        ...(base.teamCoverage||{}),
        metricProjection:Number(base.teamCoverage?.metric)||0,
        metricProjectionQuality:base.teamCoverage?.metricQuality||'INDISPONIBLE',
        metric:metricEvidence.coverage,metricQuality:metricEvidence.quality,
        metricCoverageBasis:'PAIRES_JOUEURS_METRIQUES_ACCEPTEES'
      },
      validatedReplacements:layer,
      visualProvenance:{coordinateSpace:'IMAGE_NORMALISEE_PAR_SEGMENT',segmentSeparated:true,crossSegmentFusion:false,reason:'les cadrages caméra peuvent être incompatibles après cut, zoom ou pan'},
      metricProvenance:{
        segmentSeparated:true,crossSegmentCalibrationReuse:false,aggregation:'UNIQUEMENT_PAIRES_METRIQUES_VALIDES_ET_DEFENDABLES',
        unvalidatedPolicy:'conserver présence/identité/coordonnées image, métriques physiques indisponibles',teamEvidence:metricEvidence
      },
      unavailable
    };
  }
  return {buildReport,buildSegmentVisuals,buildMetricSegmentProvenance,summarizeMetricEvidence,segmentHeatmap,MAX_METRIC_GAP_SEC};
});
