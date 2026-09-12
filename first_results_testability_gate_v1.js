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

  function rosterEligibility(card){
    const rosterScoped=!!card&&Object.prototype.hasOwnProperty.call(card,'roster');
    if(!rosterScoped)return {clubEligible:true,rosterScoped:false,reason:null};
    const clubEligible=card?.roster?.status==='LIÉ';
    return {clubEligible,rosterScoped:true,reason:clubEligible?null:'ROSTER_NON_LIE'};
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
    const clubEvidence=(Array.isArray(evidence)?evidence:[]).filter(item=>item?.clubEligible!==false);
    return {
      tracking:summarizeCoverage(clubEvidence,'trackingPct','tracking'),
      pitchSpatial:summarizeCoverage(clubEvidence,'pitchSpatialPct','pitchVisualCore'),
      physicalMetric:summarizeCoverage(clubEvidence,'physicalMetricPct','physicalComplete'),
      policy:'RESUME_AUDIT_SEULEMENT_SUR_LES_JOUEURS_CAY_ELIGIBLES_ET_ELIGIBLES_A_CHAQUE_ETAPE; UNE_PISTE_NON_LIEE_AU_ROSTER_EST_EXCLUE_DES_DENOMINATEURS; MOYENNE_PONDEREE_PAR_TEMPS_DE_PARTICIPATION_QUAND_DISPONIBLE; COMPLETUDE_DES_DUREES_EXPOSEE_EXPLICITEMENT; PART_TEMPORELLE_CONNUE_RESTE_INDISPONIBLE_SI_UNE_DUREE_ELIGIBLE_MANQUE; COUVERTURE_INCONNUE_RESTE_EXPLICITE; AUCUN_SEUIL_DE_COUVERTURE_N_EST_INVENTE_PAR_CE_GARDE'
    };
  }

  function cardEvidence(card){
    const readiness=card?.firstResults||{};
    const eligibility=rosterEligibility(card);
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
    const rawStatus=metricReady?'PHYSICAL_TESTABLE':pitchVisualCore?'PITCH_VISUAL_TESTABLE':tracking?'TRACKING_TESTABLE':'INDISPONIBLE';
    const status=eligibility.clubEligible?rawStatus:'INDISPONIBLE';
    const blockers={};
    for(const key of CORE_KEYS)blockers[key]=missingPitchVisualCore.includes(key)?1:0;
    for(const key of PHYSICAL_KEYS)blockers[key]=missingPhysicalMetrics.includes(key)?1:0;
    return {
      id:card?.id??null,
      status,
      diagnosticStatus:rawStatus,
      clubEligible:eligibility.clubEligible,
      rosterScoped:eligibility.rosterScoped,
      exclusionReason:eligibility.reason,
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
      nextAction:eligibility.clubEligible?nextAction(status,blockers):'LIER_PISTE_AU_ROSTER_CAY',
      policy:'CORE_VISUEL = TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; PRET_METRIQUES = CORE_VISUEL_ET_DISTANCE_ET_VITESSE_MOYENNE_ET_VITESSE_MAX_ET_SPRINTS; SI_CONTEXTE_ROSTER_PRESENT_SEULE_UNE_PISTE_EXPLICITEMENT_LIEE_EST_ELIGIBLE_AUX_RESULTATS_CAY'
    };
  }

  function canonicalCardReadiness(card,evidence){
    const source=card?.firstResults||{};
    const item=evidence||cardEvidence(card);
    if(item.clubEligible===false){
      return {
        ...source,
        status:'INDISPONIBLE',
        tracking:false,
        trajectory:false,
        heatmap:false,
        distance:false,
        avgSpeed:false,
        maxSpeed:false,
        sprints:false,
        physicalMetrics:false,
        physicalMetricsComplete:false,
        pitchVisualCore:false,
        pitchResults:false,
        metricReady:false,
        clubEligible:false,
        exclusionReason:item.exclusionReason||'ROSTER_NON_LIE',
        nextAction:'LIER_PISTE_AU_ROSTER_CAY',
        policy:'PISTE_NON_LIEE_AU_ROSTER_CAY_EXCLUE_DES_PREMIERS_RESULTATS; LES_PREUVES_BRUTES_RESTENT_DIAGNOSTIQUES_MAIS_NE_SONT_JAMAIS_PUBLIEES_COMME_RESULTATS_JOUEUR_CAY'
      };
    }
    return {
      ...source,
      status:item.status,
      tracking:item.tracking,
      trajectory:item.trajectory,
      heatmap:item.heatmap,
      distance:bool(source.distance),
      avgSpeed:bool(source.avgSpeed),
      maxSpeed:bool(source.maxSpeed),
      sprints:bool(source.sprints),
      physicalMetrics:item.physicalAny,
      physicalMetricsComplete:item.physicalComplete,
      pitchVisualCore:item.pitchVisualCore,
      pitchResults:item.pitchVisualCore,
      metricReady:item.metricReady,
      clubEligible:true,
      exclusionReason:null,
      nextAction:item.nextAction,
      policy:'STATUT_CANONIQUE_ALIGNE_SUR_CAY_FIRST_RESULTS_TESTABILITY_GATE; TERRAIN_PRET_UNIQUEMENT_AVEC_TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; PHYSIQUE_PRET_UNIQUEMENT_AVEC_4_METRIQUES; EN_CONTEXTE_ROSTER_SEULE_UNE_PISTE_LIEE_PEUT_ETRE_PUBLIEE_COMME_JOUEUR_CAY'
    };
  }

  function blockerCounts(evidence){
    const rows=(Array.isArray(evidence)?evidence:[]).filter(item=>item?.clubEligible!==false);
    const counts={
      tracking:rows.filter(item=>item?.tracking!==true).length,
      trajectory:rows.filter(item=>item?.tracking===true&&item?.trajectory!==true).length,
      heatmap:rows.filter(item=>item?.tracking===true&&item?.heatmap!==true).length
    };
    for(const key of PHYSICAL_KEYS){
      counts[key]=rows.filter(item=>item?.pitchVisualCore===true&&Array.isArray(item?.missingPhysicalMetrics)&&item.missingPhysicalMetrics.includes(key)).length;
    }
    return counts;
  }

  function evaluate(playerCards,options={}){
    const cards=Array.isArray(playerCards?.players)?playerCards.players:[];
    const evidence=cards.map(cardEvidence);
    const eligibleEvidence=evidence.filter(item=>item?.clubEligible!==false);
    const count=key=>eligibleEvidence.filter(item=>item[key]===true).length;
    const players=evidence.length;
    const eligibleClubPlayers=eligibleEvidence.length;
    const excludedNonClubPlayers=Math.max(0,players-eligibleClubPlayers);
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
      version:'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8',
      status,
      players,
      eligibleClubPlayers,
      excludedNonClubPlayers,
      withTracking,
      withCorePitchVisuals,
      withAnyPhysicalMetrics,
      withCompletePhysicalMetrics,
      metricReadyPlayers,
      thresholds:{minCorePlayers,minMetricPlayers},
      coreTestable,
      physicalTestable,
      blockers,
      blockerEligibility:{pitchVisualPlayers:withTracking,physicalPlayers:withCorePitchVisuals},
      coverageSummary:coverageSummary(evidence),
      nextAction:nextAction(status,blockers),
      evidence,
      policy:'FAIL_CLOSED; EN_CONTEXTE_ROSTER_SEULE_UNE_PISTE_EXPLICITEMENT_LIEE_COMPTE_COMME_JOUEUR_CAY; PISTES_NON_LIEES_EXCLUES_DES_STATUTS_BLOQUEURS_ET_DENOMINATEURS_DE_COUVERTURE; SANS_CONTEXTE_ROSTER_COMPORTEMENT_LEGACY_CONSERVE; AUCUN_JOUEUR_PRET_TERRAIN_SANS_TRACKING_ET_TRAJECTOIRE_ET_HEATMAP; AUCUN_JOUEUR_PRET_METRIQUES_SANS_4_METRIQUES_PHYSIQUES_DEFENDABLES; BLOQUEURS_VISUELS_COMPTES_UNIQUEMENT_PARMI_LES_JOUEURS_TRACKES; BLOQUEURS_PHYSIQUES_COMPTES_UNIQUEMENT_PARMI_LES_JOUEURS_AVEC_CORE_VISUEL_COMPLET; COUVERTURES_EXPOSEES_ET_RESUMEES_AVEC_INCONNU_ET_PONDERATION_TEMPORELLE_SANS_MODIFIER_LA_DECISION; COMPLETUDE_DES_DUREES_REQUISE_POUR_PUBLIER_UNE_PART_TEMPORELLE_CONNUE; FICHES_JOUEURS_REALIGNEES_SUR_CE_STATUT_CANONIQUE'
    };
  }

  function alignPlayerCards(playerCards,testability){
    if(!playerCards||!Array.isArray(playerCards.players))return playerCards;
    const evidence=Array.isArray(testability?.evidence)?testability.evidence:playerCards.players.map(cardEvidence);
    const players=playerCards.players.map((card,index)=>({...card,firstResults:canonicalCardReadiness(card,evidence[index])}));
    const eligibleEvidence=evidence.filter(item=>item?.clubEligible!==false);
    const coreReadyPlayers=eligibleEvidence.filter(item=>item?.pitchVisualCore===true).length;
    const physicalReadyPlayers=eligibleEvidence.filter(item=>item?.metricReady===true).length;
    const summary={
      ...(playerCards.summary||{}),
      status:testability?.status||'INDISPONIBLE',
      detectedPlayerCards:evidence.length,
      players:eligibleEvidence.length,
      excludedNonClubPlayers:Math.max(0,evidence.length-eligibleEvidence.length),
      withTracking:eligibleEvidence.filter(item=>item?.tracking===true).length,
      withPitchTrajectory:eligibleEvidence.filter(item=>item?.trajectory===true).length,
      withPitchHeatmap:eligibleEvidence.filter(item=>item?.heatmap===true).length,
      withMetricDistance:eligibleEvidence.filter(item=>item?.clubEligible!==false&&item?.missingPhysicalMetrics&&!item.missingPhysicalMetrics.includes('distance')).length,
      withMetricAvgSpeed:eligibleEvidence.filter(item=>item?.clubEligible!==false&&item?.missingPhysicalMetrics&&!item.missingPhysicalMetrics.includes('avgSpeed')).length,
      withMetricMaxSpeed:eligibleEvidence.filter(item=>item?.clubEligible!==false&&item?.missingPhysicalMetrics&&!item.missingPhysicalMetrics.includes('maxSpeed')).length,
      withMetricSprints:eligibleEvidence.filter(item=>item?.clubEligible!==false&&item?.missingPhysicalMetrics&&!item.missingPhysicalMetrics.includes('sprints')).length,
      withPitchResults:coreReadyPlayers,
      withCorePitchVisuals:coreReadyPlayers,
      withCompletePhysicalMetrics:eligibleEvidence.filter(item=>item?.physicalComplete===true).length,
      metricReadyPlayers:physicalReadyPlayers,
      readinessPolicy:'RESUME_ALIGNE_SUR_CAY_FIRST_RESULTS_TESTABILITY_GATE; EN_CONTEXTE_ROSTER_LES_PISTES_NON_LIEES_RESTENT_DIAGNOSTIQUES_MAIS_SONT_EXCLUES_DES_RESULTATS_CAY; UN_VISUEL_TERRAIN_ISOLE_NE_DECLARE_PLUS_LA_FICHE_TERRAIN_PRETE'
    };
    return {...playerCards,players,summary,canonicalReadinessVersion:'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8'};
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
        report.playerCards={...alignPlayerCards(report.playerCards,testability),testability};
        report.firstResultsTestability=testability;
        return report;
      };
      return instance;
    };
    Bridge.__cayFirstResultsTestabilityPatched=true;
    return true;
  }

  installRuntime();
  return {rosterEligibility,cardEvidence,canonicalCardReadiness,alignPlayerCards,coverageEvidence,summarizeCoverage,coverageSummary,blockerCounts,nextAction,evaluate,installRuntime};
});