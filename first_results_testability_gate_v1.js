(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYFirstResultsTestabilityGate=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const bool=v=>v===true;
  const finite=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));
  const pct=v=>finite(v)?Math.max(0,Math.min(100,Number(v))):null;
  const CORE_KEYS=['tracking','trajectory','heatmap'];
  const PHYSICAL_KEYS=['distance','avgSpeed','maxSpeed','sprints'];

  function nextAction(status,blockers){
    if(status==='PHYSICAL_TESTABLE')return 'PREMIERS_RESULTATS_PRETS';
    if(status==='PITCH_VISUAL_TESTABLE'){
      const missing=PHYSICAL_KEYS.filter(key=>Number(blockers[key]||0)>0);
      return missing.length?'COMPLETER_METRIQUES_PHYSIQUES:'+missing.join(','):'VALIDER_METRIQUES_PHYSIQUES';
    }
    if(status==='TRACKING_TESTABLE'){
      const missing=['trajectory','heatmap'].filter(key=>Number(blockers[key]||0)>0);
      return missing.length?'DEBLOQUER_VISUELS_TERRAIN:'+missing.join(','):'VALIDER_VISUELS_TERRAIN';
    }
    return 'OBTENIR_TRACKING_DEFENDABLE';
  }

  function coverageEvidence(card){
    return {
      trackingPct:pct(card?.presence?.trackingCoverage),
      pitchSpatialPct:pct(card?.pitchVisuals?.spatialCoverage),
      physicalMetricPct:pct(card?.pitchVisuals?.physicalMetricCoverage),
      pitchBasis:card?.pitchVisuals?.spatialCoverageBasis||null,
      participationSeconds:finite(card?.pitchVisuals?.participationSeconds)?Number(card.pitchVisuals.participationSeconds):null,
      renderedSeconds:finite(card?.pitchVisuals?.renderedSeconds)?Number(card.pitchVisuals.renderedSeconds):null,
      policy:'COUVERTURES_REPRISES_EN_LECTURE_SEULE_DEPUIS_LA_FICHE_JOUEUR; AUCUNE_PROMOTION_DE_STATUT_PAR_LA_COUVERTURE_SEULE'
    };
  }

  function summarizeCoverage(evidence,key,eligibleKey){
    const rows=(Array.isArray(evidence)?evidence:[]).filter(item=>item&&item[eligibleKey]===true);
    const knownRows=rows.filter(item=>finite(item?.coverage?.[key]));
    const values=knownRows.map(item=>Number(item.coverage[key]));
    const eligiblePlayers=rows.length;
    const knownPlayers=knownRows.length;
    const unknownPlayers=Math.max(0,eligiblePlayers-knownPlayers);
    const knownPlayerSharePct=eligiblePlayers?+(knownPlayers/eligiblePlayers*100).toFixed(2):null;
    const durationRows=rows.filter(item=>finite(item?.coverage?.participationSeconds)&&Number(item.coverage.participationSeconds)>0);
    const durationKnownPlayers=durationRows.length;
    const durationUnknownPlayers=Math.max(0,eligiblePlayers-durationKnownPlayers);
    const durationKnownPlayerSharePct=eligiblePlayers?+(durationKnownPlayers/eligiblePlayers*100).toFixed(2):null;
    const temporalWeightingComplete=eligiblePlayers>0&&durationKnownPlayers===eligiblePlayers;
    const weightedRows=knownRows.filter(item=>finite(item?.coverage?.participationSeconds)&&Number(item.coverage.participationSeconds)>0);
    const knownParticipationSeconds=weightedRows.reduce((sum,item)=>sum+Number(item.coverage.participationSeconds),0);
    const eligibleParticipationSeconds=durationRows.reduce((sum,item)=>sum+Number(item.coverage.participationSeconds),0);
    const weightedAvgPct=knownParticipationSeconds
      ? +(weightedRows.reduce((sum,item)=>sum+Number(item.coverage[key])*Number(item.coverage.participationSeconds),0)/knownParticipationSeconds).toFixed(2)
      : null;
    const knownParticipationSharePct=temporalWeightingComplete&&eligibleParticipationSeconds
      ? +(knownParticipationSeconds/eligibleParticipationSeconds*100).toFixed(2)
      : null;
    if(!values.length)return {
      eligiblePlayers,knownPlayers,unknownPlayers,knownPlayerSharePct,
      minPct:null,avgPct:null,maxPct:null,weightedAvgPct:null,
      durationKnownPlayers,durationUnknownPlayers,durationKnownPlayerSharePct,temporalWeightingComplete,
      eligibleParticipationSeconds:eligibleParticipationSeconds||null,
      knownParticipationSeconds:knownParticipationSeconds||null,
      knownParticipationSharePct
    };
    const total=values.reduce((sum,value)=>sum+value,0);
    return {
      eligiblePlayers,
      knownPlayers,
      unknownPlayers,
      knownPlayerSharePct,
      minPct:Math.min(...values),
      avgPct:+(total/values.length).toFixed(2),
      maxPct:Math.max(...values),
      weightedAvgPct,
      durationKnownPlayers,
      durationUnknownPlayers,
      durationKnownPlayerSharePct,
      temporalWeightingComplete,
      eligibleParticipationSeconds:eligibleParticipationSeconds||null,
      knownParticipationSeconds:knownParticipationSeconds||null,
      knownParticipationSharePct
    };
  }

  function coverageSummary(evidence){
    return {
      tracking:summarizeCoverage(evidence,'trackingPct','tracking'),
      pitchSpatial:summarizeCoverage(evidence,'pitchSpatialPct','pitchVisualCore'),
      physicalMetric:summarizeCoverage(evidence,'physicalMetricPct','physicalComplete'),
      policy:'RESUME_AUDIT_SEULEMENT_SUR_LES_JOUEURS_ELIGIBLES_A_CHAQUE_ETAPE; MOYENNE_PONDEREE_PAR_TEMPS_DE_PARTICIPATION_QUAND_DISPONIBLE; COMPLETUDE_DES_DUREES_EXPOSEE_EXPLICITEMENT; PART_TEMPORELLE_CONNUE_RESTE_INDISPONIBLE_SI_UNE_DUREE_ELIGIBLE_MANQUE; COUVERTURE_INCONNUE_RESTE_EXPLICITE; AUCUN_SEUIL_DE_COUVERTURE_N_EST_INVENTE_PAR_CE_GARDE'
    };
  }

  function cardEvidence(card){
    const readiness=card?.firstResults||{};
    const tracking=bool(readiness.tracking);
    const trajectory=bool(readiness.trajectory);
    const heatmap=bool(readiness.heatmap);
    const distance=bool(readiness.distance);
    const avgSpeed=bool(readiness.avgSpeed);
    const maxSpeed=bool(readiness.maxSpeed);
    const sprints=bool(readiness.sprints);
    const physicalAny=distance||avgSpeed||maxSpeed||sprints||bool(readiness.physicalMetrics);
    const physicalComplete=distance&&avgSpeed&&maxSpeed&&sprints;
    const pitchVisualCore=tracking&&trajectory&&heatmap;
    const metricReady=pitchVisualCore&&physicalComplete;
    const flags={tracking,trajectory,heatmap,distance,avgSpeed,maxSpeed,sprints};
    const missingPitchVisualCore=CORE_KEYS.filter(key=>flags[key]!==true);
    const missingPhysicalMetrics=PHYSICAL_KEYS.filter(key=>flags[key]!==true);
    const status=metricReady?'PHYSICAL_TESTABLE':pitchVisualCore?'PITCH_VISUAL_TESTABLE':tracking?'TRACKING_TESTABLE':'INDISPONIBLE';
    const blockers={};
    for(const key of CORE_KEYS)blockers[key]=missingPitchVisualCore.includes(key)?1:0;
    for(const key of PHYSICAL_KEYS)blockers[key]=missingPhysicalMetrics.includes(key)?1:0;
    return {
      id:card?.id??null,
      status,
      tracking,
      trajectory,
      heatmap,
      pitchVisualCore,
      physicalAny,
      physicalComplete,
      metricReady,
      coverage:coverageEvidence(card),
      missingPitchVisualCore,
      missingPhysicalMetrics,
      nextAction:nextAction(status,blockers),
      policy:'CORE_VISUEL = TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; PRET_METRIQUES = CORE_VISUEL_ET_DISTANCE_ET_VITESSE_MOYENNE_ET_VITESSE_MAX_ET_SPRINTS'
    };
  }

  function blockerCounts(evidence){
    const keys=[...CORE_KEYS,...PHYSICAL_KEYS];
    const counts={};
    for(const key of keys)counts[key]=evidence.filter(item=>{
      if(key==='tracking'||key==='trajectory'||key==='heatmap')return item.missingPitchVisualCore.includes(key);
      return item.missingPhysicalMetrics.includes(key);
    }).length;
    return counts;
  }

  function evaluate(playerCards,options={}){
    const cards=Array.isArray(playerCards?.players)?playerCards.players:[];
    const evidence=cards.map(cardEvidence);
    const count=key=>evidence.filter(item=>item[key]===true).length;
    const players=evidence.length;
    const minCorePlayers=finite(options.minCorePlayers)?Math.max(1,Math.floor(Number(options.minCorePlayers))):1;
    const minMetricPlayers=finite(options.minMetricPlayers)?Math.max(1,Math.floor(Number(options.minMetricPlayers))):1;
    const withTracking=count('tracking');
    const withCorePitchVisuals=count('pitchVisualCore');
    const withAnyPhysicalMetrics=count('physicalAny');
    const withCompletePhysicalMetrics=count('physicalComplete');
    const metricReadyPlayers=count('metricReady');
    const coreTestable=withCorePitchVisuals>=minCorePlayers;
    const physicalTestable=metricReadyPlayers>=minMetricPlayers;
    const status=physicalTestable?'PHYSICAL_TESTABLE':coreTestable?'PITCH_VISUAL_TESTABLE':withTracking>0?'TRACKING_TESTABLE':'INDISPONIBLE';
    const blockers=blockerCounts(evidence);
    return {
      version:'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_7',
      status,
      players,
      withTracking,
      withCorePitchVisuals,
      withAnyPhysicalMetrics,
      withCompletePhysicalMetrics,
      metricReadyPlayers,
      thresholds:{minCorePlayers,minMetricPlayers},
      coreTestable,
      physicalTestable,
      blockers,
      coverageSummary:coverageSummary(evidence),
      nextAction:nextAction(status,blockers),
      evidence,
      policy:'FAIL_CLOSED; AUCUN_JOUEUR_PRET_TERRAIN_SANS_TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; AUCUN_JOUEUR_PRET_METRIQUES_SANS_4_METRIQUES_PHYSIQUES_DEFENDABLES; COUVERTURES_EXPOSEES_ET_RESUMEES_AVEC_INCONNU_ET_PONDERATION_TEMPORELLE_SANS_MODIFIER_LA_DECISION; COMPLETUDE_DES_DUREES_REQUISE_POUR_PUBLIER_UNE_PART_TEMPORELLE_CONNUE'
    };
  }

  function installRuntime(){
    const Bridge=typeof globalThis!=='undefined'?globalThis.CAYStableTrackingBridge:null;
    if(!Bridge||typeof Bridge.create!=='function'||Bridge.__cayFirstResultsTestabilityPatched)return false;
    const baseCreate=Bridge.create.bind(Bridge);
    Bridge.create=function(options){
      const instance=baseCreate(options);
      if(!instance||typeof instance.report!=='function')return instance;
      const baseReport=instance.report.bind(instance);
      instance.report=function(projectors,visualOptions){
        const report=baseReport(projectors,visualOptions);
        if(!report||!report.playerCards||!Array.isArray(report.playerCards.players))return report;
        const testability=evaluate(report.playerCards);
        report.playerCards={...report.playerCards,testability};
        report.firstResultsTestability=testability;
        return report;
      };
      return instance;
    };
    Bridge.__cayFirstResultsTestabilityPatched=true;
    return true;
  }

  installRuntime();
  return {cardEvidence,coverageEvidence,summarizeCoverage,coverageSummary,blockerCounts,nextAction,evaluate,installRuntime};
});
